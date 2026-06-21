---
title: MySQL 锁机制完整笔记
date: "2025-12-29"
tags: [数据库, MySQL]
description: 全局语言全局锁 用作全量备份时，保证表与表之间数据的一致性 flush tables with read lock; unlock taables 备份 全局锁比较重，可以使用 --singgle-transaction...
published: true
---

# MySQL 锁机制完整笔记

> **背景：** 项目数据量逐步增长后，数据库层成为性能与一致性问题最集中的地方，下面是当时的完整记录与思考。

全局语言全局锁
用作全量备份时，保证表与表之间数据的一致性
flush tables with read lock;
unlock taables 备份

全局锁比较重，可以使用 --singgle-transaction参数来玩这不加锁的一致性备份（针对innoDB引擎）
mysqldump --singgle-transaction -u root -p pwd test > 1.sql

表级锁（innodb)
1.表锁
lock tables 表名 read/write, 解锁 unlock tables (read共享锁 其他客户端可以读，write排他锁 其他客户端不能读写)
2.元数据锁（隐式执行） 主要为了避免DML（增删改查） 与DDL（表定义语言）冲突
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444404581-958ddc76-b4f3-46d4-a726-962975d78bcf.png#clientId=udb2008f7-bca5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=147&id=u9bf1f7e4&name=image.png&originHeight=210&originWidth=813&originalType=binary&ratio=1&rotation=0&showTitle=false&size=64512&status=done&style=none&taskId=u544c327f-8c1a-43e9-b637-cec31319cdd&title=&width=567.5)
begin 后 进行查询时，就加上了元数据锁，不能修改表结构。commit后可修改。
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444417833-de741364-ab1c-48f2-9745-686cf8e4898d.png#clientId=udb2008f7-bca5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=300&id=u263dfaa3&name=image.png&originHeight=274&originWidth=349&originalType=binary&ratio=1&rotation=0&showTitle=false&size=50689&status=done&style=none&taskId=u0c862a00-d6a6-445b-8f2d-024e2b2d194&title=&width=381.5)

3.意向锁:IS(意向共享) 与 IX（意向排他），主要避免DML与表锁冲突
意向共享锁可以兼容表级的共享锁
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444424421-2fc45f48-a6cd-4ea8-9ac3-6d48d68e31a4.png#clientId=udb2008f7-bca5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=63&id=u16163858&name=image.png&originHeight=125&originWidth=826&originalType=binary&ratio=1&rotation=0&showTitle=false&size=65565&status=done&style=none&taskId=ufc773c09-5fc4-4931-87a5-c26b981968e&title=&width=413)

行级锁（InnoDB)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444432726-c48326d7-2e3e-4e2a-a542-e2b490562f77.png#clientId=udb2008f7-bca5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=264&id=u7e33bb6d&name=image.png&originHeight=527&originWidth=1305&originalType=binary&ratio=1&rotation=0&showTitle=false&size=246940&status=done&style=none&taskId=uc28e3465-f954-46b0-a8f7-2f15b8bc82a&title=&width=652.5)
1.行锁 - 在RC和RR下，锁住行，防止其他事务对此行进行update和delete
2.间隙锁 - 在RR下，锁住的是间隙，防止其他事物在这个间隙insert产生幻读。
3.临键锁 - 在RR下，锁住的是前面间隙+行，特定条件下可以优化为行锁
他们锁定的都是索引上的行和间隙，根据索引的有序性来确定间隙
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444443047-07563309-b3e8-44e9-a59a-36760a51d984.png#clientId=udb2008f7-bca5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=209&id=u242b1a03&name=image.png&originHeight=418&originWidth=866&originalType=binary&ratio=1&rotation=0&showTitle=false&size=142505&status=done&style=none&taskId=u09a6fdfe-add4-4b1b-bb8f-56b7ee5a57a&title=&width=433)
间隙指的是查询id索引时，id为整型情况下，1-4之间都有数据就没有间隙。4-8，8-12，12以上之间有间隙。
sql中对id=9 加锁，对应数据本身不存在，所以加上了8-12之间的间隙锁。 9，10，11均不可修改，8，12可修改。
临键锁一般出现在范围的查询加锁上，如图中 id>=8 给 8-12 12以上均加有临键锁。但是在8这条数据上加的是行级锁。不会锁到4-8的间隙。
