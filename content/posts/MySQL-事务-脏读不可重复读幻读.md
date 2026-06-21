---
title: MySQL 事务：脏读、不可重复读、幻读全梳理
date: "2025-11-30"
tags: [数据库, MySQL]
description: A事务执行过程中，B事务读取了A事务的修改。但是由于某些原因，A事务可能没有完成提交，发生RollBack了操作，则B事务所读取的数据就会是不正确的。这个未提交数据就是脏读（Dirty Read） B事务读取了两次数据，...
published: true
---

# MySQL 事务：脏读、不可重复读、幻读全梳理

> **背景：** 项目数据量逐步增长后，数据库层成为性能与一致性问题最集中的地方，下面是当时的完整记录与思考。

### 脏读

A事务执行过程中，B事务读取了A事务的修改。但是由于某些原因，A事务可能没有完成提交，发生RollBack了操作，则B事务所读取的数据就会是不正确的。这个未提交数据就是脏读（Dirty Read）
不可重复读
B事务读取了两次数据，在这两次的读取过程中A事务修改了数据，B事务的这两次读取出来的数据不一样。B事务这种读取的结果，即为不可重复读（Nonrepeatable Read）
不可重复读有一种特殊情况，两个事务更新同一条数据资源，后完成的事务会造成先完成的事务更新丢失。这种情况就是大名鼎鼎的第二类丢失更新。主流的数据库已经默认屏蔽了第一类丢失更新问题（即：后做的事务撤销，发生回滚造成已完成事务的更新丢失），但我们编程的时候仍需要特别注意第二类丢失更新
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444505588-6cf4348f-5bfb-486a-80fe-e55ff883c7a8.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=358&id=ucf35e8cc&name=image.png&originHeight=715&originWidth=1338&originalType=binary&ratio=1&rotation=0&showTitle=false&size=165997&status=done&style=none&taskId=u0569284b-2cf8-4e73-9a57-c1fb75cc9f9&title=&width=669)
### 
幻读

B事务读取了两次数据，在这两次的读取过程中A事务添加了数据，B事务的这两次读取出来的集合不一样。这个流程看起来和不可重复读差不多，但幻读强调的集合的增减，而不是单独一条数据的修改（通过提高隔离级别或加for update锁可以避免）

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444791981-df236a1e-fa17-41cd-b441-46c4ae12a9e5.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=502&id=u316580ad&name=image.png&originHeight=1004&originWidth=1816&originalType=binary&ratio=1&rotation=0&showTitle=false&size=350192&status=done&style=none&taskId=u822c16e6-196f-4a1c-b34e-68d932459e7&title=&width=908)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444745462-4141f612-fb12-4cd1-a854-26dbcde853ef.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=441&id=ud44328ac&name=image.png&originHeight=881&originWidth=2039&originalType=binary&ratio=1&rotation=0&showTitle=false&size=300444&status=done&style=none&taskId=u5a82c933-ffef-42ac-9ff1-b260b030a41&title=&width=1019.5)

### 隔离级别：

1. 未提交读 - 读到其他事务未提交的版本（最新的版本）
   1. 错误现象：有脏读、不可重复读、幻读现象
2. 提交读（RC） - 读到其他事务已经提交的数据（最新已提交版本）
   1. 错误现象：有不可重复读、幻读现象
   2. 使用场景：希望看到最新的有效值
3. 可重复读（RR） - 在事务范围内，多次读能够保证一致性（快照建立时最新已提交版本）
   1. 错误现象：有幻读现象，可以用加锁避免
   2. 使用场景：事务内要求更强的一致性，但看到的未必是最新的有效值
4. 串行读 - 在事务范围内，仅有读读可以并发，读写或写写会阻塞其他事务，用这种办法保证更强的一致性
   1. 错误现象：无

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444817006-fe097ed3-cfd3-4a18-95f1-bf98cc3d4227.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=334&id=ub1d5f49c&name=image.png&originHeight=667&originWidth=1141&originalType=binary&ratio=1&rotation=0&showTitle=false&size=206518&status=done&style=none&taskId=ud5da9a15-e246-40f4-9b2f-8a97766ad50&title=&width=570.5)

![7ab890ed82d37c18129b12d92b2917ce.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444851357-c9ee819c-e2d6-487e-9613-fbbdd3f1381c.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=338&id=uc0209b27&name=7ab890ed82d37c18129b12d92b2917ce.png&originHeight=675&originWidth=1338&originalType=binary&ratio=1&rotation=0&showTitle=false&size=183515&status=done&style=none&taskId=u9079f72f-8872-4893-a587-cc220854108&title=&width=669)
![99a10045d3aee991e11476c86932cbe0.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445187508-e28b3bbc-97d0-41f7-9dc6-44f065e15400.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=256&id=u371be7dc&name=99a10045d3aee991e11476c86932cbe0.png&originHeight=511&originWidth=1373&originalType=binary&ratio=1&rotation=0&showTitle=false&size=156240&status=done&style=none&taskId=u668ab751-236b-4852-a368-611a1668bb4&title=&width=686.5)
![179c071488b63d2d0898842f7a3821a5.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445293205-0d6f403b-fc87-49fe-b7af-255bc7541170.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=386&id=uf7bff26e&name=179c071488b63d2d0898842f7a3821a5.png&originHeight=771&originWidth=1414&originalType=binary&ratio=1&rotation=0&showTitle=false&size=208032&status=done&style=none&taskId=u90bd105b-efa3-4a44-a2a9-78c90ac4be4&title=&width=707)

### 存储引擎

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445306128-1f43a546-3563-4f54-ac22-f2bbc3c27686.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=337&id=u24547bea&name=image.png&originHeight=674&originWidth=1068&originalType=binary&ratio=1&rotation=0&showTitle=false&size=193940&status=done&style=none&taskId=u7cc67d70-181f-4dd0-b4db-3dc05a8058f&title=&width=534)
聚簇索引：主键作为索引数据，叶子节点包含所有字段数据。也就是吧索引和数据合二为一了
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445319150-9a6ee76b-53fc-4c1f-91f8-d62f3ef45130.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=328&id=u33ca0104&name=image.png&originHeight=656&originWidth=1398&originalType=binary&ratio=1&rotation=0&showTitle=false&size=320516&status=done&style=none&taskId=u4e3c639c-b0e2-4cc9-8215-e344e04a5ca&title=&width=699)

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445326463-db64301f-aea3-415b-96b8-7cfb3e7a3405.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=360&id=u4cb36f6e&name=image.png&originHeight=719&originWidth=1394&originalType=binary&ratio=1&rotation=0&showTitle=false&size=386374&status=done&style=none&taskId=ud9b12f66-8b0d-4ed2-8c91-776f284650b&title=&width=697)

MyISAM 表和索引数据分离

### 为什么Mysql采用B+树索引

![8fd8074a22b5fed8587a0713e6bfd73d.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445366240-1e01aced-d922-41f3-ad6c-fbe5af0e011a.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=340&id=u53f0866d&name=8fd8074a22b5fed8587a0713e6bfd73d.png&originHeight=679&originWidth=1339&originalType=binary&ratio=1&rotation=0&showTitle=false&size=284453&status=done&style=none&taskId=uada6f5b9-71e3-43d3-bc8d-803abb4d534&title=&width=669.5)

B+树更支持磁盘空间的查询，而且它也支持等值查询，范围查询
B树和B+树区别：

1. 列表项B树叶子节点和非叶子都存了key和value B+Tree普通节点只存key，叶子节点才存key和value
2. B+Tree叶子节点之间用链表链接，方便范围查询和全表遍历
3. BTree和B+Tree 都是平衡n叉树，叶子节点到根节点距离都相同，B+Tree只有到达叶子节点才能找到value

B+Tree的新增查询和删除
新增：
0的时候直接新增，既是叶子节点也只根节点。
叶子节点新增到大于阶数时，按阶数/2分成两部分，并把中间叶子节点的key上移，形成一个子节点，并且保留中间节点在叶子节点中。
子节点新增到大于阶数是，按阶数/2分成两部分，并把中间子节点的key上移，形成一个子节点，不保留中间节点
查询：
节点的左边都是小于该节点的，右边都是大于该节点的
删除：
删除后，节点数量大于（阶数/2） - 1成为有富余
删除叶子节点，如果自己有富余直接删除
删除叶子节点，自己不富余，但兄弟节点有富余，向兄弟节点借一个，并对父节点做调整
删除叶子节点，自己不富余，兄弟节点也不富余，就合并兄弟节点，并删除父节点中的key,将当前节点执行父节点
删除子节点
非叶子节点key有富余,删除结束
兄弟节点有富余，父节点key下移，兄弟节点key上移，删除结束
兄弟节点没有富余，当前节点和兄弟节点合并

### Mysql查询过程

![cb1903d75bd6cd345be4386f49b0b963.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445532845-b3449fa7-f0d9-4a21-b978-124916143339.png#clientId=ud7808f0e-c433-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=374&id=u5357c4bd&name=cb1903d75bd6cd345be4386f49b0b963.png&originHeight=747&originWidth=1366&originalType=binary&ratio=1&rotation=0&showTitle=false&size=277798&status=done&style=none&taskId=ucdf4947d-6afd-41b0-824b-4b3ebce8c3c&title=&width=683)
