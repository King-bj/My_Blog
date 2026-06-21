---
title: ZooKeeper 超时异常深入分析
date: "2026-02-21"
tags: [中间件]
description: "[setamv](https://segmentfault.com/u/setamv_5dd0b5b8a405b)发布于 2019-11-17 ZooKeeper的超时异常包括两种：1）客户端的readTimeout导致..."
published: true
---

# ZooKeeper 超时异常深入分析

> **背景：** 实时链路里同时存在 Kafka、Flink、ZooKeeper、Dubbo 等多种中间件，出问题时往往牵一发动全身，下面是当时的完整记录与思考。

[_[图片]_](https://segmentfault.com/)

# [ZooKeeper的超时异常](https://segmentfault.com/a/1190000021032892)

[_[图片]_**setamv**](https://segmentfault.com/u/setamv_5dd0b5b8a405b)发布于 2019-11-17

## ZooKeeper的超时异常

ZooKeeper的超时异常包括两种：1）客户端的readTimeout导致连接丢失；2）服务端会话超时sessionTimeout导致客户端连接失效

### 客户端的readTimeout导致连接丢失

ZooKeeper客户端的readTimeout无法设置，它的值是根据会话超时时间计算出来的。计算规则为：

1.  当客户端还未完成连接（即服务端还未完成客户端会话的创建，未通知客户端Watcher.Event.KeeperState.SyncConnected消息）之前
    此时readTimeout为客户端设置的sessionTimeout * 2 / 3（即ZooKeeper.ZooKeeper(String, int, Watcher)中的sessionTimeout参数值）。
    参考ZooKeeper源码org.apache.zookeeper.ClientCnxn的第430行：
    
    ```
     readTimeout = sessionTimeout * 2 / 3
    ```
    
2.  当客户端完成连接后
    readTimeout为客户端和服务端协商后的sessionTimeout * 2 / 3。
    参考ZooKeeper源码org.apache.zookeeper.ClientCnxn的第1405行：
    
    ```
     readTimeout = negotiatedSessionTimeout * 2 / 3
    ```
    

当客户端在readTimeout时间内，都未收到服务端发送的数据包，将发生连接丢失，参考ZooKeeper源码org.apache.zookeeper.ClientCnxn第1208行代码，如下所示

```
 to = readTimeout - clientCnxnSocket.getIdleRecv();
   if (to <= 0) {
        String warnInfo;
        warnInfo = "Client session timed out, have not heard from server in "
            + clientCnxnSocket.getIdleRecv() + "ms"
            + " for sessionid 0x" + Long.toHexString(sessionId);
        LOG.warn(warnInfo);
        throw new SessionTimeoutException(warnInfo);
    }
```

当发生连接丢失时：

1.  客户端的请求操作将抛出org.apache.zookeeper.KeeperException.ConnectionLossException异常
2.  客户端注册的Watcher也将收到Watcher.Event.KeeperState.Disconnected通知

但是，这种时候一般还未发生会话超时，ZooKeeper客户端在下次执行请求操作的时候，会先执行自动重连，重新连接成功后，再执行操作请求。因此下一次操作请求一般情况下并不会出现问题。

### 服务端会话超时sessionTimeout导致客户端连接失效

客户端的会话超时时间sessionTimeout由客户端和服务端协商决定。 ZooKeeper客户端在和服务端建立连接的时候，会提交一个客户端设置的会话超时时间（下面使用clientSessionTimeout代称）
ZooKeeper服务端有两个配置项：最小超时时间（minSessionTimeout）和最大超时时间（maxSessionTimeout）， 它们的默认值分别为tickTime的2倍和20倍（也可以通过zoo.cfg进行设置）。
最终协商的会话超时时间sessionTimeout计算规则如下所示：

```
if (clientSessionTimeout < minSessionTimeout) {
    sessionTimeout = minSessionTimeout;
} else if (clientSessionTimeout > maxSessionTimeout) {
    sessionTimeout = maxSessionTimeout;
} else {
    sessionTimeout = clientSessionTimeout;
}
```

ZooKeeper服务端将所有客户端连接按会话超时时间进行了分桶，分桶中每一个桶的坐标为客户端会话的下一次会话超时检测时间点（按分桶的最大桶数取模，所以所有客户端的下一次会话超时检测时间点都会落在不超过最大桶数的点上）。参考ZooKeeper服务端源码{@link org.apache.zookeeper.server.ExpiryQueue}，在客户端执行请求操作时（如复用sessionId和sessionPassword重新建立连接请求），服务端将检查会话是否超时，如果发生会话超时：

1.  服务端对客户端的操作请求，将响应会话超时的错误码org.apache.zookeeper.KeeperException.Code.SESSIONEXPIRED
2.  客户端收到服务端响应的错误码后，将抛出org.apache.zookeeper.KeeperException.SessionExpiredException异常
3.  客户端注册的Watcher也将收到Watcher.Event.KeeperState.Expired通知

这种情况下，客户端需要主动重新创建连接（即重新创建ZooKeeper实例对象），然后使用新的连接重试操作。

### 注意

1.  连接丢失异常，是由ZooKeeper客户端检测到并主动抛出的错误
2.  会话超时异常，是由ZooKeeper服务端检测到客户端的会话超时后，通知客户端的

### 如何模拟readTimeout的发生？

只需要在ZooKeeper执行操作请求之前，在执行请求操作的代码行增加debug断点，并让debug断点停留的时间在(readTimeout, sessionTimeout)之间，就可以模拟发生连接丢失的现象。
例如，ZooKeeper服务端的tickTime设置的2秒，则ZooKeeper服务端的minSessionTimeout=4秒，maxSessionTimeout=40秒，如果客户端建立连接时请求的会话超时时间为9秒， 则最终协商的会话超时时间将是9秒（因为9秒大于4秒且小于40秒）。从而，readTimeout = 9 * 2 / 3 = 6秒。 只要在ZooKeeper客户端执行请求的代码处debug断点停留时间在(6秒, 9秒)之间，就会发生连接丢失的现象。

### 如何模拟会话超时的发生？

只需要在ZooKeeper执行操作请求之前，在执行操作的代码行增加debug断点，并让debug断点停留的时间超过sessionTimeout，就可以模拟发生会话超时的现象。
例如，ZooKeeper服务端的tickTime设置的2秒，则ZooKeeper服务端的minSessionTimeout=4秒，maxSessionTimeout=40秒，如果客户端建立连接时请求的会话超时时间为9秒， 则最终协商的会话超时时间将是9秒（因为9秒大于4秒且小于40秒）。 只要在ZooKeeper客户端执行请求的代码处debug断点停留时间大于9秒，就会发生会话超时的现象。

### 测试代码

```
package org.setamv.jsetamv.thirdparty.zookeeper.official;

import java.util.concurrent.Callable;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException.ConnectionLossException;
import org.apache.zookeeper.KeeperException.SessionExpiredException;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.Watcher.Event.KeeperState;
import org.apache.zookeeper.ZooDefs.Ids;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.data.Stat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 下面演示ZooKeeper客户端的超时异常处理。
 * <p>ZooKeeper的超时异常包括两种：1）客户端的readTimeout导致连接丢失；2）客户端的会话超时sessionTimeout导致需要连接失效。
 * <p><p><b>客户端的readTimeout导致连接丢失</b>
 * <p>ZooKeeper客户端的readTimeout无法设置，它的值是根据会话超时时间计算出来的。计算规则为：<ul>
 *     <li>当客户端还未完成连接（即服务端还未完成客户端会话的创建，未通知客户端{@link KeeperState#SyncConnected}消息）之前，
 *          readTimeout为客户端设置的sessionTimeout * 2 / 3（即{@link ZooKeeper#ZooKeeper(String, int, Watcher)}中的sessionTimeout参数值）。<br/>
 *          参考ZooKeeper源码{@link org.apache.zookeeper.ClientCnxn}的第430行：<pre>
 *              readTimeout = sessionTimeout * 2 / 3
 *          </pre></li>
 *     <li>当客户端完成连接后，readTimeout为客户端和服务端协商后的sessionTimeout * 2 / 3。<br/>
 *          参考ZooKeeper源码{@link org.apache.zookeeper.ClientCnxn}的第1405行：<pre>
 *              readTimeout = negotiatedSessionTimeout * 2 / 3
 *          </pre></li>
 * </ul>
 * 当客户端在readTimeout时间内，都未收到服务端发送的数据包，将发生连接丢失，参考ZooKeeper源码{@link org.apache.zookeeper.ClientCnxn}第1208行代码，如下所示<pre>
 *     if (to <= 0) {
 *          String warnInfo;
 *          warnInfo = "Client session timed out, have not heard from server in "
 *              + clientCnxnSocket.getIdleRecv() + "ms"
 *              + " for sessionid 0x" + Long.toHexString(sessionId);
 *          LOG.warn(warnInfo);
 *          throw new SessionTimeoutException(warnInfo);
 *      }
 * </pre>
 * 此时：<ul>
 *     <li>客户端的请求操作将抛出{@link ConnectionLossException}异常</li>
 *     <li>客户端注册的Watcher也将收到{@link KeeperState#Disconnected}通知</li>
 * </ul>
 * 但是，这种时候一般还未发生会话超时，ZooKeeper客户端在下次执行请求操作的时候，会先执行自动重连，重新连接成功后，再执行操作请求。因此下一次操作请求一般情况下并不会出现问题。<br/>
 *
 *
 * <p><p><b>客户端的会话超时sessionTimeout导致需要连接失效</b>
 * <p>客户端的会话超时时间sessionTimeout由客户端和服务端协商决定。<br/>
 * ZooKeeper客户端在和服务端建立连接的时候，会提交一个客户端设置的会话超时时间（下面使用clientSessionTimeout代称）<br/>
 * ZooKeeper服务端有两个配置项：最小超时时间（minSessionTimeout）和最大超时时间（maxSessionTimeout），
 * 它们的默认值分别为tickTimed的2倍和20倍（也可以通过zoo.cfg进行设置）。<br/>
 * 最终协商的会话超时时间sessionTimeout计算规则如下所示：<pre>
 *     if (clientSessionTimeout < minSessionTimeout) {
 *         sessionTimeout = minSessionTimeout;
 *     } else if (clientSessionTimeout > maxSessionTimeout) {
 *         sessionTimeout = maxSessionTimeout;
 *     } else {
 *         sessionTimeout = clientSessionTimeout;
 *     }
 * </pre>
 * 在客户端执行请求操作时，服务端将检查会话是否超时，如果发生会话超时：<ul>
 *     <li>服务端对客户端的操作请求，将响应会话超时的错误码{@link org.apache.zookeeper.KeeperException.Code#SESSIONEXPIRED}</li>
 *     <li>客户端收到服务端响应的错误码后，将抛出{@link SessionExpiredException}异常</li>
 *     <li>客户端注册的Watcher也将收到{@link KeeperState#Expired}通知</li>
 * </ul>
 * 这种情况下，客户端需要主动重新创建连接（即重新创建{@link ZooKeeper}实例对象），然后使用新的连接重试操作。
 *
 * <p><p><b>注意</b><br/>
 * 1、连接丢失异常，是由ZooKeeper客户端检测到并主动抛出的错误<br/>
 * 2、会话超时异常，是由ZooKeeper服务端检测到客户端的会话超时后，通知客户端的
 *
 * <p><p><b>如何模拟readTimeout的发生？</b><br/>
 * 只需要在ZooKeeper只想操作请求之前，在执行操作的代码行增加debug断点，并让debug断点停留的时间在(readTimeout, sessionTimeout)之间，就可以模拟发生连接丢失的现象。<br/>
 * 例如，ZooKeeper服务端的tickTime设置的2秒，则ZooKeeper服务端的minSessionTimeout=4秒，maxSessionTimeout=40秒，如果客户端建立连接时请求的会话超时时间为9秒，
 * 则最终协商的会话超时时间将是9秒（因为9秒大于4秒且小于40秒）。从而，readTimeout = 9 * 2 / 3 = 6秒。<br/>
 * 只要在ZooKeeper客户端执行请求的代码处debug断点停留时间在(6秒, 9秒)之间，就会发生连接丢失的现象。
 *
 * <p><p><b>如何模拟会话超时的发生？</b><br/>
 * 只需要在ZooKeeper只想操作请求之前，在执行操作的代码行增加debug断点，并让debug断点停留的时间超过sessionTimeout，就可以模拟发生会话超时的现象。<br/>
 * 例如，ZooKeeper服务端的tickTime设置的9秒，则ZooKeeper服务端的minSessionTimeout=4秒，maxSessionTimeout=40秒，如果客户端建立连接时请求的会话超时时间为9秒，
 * 则最终协商的会话超时时间将是9秒（因为9秒大于4秒且小于40秒）。<br/>
 * 只要在ZooKeeper客户端执行请求的代码处debug断点停留时间大于9秒，就会发生会话超时的现象。
 */
public class ZooKeeperTimeoutHandleUsage {

    private static final Logger LOG = LoggerFactory.getLogger(ZooKeeperTimeoutHandleUsage.class);

    private volatile int counter = 0;

    private int sessionTimeout = 9000;

    private ZooKeeper zooKeeper;

    public ZooKeeperTimeoutHandleUsage() {
        zooKeeper = ZooKeeperUtil.buildInstance(sessionTimeout);
    }

    public static void main(String[] args) throws Exception {
        ZooKeeperTimeoutHandleUsage usage = new ZooKeeperTimeoutHandleUsage();
        usage.rightUsage();
    }

    /**
     * ZooKeeper操作的包装，主要处理连接丢失和会话超时的重试
     */
    public <V> V wrapperOperation(String operation, Callable<V> command) {
        int seq = ++counter;
        int retryTimes = 0;
        while (retryTimes <= 3) {
            try {
                LOG.info("[{}]准备执行操作：{}", seq, operation);
                V result = command.call();
                LOG.info("[{}]{}成功", seq, operation);
                return result;
            } catch (ConnectionLossException e) {
                // 连接丢失异常，重试。因为ZooKeeper客户端会自动重连
                LOG.error("[" + seq + "]" + operation + "失败！准备重试", e);
            } catch (SessionExpiredException e) {
                // 客户端会话超时，重新建立客户端连接
                LOG.error("[" + seq + "]" + operation + "失败！会话超时，准备重新创建会话，并重试操作", e);
                zooKeeper = ZooKeeperUtil.buildInstance(sessionTimeout);
            } catch (Exception e) {
                LOG.error("[" + seq + "]" + operation + "失败！", e);
            } finally {
                retryTimes++;
            }
        }
        return null;
    }

    public Watcher existsWatcher = new Watcher() {
        @Override
        public void process(WatchedEvent event) {
            ZooKeeperUtil.logWatchedEvent(LOG, event);
            if (KeeperState.SyncConnected == event.getState() && null != event.getPath()) {
                registerExistsWatcher(event.getPath());
            }
        }
    };

    public void registerExistsWatcher(String path) {
        try {
            zooKeeper.exists(path, existsWatcher);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void rightUsage() throws Exception {
        String path = ZooKeeperUtil.usagePath("/right-usage");
        String data = "demonstrate right usage of zookeeper client";

        registerExistsWatcher(path);

        // 创建节点
        String realPath = wrapperOperation("创建节点", () -> {
            return zooKeeper.create(path, data.getBytes(), Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT_SEQUENTIAL);
        });

        Long startTime = System.currentTimeMillis();
        // 在下面这一行设置断点，并让断点停留以模拟连接丢失或会话超时（假设会话超时时间为9秒）
        // 如果停留的时间在(sessionTimeout * 2 / 3 = 6秒,  sessionTimeout = 9秒）之间，将发生连接丢失
        // 如果停留的时间大于sessionTimeout = 9秒，将发生会话超时
        LOG.info("模拟ZooKeeper客户端和服务端失去网络连接{}秒。", (System.currentTimeMillis() - startTime) / 1000);

        // 获取节点数据
        wrapperOperation("获取节点数据", () -> {
            return zooKeeper.getData(realPath, false, new Stat());
        });

        // 获取节点数据
        wrapperOperation("设置节点数据", () -> {
            return zooKeeper.setData(realPath, (data + "-a").getBytes(), -1);
        });

        // 获取节点数据
        wrapperOperation("获取节点数据", () -> {
            return zooKeeper.getData(realPath, false, new Stat());
        });
    }
}

public class ZooKeeperUtil {
    /**
     * 按指定的超时时间构建ZooKeeper客户端实例
     * @param sessionTimeout
     * @return
     */
    public static ZooKeeper buildInstance(int sessionTimeout) {
        final CountDownLatch connectedSemaphore = new CountDownLatch(1);

        Watcher watcher = (watchedEvent) -> {
            ZooKeeperUtil.logWatchedEvent(LOG, watchedEvent);
            connectedSemaphore.countDown();
        };

        ZooKeeper zooKeeper;
        try {
            zooKeeper = new ZooKeeper(SERVERS, sessionTimeout, watcher);
            connectedSemaphore.await();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return zooKeeper;
    }
} 
```

### 连接丢失自动重连的演示日志

ZooKeeper服务端设置tickTime=2秒，客户端建立连接的请求中附带的会话超时时间为9秒，断点停留时间为6秒，出现以下日志（注意：`>>>>>>>>>>>>>>>>【说明】`不是日志内容，是对日志的说明）

```
>>>>>>>>>>>>>>>>【说明】前面是启动的一些日志，忽略
... 
10:10:18:858 [main] INFO  ZooKeeper - Initiating client connection, connectString=192.168.199.130:2181 sessionTimeout=9000 watcher=org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperUtil$$Lambda$1/1661081225@243c4f91
10:10:18:862 [main] DEBUG ClientCnxn - zookeeper.disableAutoWatchReset is false
10:10:19:024 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Opening socket connection to server 192.168.199.130/192.168.199.130:2181. Will not attempt to authenticate using SASL (unknown error)
10:10:19:026 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Socket connection established to 192.168.199.130/192.168.199.130:2181, initiating session
10:10:19:028 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Session establishment request sent on 192.168.199.130/192.168.199.130:2181

>>>>>>>>>>>>>>>>【说明】下面的日志可以看到最终协商的会话超时时间为9000毫秒，即9秒
10:10:19:033 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Session establishment complete on server 192.168.199.130/192.168.199.130:2181, sessionid = 0x1000000ceb80034, negotiated timeout = 9000
10:10:19:035 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=SyncConnected, eventType=None, path=null
10:10:19:042 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 1,3  replyHeader:: 1,542,-101  request:: '/usage/right-usage,T  response::  
10:10:19:045 [main] INFO  ZooKeeperTimeoutHandleUsage - [1]准备执行操作：创建节点
10:10:19:055 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 2,1  replyHeader:: 2,543,0  request:: '/usage/right-usage,#64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e74,v{s{31,s{'world,'anyone}}},2  response:: '/usage/right-usage0000000031 
10:10:19:055 [main] INFO  ZooKeeperTimeoutHandleUsage - [1]创建节点成功

>>>>>>>>>>>>>>>>【说明】收到客户端在6541ms时间内没有收到服务端的消息（因为debug断点停留导致）
10:10:25:595 [main-SendThread(192.168.199.130:2181)] WARN  ClientCnxn - Client session timed out, have not heard from server in 6541ms for sessionid 0x1000000ceb80034
10:10:25:596 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Client session timed out, have not heard from server in 6541ms for sessionid 0x1000000ceb80034, closing socket connection and attempting reconnect

>>>>>>>>>>>>>>>>【说明】这里是通过debug停留6秒模拟客户端和服务端断开网络6秒后的日志
10:10:25:596 [main] INFO  ZooKeeperTimeoutHandleUsage - 模拟ZooKeeper客户端和服务端失去网络连接6秒。
10:10:25:609 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]准备执行操作：获取节点数据
10:10:25:707 [main-EventThread] INFO  ZooKeeperTimeoutHandleUsage - 收到[watched event], state=Disconnected, eventType=None, path=null
10:10:25:709 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=Disconnected, eventType=None, path=null

>>>>>>>>>>>>>>>>【说明】发生连接丢失后重试操作
10:10:25:727 [main] ERROR ZooKeeperTimeoutHandleUsage - [2]获取节点数据失败！准备重试
org.apache.zookeeper.KeeperException$ConnectionLossException: KeeperErrorCode = ConnectionLoss for /usage/right-usage0000000031
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:102)
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:54)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1215)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1244)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.lambda$rightUsage$1(ZooKeeperTimeoutHandleUsage.java:169)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.wrapperOperation(ZooKeeperTimeoutHandleUsage.java:113)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.rightUsage(ZooKeeperTimeoutHandleUsage.java:168)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.main(ZooKeeperTimeoutHandleUsage.java:101)
10:10:25:727 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]准备执行操作：获取节点数据

>>>>>>>>>>>>>>>>【说明】下面的日志显示，ZooKeeper客户端在重试操作之前，自动进行了重连
10:10:27:700 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Opening socket connection to server 192.168.199.130/192.168.199.130:2181. Will not attempt to authenticate using SASL (unknown error)
10:10:27:701 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Socket connection established to 192.168.199.130/192.168.199.130:2181, initiating session
10:10:27:703 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Session establishment request sent on 192.168.199.130/192.168.199.130:2181
10:10:27:706 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Session establishment complete on server 192.168.199.130/192.168.199.130:2181, sessionid = 0x1000000ceb80034, negotiated timeout = 9000

>>>>>>>>>>>>>>>>【说明】ZooKeeper客户端自动重连成功
10:10:27:707 [main-EventThread] INFO  ZooKeeperTimeoutHandleUsage - 收到[watched event], state=SyncConnected, eventType=None, path=null
10:10:27:707 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=SyncConnected, eventType=None, path=null

>>>>>>>>>>>>>>>>【说明】重试操作执行成功，从服务端接收到了答复的数据包
10:10:27:710 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 3,101  replyHeader:: 3,543,0  request:: 543,v{},v{'/usage/right-usage},v{}  response:: null
10:10:27:723 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 4,4  replyHeader:: 4,543,0  request:: '/usage/right-usage0000000031,F  response:: #64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e74,s{543,543,1573956619409,1573956619409,0,0,0,0,43,0,543} 
10:10:27:729 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]获取节点数据成功
10:10:27:730 [main] INFO  ZooKeeperTimeoutHandleUsage - [3]准备执行操作：设置节点数据
10:10:27:736 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 5,5  replyHeader:: 5,544,0  request:: '/usage/right-usage0000000031,#64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e742d61,-1  response:: s{543,544,1573956619409,1573956628091,1,0,0,0,45,0,543} 
10:10:27:736 [main] INFO  ZooKeeperTimeoutHandleUsage - [3]设置节点数据成功
10:10:27:737 [main] INFO  ZooKeeperTimeoutHandleUsage - [4]准备执行操作：获取节点数据
10:10:27:740 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80034, packet:: clientPath:null serverPath:null finished:false header:: 6,4  replyHeader:: 6,544,0  request:: '/usage/right-usage0000000031,F  response:: #64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e742d61,s{543,544,1573956619409,1573956628091,1,0,0,0,45,0,543} 
10:10:27:740 [main] INFO  ZooKeeperTimeoutHandleUsage - [4]获取节点数据成功 
```

### 会话超时后重新创建会话的演示日志

ZooKeeper服务端设置tickTime=2秒，客户端建立连接的请求中附带的会话超时时间为9秒，断点停留时间为10秒左右，出现以下日志（注意：`>>>>>>>>>>>>>>>>【说明】`不是日志内容，是对日志的说明）

```
>>>>>>>>>>>>>>>>【注释】前面省略了启动日志
....
10:26:11:516 [main] INFO  ZooKeeper - Initiating client connection, connectString=192.168.199.130:2181 sessionTimeout=9000 watcher=org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperUtil$$Lambda$1/1661081225@243c4f91
10:26:11:519 [main] DEBUG ClientCnxn - zookeeper.disableAutoWatchReset is false
10:26:11:699 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Opening socket connection to server 192.168.199.130/192.168.199.130:2181. Will not attempt to authenticate using SASL (unknown error)
10:26:11:704 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Socket connection established to 192.168.199.130/192.168.199.130:2181, initiating session
10:26:11:707 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Session establishment request sent on 192.168.199.130/192.168.199.130:2181

>>>>>>>>>>>>>>>>【说明】下面的日志可以看到最终协商的会话超时时间为9000毫秒，即9秒
10:26:11:723 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Session establishment complete on server 192.168.199.130/192.168.199.130:2181, sessionid = 0x1000000ceb80035, negotiated timeout = 9000
10:26:11:726 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=SyncConnected, eventType=None, path=null
10:26:11:738 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80035, packet:: clientPath:null serverPath:null finished:false header:: 1,3  replyHeader:: 1,546,-101  request:: '/usage/right-usage,T  response::  
10:26:11:741 [main] INFO  ZooKeeperTimeoutHandleUsage - [1]准备执行操作：创建节点
10:26:11:749 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80035, packet:: clientPath:null serverPath:null finished:false header:: 2,1  replyHeader:: 2,547,0  request:: '/usage/right-usage,#64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e74,v{s{31,s{'world,'anyone}}},2  response:: '/usage/right-usage0000000032 
10:26:11:749 [main] INFO  ZooKeeperTimeoutHandleUsage - [1]创建节点成功

>>>>>>>>>>>>>>>>【说明】收到客户端在10136ms时间内没有收到服务端的消息（因为debug断点停留导致）
10:26:21:884 [main-SendThread(192.168.199.130:2181)] WARN  ClientCnxn - Client session timed out, have not heard from server in 10136ms for sessionid 0x1000000ceb80035
10:26:21:885 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Client session timed out, have not heard from server in 10136ms for sessionid 0x1000000ceb80035, closing socket connection and attempting reconnect

>>>>>>>>>>>>>>>>【说明】这里是通过debug停留10秒模拟客户端和服务端断开网络6秒后的日志
10:26:21:884 [main] INFO  ZooKeeperTimeoutHandleUsage - 模拟ZooKeeper客户端和服务端失去网络连接10秒。
10:26:21:888 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]准备执行操作：获取节点数据
10:26:22:000 [main] ERROR ZooKeeperTimeoutHandleUsage - [2]获取节点数据失败！准备重试

>>>>>>>>>>>>>>>>【说明】客户端首先触发了连接丢失的异常（该异常在会话超时异常之前被检测到，因为连接丢失异常是客户端主动检测的，而会话超时需要等到客户端下一次操作时，服务端检测到会话超时才会通知客户端）
org.apache.zookeeper.KeeperException$ConnectionLossException: KeeperErrorCode = ConnectionLoss for /usage/right-usage0000000032
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:102)
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:54)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1215)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1244)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.lambda$rightUsage$1(ZooKeeperTimeoutHandleUsage.java:169)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.wrapperOperation(ZooKeeperTimeoutHandleUsage.java:113)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.rightUsage(ZooKeeperTimeoutHandleUsage.java:168)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.main(ZooKeeperTimeoutHandleUsage.java:101)
10:26:22:000 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]准备执行操作：获取节点数据
10:26:22:001 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=Disconnected, eventType=None, path=null
10:26:22:001 [main-EventThread] INFO  ZooKeeperTimeoutHandleUsage - 收到[watched event], state=Disconnected, eventType=None, path=null

>>>>>>>>>>>>>>>>【说明】客户端自动重连
10:26:23:013 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Opening socket connection to server 192.168.199.130/192.168.199.130:2181. Will not attempt to authenticate using SASL (unknown error)
10:26:23:015 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Socket connection established to 192.168.199.130/192.168.199.130:2181, initiating session
10:26:23:018 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Session establishment request sent on 192.168.199.130/192.168.199.130:2181

>>>>>>>>>>>>>>>>【说明】ZooKeeper服务端处理客户端的重连请求时发现会话已超时，通知客户端会话超时
10:26:23:025 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=Expired, eventType=None, path=null
10:26:23:025 [main-EventThread] INFO  ZooKeeperTimeoutHandleUsage - 收到[watched event], state=Expired, eventType=None, path=null

>>>>>>>>>>>>>>>>【说明】从下面的日志可以看到，ZooKeeper客户端在自动重连时，复用了之前连接的sessionId（0x1000000ceb80035）
10:26:23:025 [main-SendThread(192.168.199.130:2181)] WARN  ClientCnxn - Unable to reconnect to ZooKeeper service, session 0x1000000ceb80035 has expired
10:26:23:026 [main-EventThread] INFO  ClientCnxn - EventThread shut down for session: 0x1000000ceb80035
10:26:23:026 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Unable to reconnect to ZooKeeper service, session 0x1000000ceb80035 has expired, closing socket connection

>>>>>>>>>>>>>>>>【说明】检测到会话超时后，重新建立连接会话，并重试操作
10:26:23:127 [main] ERROR ZooKeeperTimeoutHandleUsage - [2]获取节点数据失败！会话超时，准备重新创建会话，并重试操作
org.apache.zookeeper.KeeperException$SessionExpiredException: KeeperErrorCode = Session expired for /usage/right-usage0000000032
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:130)
    at org.apache.zookeeper.KeeperException.create(KeeperException.java:54)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1215)
    at org.apache.zookeeper.ZooKeeper.getData(ZooKeeper.java:1244)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.lambda$rightUsage$1(ZooKeeperTimeoutHandleUsage.java:169)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.wrapperOperation(ZooKeeperTimeoutHandleUsage.java:113)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.rightUsage(ZooKeeperTimeoutHandleUsage.java:168)
    at org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperTimeoutHandleUsage.main(ZooKeeperTimeoutHandleUsage.java:101)
10:26:23:127 [main] INFO  ZooKeeper - Initiating client connection, connectString=192.168.199.130:2181 sessionTimeout=9000 watcher=org.setamv.jsetamv.thirdparty.zookeeper.official.ZooKeeperUtil$$Lambda$1/1661081225@45c7e403
10:26:23:130 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Opening socket connection to server 192.168.199.130/192.168.199.130:2181. Will not attempt to authenticate using SASL (unknown error)
10:26:23:131 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Socket connection established to 192.168.199.130/192.168.199.130:2181, initiating session
10:26:23:132 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Session establishment request sent on 192.168.199.130/192.168.199.130:2181
10:26:23:136 [main-SendThread(192.168.199.130:2181)] INFO  ClientCnxn - Session establishment complete on server 192.168.199.130/192.168.199.130:2181, sessionid = 0x1000000ceb80036, negotiated timeout = 9000
10:26:23:136 [main-EventThread] INFO  ZooKeeperUtil - 收到[watched event], state=SyncConnected, eventType=None, path=null
10:26:23:137 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]准备执行操作：获取节点数据
10:26:23:141 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80036, packet:: clientPath:null serverPath:null finished:false header:: 1,4  replyHeader:: 1,549,0  request:: '/usage/right-usage0000000032,F  response:: #64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e74,s{547,547,1573957572125,1573957572125,0,0,0,0,43,0,547} 
10:26:23:149 [main] INFO  ZooKeeperTimeoutHandleUsage - [2]获取节点数据成功
10:26:23:150 [main] INFO  ZooKeeperTimeoutHandleUsage - [3]准备执行操作：设置节点数据
10:26:23:169 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80036, packet:: clientPath:null serverPath:null finished:false header:: 2,5  replyHeader:: 2,550,0  request:: '/usage/right-usage0000000032,#64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e742d61,-1  response:: s{547,550,1573957572125,1573957583538,1,0,0,0,45,0,547} 
10:26:23:169 [main] INFO  ZooKeeperTimeoutHandleUsage - [3]设置节点数据成功
10:26:23:170 [main] INFO  ZooKeeperTimeoutHandleUsage - [4]准备执行操作：获取节点数据
10:26:23:172 [main-SendThread(192.168.199.130:2181)] DEBUG ClientCnxn - Reading reply sessionid:0x1000000ceb80036, packet:: clientPath:null serverPath:null finished:false header:: 3,4  replyHeader:: 3,550,0  request:: '/usage/right-usage0000000032,F  response:: #64656d6f6e737472617465207269676874207573616765206f66207a6f6f6b656570657220636c69656e742d61,s{547,550,1573957572125,1573957583538,1,0,0,0,45,0,547} 
10:26:23:172 [main] INFO  ZooKeeperTimeoutHandleUsage - [4]获取节点数据成功
Disconnected from the target VM, address: '127.0.0.1:53585', transport: 'socket'
```

[zookeeper](https://segmentfault.com/t/zookeeper)[_[图片]_java](https://segmentfault.com/t/java)

阅读 12.9k更新于 2019-11-17

本作品系原创，[采用《署名-非商业性使用-禁止演绎 4.0 国际》许可协议](https://creativecommons.org/licenses/by-nc-nd/4.0/)

**1 条评论**

[得票](https://segmentfault.com/a/1190000021032892?sort=votes)[最新](https://segmentfault.com/a/1190000021032892?sort=newest)

_[图片]_

评论支持部分 Markdown 语法：``**粗体** _斜体_ [链接](http://example.com) `代码` - 列表 > 引用``。你还可以使用 `@` 来通知其他用户。

_[图片]_

[**小文**](https://segmentfault.com/u/xiaowen_5e19e529e00da)：

赞一个

[](###)[回复](###)2020-01-11

**继续阅读**

[##### java 异常<br>层次Exception类是所有异常类的父亲。Java 程序通常不捕获错误。错误一般发生在严重故障时，它们在Java程序处理的范畴之外。Exception类和Error是 Throwable 类的子类：Error：严重错误，无法通过处理的错误，只...<br>流星雨赞 2阅读 769<br>_[图片]_](https://segmentfault.com/a/1190000040198826?utm_source=sf-similar-article)[##### nginx的upstream异常<br>upstream server temporarily disabled while connecting to upstream no live upstreams while connecting to upstream<br>codecraft赞 1阅读 22.7k](https://segmentfault.com/a/1190000008299822?utm_source=sf-similar-article)[##### SpringBoot异常集<br>报:Class not found com.cy.cj.common.cache.DefaultTest原因 检查发现pom.xml文件中少添加了下面的依赖<br>zhangsir阅读 1.3k](https://segmentfault.com/a/1190000023765888?utm_source=sf-similar-article)[##### JAVA异常类<br>Error通常为虚拟机相关错误，通常比较严重，除了通知用户和尽力使程序安全终止之外，紧靠应用自身无法恢复，所以应用程序不应对其捕获，。Exception可以在程序内进行捕获并处理，使应用程序继续正常运行。<br>geeker_leon阅读 1.2k](https://segmentfault.com/a/1190000019367165?utm_source=sf-similar-article)[##### phpmyadmin mysql 超时<br>在使用Nginx时，经常会碰到 502 Bad Gateway 和 504 Gateway Time-out 错误，下面以 Nginx+PHP-FPM 来分析下这两种常见错误的原因和解决方案。<br>SegmentRight阅读 1.4k](https://segmentfault.com/a/1190000038205764?utm_source=sf-similar-article)[##### 异常+abstract<br>被abstract修饰的方法称为抽象方法抽象方法可以没有方法体；一个类中存在抽象方法，他就是抽象类抽象类不允许实例化子类继承抽象父类，要么实现父类全部的抽象方法，要么它被定义为一个抽象类<br>Roy01阅读 935](https://segmentfault.com/a/1190000037759834?utm_source=sf-similar-article)

##### [setamv](https://segmentfault.com/u/setamv_5dd0b5b8a405b)

**1** 声望

**1** 粉丝

**宣传栏**

[**自顶向下学 React 源码**<br>从理念到架构到实现到代码，透彻理解](https://sponsor.segmentfault.com/ck.php?oaparams=2__bannerid=400__zoneid=7__cb=096ed13d9c__oadest=https%3A%2F%2Fke.sifou.com%2Fcourse%2F1650000023864436%3Futm_source%3Dsegmentfault%26utm_medium%3Dbanner_Tlink)

[**专家带你构建一个高性能秒杀系统**<br>大厂电商 Java 秒杀系统架构实战](https://sponsor.segmentfault.com/ck.php?oaparams=2__bannerid=401__zoneid=9__cb=0ddf8c1e2e__oadest=https%3A%2F%2Fke.segmentfault.com%2Fcourse%2F1650000037474720%3Futm_source%3Dsegmentfault%26utm_medium%3Dbanner_Tlink)

产品

[热门问答](https://segmentfault.com/questions/hottest?utm_source=sf-footer)

[热门专栏](https://segmentfault.com/blogs/hottest?utm_source=sf-footer)

[热门课程](https://segmentfault.com/lives?utm_source=sf-footer)

[最新活动](https://segmentfault.com/events?utm_source=sf-footer)

[翻译](https://segmentfault.com/site/stackoverflow?utm_source=sf-footer)

[酷工作](https://segmentfault.com/jobs?utm_source=sf-footer)

课程

[Java 开发课程](https://segmentfault.com/lives/edu?tag=java&sort=hottest&utm_source=sf-footer)

[PHP 开发课程](https://segmentfault.com/lives/edu?tag=php&sort=hottest&utm_source=sf-footer)

[Python 开发课程](https://segmentfault.com/lives/edu?tag=python&sort=hottest&utm_source=sf-footer)

[前端开发课程](https://segmentfault.com/lives/edu?category=1&sort=hottest&utm_source=sf-footer)

[移动开发课程](https://segmentfault.com/lives/study?category=3&sort=hottest&utm_source=sf-footer)

资源

[每周精选](https://segmentfault.com/weekly?utm_source=sf-footer)

[用户排行榜](https://segmentfault.com/users?utm_source=sf-footer)

[帮助中心](https://segmentfault.com/help?utm_source=sf-footer)

[建议反馈](https://segmentfault.com/0x?utm_source=sf-footer)

合作

[关于我们](https://about.segmentfault.com/?utm_source=sf-footer)

[广告投放](https://business.segmentfault.com/ads?utm_source=sf-footer)

[职位发布](https://segmentfault.com/jobs?utm_source=sf-footer)

[讲师招募](https://jinshuju.net/f/HK5r9K?utm_source=sf-footer)

[联系我们](mailto:pr@segmentfault.com?utm_source=sf-footer)

[合作伙伴](https://segmentfault.com/link?utm_source=sf-footer)

关注

[产品技术日志](https://segmentfault.com/blog/segmentfault?utm_source=sf-footer)

[社区运营日志](https://segmentfault.com/blog/community_admin?utm_source=sf-footer)

[市场运营日志](https://segmentfault.com/blog/segmentfault_news?utm_source=sf-footer)

[团队日志](https://segmentfault.com/blog/segmentfault_team?utm_source=sf-footer)

[社区访谈](https://segmentfault.com/blog/interview?utm_source=sf-footer)

条款

[服务协议](https://segmentfault.com/tos?utm_source=sf-footer)

[隐私政策](https://segmentfault.com/privacy?utm_source=sf-footer)

[下载 App](https://segmentfault.com/app?utm_source=sf-footer)

* * *

Copyright © 2011-2022 SegmentFault. 当前呈现版本 22.10.17

[浙ICP备15005796号-2](http://beian.miit.gov.cn)[浙公网安备33010602002000号](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602002000)ICP 经营许可 浙B2-20201554

杭州堆栈科技有限公司版权所有
