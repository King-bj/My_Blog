---
title: OceanBase 调研笔记（二）：分区、租户与运维
date: "2026-01-08"
tags: [数据库, MySQL]
description: "GRANT ALL PRIVILEGES ON oceanbase. TO 'dbadmin'@'%';"
published: true
---

# OceanBase 调研笔记（二）：分区、租户与运维

## 背景（Situation）

确定要迁移到 OceanBase 之后，需要把分区、租户、备份恢复等更细的概念也搞清楚。

## 目标（Task）

补充第一版笔记里没覆盖到的 OB 特有概念，作为团队培训材料。

## 行动（Action）

obclient -h127.0.0.1 -P2881 -uroot -p'***REDACTED***' -Doceanbase -A

obclient -h127.0.0.1 -P2881 -udbadmin -p'***REDACTED***' -Doceanbase -A

for file in *.sql; do /usr/bin/obclient -h127.0.0.1 -P2881 -udbadmin -p'***REDACTED***' -D powerauto_demo < "$file"; done

for file in *.sql; do /opt/bigmw/mysql/bin/mysql -h192.168.140.178 -P2881 -udbadmin -p'***REDACTED***' -D powerauto_demo_data < "$file"; done

for file in *.sql; do /opt/bigmw/bin/obclient -h127.0.0.1 -P2881 -udbadmin -p'***REDACTED***' -D powerauto_demo < "$file"; done

CREATE USER 'dbadmin'@'%' IDENTIFIED BY '***REDACTED***';  
GRANT ALL PRIVILEGES ON oceanbase.* TO 'dbadmin'@'%';

 /usr/bin/obclient -h127.0.0.1 -P2881 -udbadmin -p'***REDACTED***' -D powerauto <

## 收获（Result）

团队成员上手 OB 的时间从 1 周缩短到 2 天，迁移项目按期完成。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
