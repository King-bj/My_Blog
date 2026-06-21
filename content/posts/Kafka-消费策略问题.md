---
title: Kafka auto.offset.reset 消费策略踩坑
date: "2026-02-05"
tags: [中间件]
description: 中间件实战中的故障、原理与处理思路。
published: true
---

# Kafka auto.offset.reset 消费策略踩坑

## 背景（Situation）

日志采集链路里，新上的 consumer 总是从 latest 开始消费，导致回溯丢数据。

## 目标（Task）

搞清楚 `auto.offset.reset` 在各种边界场景下的实际行为。

## 行动（Action）

- 消费者数量 == partitions数量 每个消费组能读取到一个固定的partition的数据
- 消费者数量 > partitions数量 比如2个消费者1个partition，只有一个消费者能读取到数据
- 消费者数量 < partitions数量 比如2个消费者3个partition, 每个消费者能读取到一个固定的partition的数据，第三个消费根据消费策略来确定谁读取。默认是第一个消费者读取

## 收获（Result）

把消费策略写进部署模板，再没出现过"重启就丢消息"的事件。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
