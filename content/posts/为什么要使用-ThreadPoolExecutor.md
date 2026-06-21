---
title: 为什么不要用 Executors，而要直接 new ThreadPoolExecutor
date: "2026-04-03"
tags: [Java, Spring]
description: Spring / Java 主技术栈的原理梳理与排查记录。
published: true
---

# 为什么不要用 Executors，而要直接 new ThreadPoolExecutor

## 背景（Situation）

老代码大量使用 `Executors.newFixedThreadPool`，曾经因为无界队列把 JVM 撑爆。

## 目标（Task）

给团队讲清楚为什么应该直接用 ThreadPoolExecutor 自定义参数，而不是用 Executors 的工厂方法。

## 行动（Action）

### Executors方法创建的5种常用线程池

- newCachedThreadPool	可缓存的线程池
- newFixedThreadPool	固定大小的线程池
- newSingleThreadExecutor	固定单个线程的线程池
- newScheduledThreadPool	用作任务调度的线程池
- newWorkStealingPool	足够大小的线程池，JDK1.8新增的

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444137971-ba285e2e-f68f-4115-9097-e5b8509c34cd.png#clientId=u9f47e221-a68f-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=484&id=u8ee49eab&margin=%5Bobject%20Object%5D&name=image.png&originHeight=491&originWidth=641&originalType=binary&ratio=1&rotation=0&showTitle=false&size=46944&status=done&style=none&taskId=u6c1c2b42-a934-4951-9a3b-7159375dd40&title=&width=632.5)

Executors方法创建的5种常用线程池 前4种都是利用**ThreadPoolExecutor**创建的， 线程池底层使用的都是ThreadPoolExecutor，只不过对于相应的参数Executors已经贴心的帮开发们设置好了。但正是Executors将底层的具体细节进行封装，使得开发无法进行线程池执行过程的掌控和根据实际情况进行线程池的修改。对于多线程的使用来说，这是一个很危险的事情。所以，为了能够让开发能够详细了解到线程池的运作机制，在《阿里巴巴Java开发手册》中推荐使用ThreadPoolExecutor而不是Executors来创建线程池

## 收获（Result）

新代码统一用自定义线程池工具类，所有参数显式配置；这条规则进了团队代码规范。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
