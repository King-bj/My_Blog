---
title: ZooKeeper 超时异常工作笔记
date: "2026-03-03"
tags: [中间件]
description: 索引名在zookeeper中存储，服务通过通知读取zookeeper变化更新写入的索引，偶发性的出现索引变化后服务端写入的索引未变化 服务端会话超时sessionTimeout导致客户端连接失效，比如设置了5秒超时时间，...
published: true
---

# ZooKeeper 超时异常工作笔记

## 背景（Situation）

实时链路里同时存在 Kafka、Flink、ZooKeeper、Dubbo 等多种中间件，出问题时往往牵一发动全身。

## 目标（Task）

把这次涉及的中间件知识点 / 故障现象 / 处理思路完整记录，沉淀成可复用的经验。

## 行动（Action）

### 现象
索引名在zookeeper中存储，服务通过通知读取zookeeper变化更新写入的索引，偶发性的出现索引变化后服务端写入的索引未变化
### 原因
#### 简述
服务端会话超时sessionTimeout导致客户端连接失效，比如设置了5秒超时时间，因为网络原因5秒没有能连接到服务端，服务端会自动剔除该节点，如果后续又重新恢复网络了再用之前的sessionid去连接就会报错KeeperErrorCode = Session expired

#### 详细原因：
客户端的会话超时时间sessionTimeout由客户端和服务端协商决定。 ZooKeeper客户端在和服务端建立连接的时候，会提交一个客户端设置的会话超时时间（下面使用clientSessionTimeout代称）
ZooKeeper服务端有两个配置项：最小超时时间（minSessionTimeout）和最大超时时间（maxSessionTimeout）， 它们的默认值分别为tickTime的2倍和20倍（也可以通过zoo.cfg进行设置）。
最终协商的会话超时时间sessionTimeout计算规则如下所示：

````java
if (clientSessionTimeout < minSessionTimeout) {
    sessionTimeout = minSessionTimeout;
} else if (clientSessionTimeout > maxSessionTimeout) {
    sessionTimeout = maxSessionTimeout;
} else {
    sessionTimeout = clientSessionTimeout;
}
````
ZooKeeper服务端将所有客户端连接按会话超时时间进行了分桶，分桶中每一个桶的坐标为客户端会话的下一次会话超时检测时间点（按分桶的最大桶数取模，所以所有客户端的下一次会话超时检测时间点都会落在不超过最大桶数的点上）。参考ZooKeeper服务端源码{@link org.apache.zookeeper.server.ExpiryQueue}，在客户端执行请求操作时（如复用sessionId和sessionPassword重新建立连接请求），服务端将检查会话是否超时，如果发生会话超时：
- 服务端对客户端的操作请求，将响应会话超时的错误码org.apache.zookeeper.KeeperException.Code.SESSIONEXPIRED
- 客户端收到服务端响应的错误码后，将抛出org.apache.zookeeper.KeeperException.SessionExpiredException异常
- 客户端注册的Watcher也将收到Watcher.Event.KeeperState.Expired通知
这种情况下，客户端需要主动重新创建连接（即重新创建ZooKeeper实例对象），然后使用新的连接重试操作。
### 解决方案
- 设置超时时间久一点，创建连接时的session.timeout加大，并修改zookeeper配置文件里的minSessionTimeout，maxSessionTimeout
- 在代码里补全超时重连的机制

### 参考
java - ZooKeeper的超时异常_个人文章 - SegmentFault 思否

## 收获（Result）

整理之后这部分内容成了团队内的标准参考，再次遇到类似场景时可以直接复用。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
