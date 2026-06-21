---
title: Java 类加载机制与双亲委派
date: "2025-06-10"
tags: [Java]
description: "Java 类加载三阶段（加载/链接/初始化）与双亲委派模型详解，含 AppClassLoader/ExtClassLoader/BootstrapClassLoader 层级及 jhsdb 调试示例。"
published: true
---

# Java 类加载机制与双亲委派

## 背景（Situation）

排查一个 ClassNotFoundException 时，发现团队对类加载器层次的理解还有模糊的地方。

## 目标（Task）

把 BootstrapClassLoader → ExtClassLoader → AppClassLoader 的双亲委派模型说清楚。

## 行动（Action）

工具：
jdk自带的 jhsdb 用hsdb参数 带图形界面的Debug
hsdb 图形界面可以用universe查看堆内存的地址
使用jps 查看进程号
类加载三个阶段

1. 加载 
   - 类的字节码载入方法去，创建类.class对象（在堆中）
   - 如果此类的父类没有加载，先加载父类
   - 加载是懒惰执行
2. 链接 
   - 验证 验证类是否符合Class规范 合法性 安全性检查
   - 准备 为static变量分配空间，设置默认值
   - 解析 将常量池的符号引用解析为直接引用
3. 初始化 
   - 执行静态代码块与非final静态变量的赋值（final变量在链接阶段赋值）
   - 初始化是懒惰执行

双亲委派： 优先委托上级类加载器进行加载，如果上级加载器能加载这个类，由上级加载，加载后该类也对下级加载器可见。如果找不到这个类，则下级类加载器才有资格执行加载

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444015475-cf55bfc9-dde3-42a2-b521-30a39aed0db5.png#clientId=ucc0ce7a4-969b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=186&id=u40907a24&margin=%5Bobject%20Object%5D&name=image.png&originHeight=372&originWidth=1205&originalType=binary&ratio=1&rotation=0&showTitle=false&size=105626&status=done&style=none&taskId=u153cb233-9f0d-463b-94a3-e9cb908c3ee&title=&width=602.5)

## 收获（Result）

后续团队再遇到类冲突、热加载问题时基本都能自己定位，不再需要我兜底。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
