---
title: HashMap 原理：哈希、冲突、扩容与树化
date: "2026-03-06"
tags: [Java, Spring]
description: 1.数组+链表结构 2.数组长度达到64，链表长度大于8，该条链表会变更红黑树 3.树化的目的是放置DOS攻击，因为hash值如果足够随机，则在hash表内按泊松分布，在负载因子为0.75的情况下，长度超过8的概率是亿分...
published: true
---

# HashMap 原理：哈希、冲突、扩容与树化

## 背景（Situation）

面试与日常 code review 都常常涉及 HashMap，但成员理解参差不齐。

## 目标（Task）

把 hash → 寻址 → 冲突 → 扩容 → JDK8 的链表转红黑树这条主线说清楚。

## 行动（Action）

1.数组+链表结构
2.数组长度达到64，链表长度大于8，该条链表会变更红黑树
3.树化的目的是放置DOS攻击，因为hash值如果足够随机，则在hash表内按泊松分布，在负载因子为0.75的情况下，长度超过8的概率是亿分之6
4.在扩容时，如果拆分数组，链表长度小于6会退化
5.remove树节点时，如root.roo.left.root.right.root.left.left有一个为null退化

索引计算：
1.计算对象的hashCode(),再调用HashMap的hash()方法进行二次哈希，最后&（capacity -1 )得到索引（按位与数组大小-1）
2.二次hash()是为了综合高位数据，让哈希分布更加均匀
3.计算索引时，如果是2的n次幂可以使用位与运算代替取模，效率更高；扩容时，hash & oldCap（旧数组长度） ==0的 元素留在原来位置，否则新位置 = 旧位置 +oldCap
4.但123都是为了配合容量为2的n次幂的优化手段，hashtable的容量就不是2的n次幂。只是设计者综合各种因素选择了2的n次幂作为容量

![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444056692-b2d2b618-8733-4c58-94d6-0b9e3c2e1105.png#clientId=u3a3cc888-0bbd-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=573&id=ub401b67f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=375&originWidth=497&originalType=binary&ratio=1&rotation=0&showTitle=false&size=110715&status=done&style=none&taskId=ue7d9ba3d-660b-4f21-bcd0-2685addc916&title=&width=759.5)

## 收获（Result）

作为新人技术夜校讲材料后，团队对集合类的认知提升了一档。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
