---
title: MySQL 三大日志：redo / undo / binlog 全梳理
date: "2024-04-10"
tags: [MySQL, 架构设计]
description: undo log 回滚数据，以行为单位，记录数据每次的变更，一行记录有多个版本并存 多版本并发控制，即快照读（一致性读），让查询操作可以去访问历史版本 trxid 修改的事务ID roll ptr是指向了上个版本，快照读...
published: true
---

# MySQL 三大日志：redo / undo / binlog 全梳理

## 背景（Situation）

MySQL 出过几次主从延迟与误删数据，恢复时需要熟悉各种日志的角色。

## 目标（Task）

把 redo log / undo log / binlog 各自的用途、写入时机、配置项整理清楚。

## 行动（Action）

undo log
回滚数据，以行为单位，记录数据每次的变更，一行记录有多个版本并存
多版本并发控制，即快照读（一致性读），让查询操作可以去访问历史版本
trxid 修改的事务ID roll ptr是指向了上个版本，快照读只会读比当前事务的ID小的undo log 记录
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445570786-1f293ccf-f2d5-46fa-996d-ace3e6439295.png#clientId=uce755cae-86de-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=248&id=ub346bd8c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=496&originWidth=1187&originalType=binary&ratio=1&rotation=0&showTitle=false&size=191371&status=done&style=none&taskId=u893bdaae-c218-4264-b3bb-a85082115cf&title=&width=593.5)

redolog 主要实现持久性，保证提交的数据不丢失
记录了事务提交的变更操作，服务器宕机时，利用redo log 进行回放。
事务提交时，首先将变更写入redo log ，事务就视为成功
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445578266-202c8e8c-b566-4906-8843-b14ef5008db9.png#clientId=uce755cae-86de-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=311&id=uad877cda&margin=%5Bobject%20Object%5D&name=image.png&originHeight=622&originWidth=1353&originalType=binary&ratio=1&rotation=0&showTitle=false&size=355220&status=done&style=none&taskId=u77651f20-1b4a-440a-8b57-68a1408080d&title=&width=676.5)

## 收获（Result）

再次面对主从延迟或恢复场景时，能直接根据日志类型选定恢复路径，操作变得有据可依。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
