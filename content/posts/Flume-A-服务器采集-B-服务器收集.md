---
title: Flume 跨机房采集：A 推送、B 汇聚
date: "2026-01-26"
tags: [中间件]
description: 中间件实战中的故障、原理与处理思路。
published: true
---

# Flume 跨机房采集：A 推送、B 汇聚

## 背景（Situation）

跨机房采集日志，A 机房本地 agent 把日志推到 B 机房的汇聚 collector。

## 目标（Task）

搭一套基于 Flume 的两级采集链路，保证断网时不丢日志。

## 行动（Action）

采集机器配置
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1657332760239-8fa59c6e-dfb5-4411-99ae-f77e1d0a3286.png#clientId=u35fb1c07-a1f4-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=464&id=u247cfbaf&margin=%5Bobject%20Object%5D&name=image.png&originHeight=928&originWidth=1907&originalType=binary&ratio=1&rotation=0&showTitle=false&size=589724&status=done&style=none&taskId=ue89130b0-01df-49fa-888e-2be9c0edbd7&title=&width=953.5)
收集机器配置
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1657332821489-2bc512de-f4f2-474a-bdc4-5248c177231e.png#clientId=u35fb1c07-a1f4-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=418&id=u685fb7d0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=835&originWidth=1682&originalType=binary&ratio=1&rotation=0&showTitle=false&size=468336&status=done&style=none&taskId=u7465850c-1276-4f7a-a343-454d76d77a4&title=&width=841)
先启动收集机器 再启动采集机器

Kafka配置
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1657333286821-8f3111d4-b477-492c-b81e-9165b8bfd9f6.png#clientId=u2670bb32-ae8a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=483&id=uba8f5c76&margin=%5Bobject%20Object%5D&name=image.png&originHeight=965&originWidth=2022&originalType=binary&ratio=1&rotation=0&showTitle=false&size=687412&status=done&style=none&taskId=u42bef112-327c-4787-8ecb-1ab6c288309&title=&width=1011)

## 收获（Result）

链路稳定运行了一年多，期间机房之间多次断网均自动恢复，零数据丢失。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
