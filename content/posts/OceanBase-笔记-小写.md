---
title: OceanBase 调研笔记（一）：协议与 SQL 差异
date: "2026-01-05"
tags: [数据库, MySQL]
description: obd demo -c oceanbase-ce obd cluster start demo obd cluster list obd cluster display demo obd cluster stop dem...
published: true
---

# OceanBase 调研笔记（一）：协议与 SQL 差异

## 背景（Situation）

客户要求把现有 MySQL 集群迁移到 OceanBase，我负责调研可行性与差异点。

## 目标（Task）

先把 OB 与 MySQL 在协议、SQL、运维上的差异点搞清楚。

## 行动（Action）

obd demo -c oceanbase-ce
重启
obd cluster start demo

# 查看集群列表
obd cluster list

# 查看集群状态，以部署名为 obtest 为例
obd cluster display demo

# 停止运行中的集群，以部署名为 obtest 为例
obd cluster stop demo

## 收获（Result）

这份初步笔记后来扩展成团队内迁移评审材料，避免了几个早期就发现的兼容性坑。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
