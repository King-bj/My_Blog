---
title: ZooKeeper 监控超时与重连问题处理
date: "2026-02-23"
tags: [中间件]
description: 更新了zookeeper，spark任务没有接收到通知更新，zookeeper通信报错连接超时 zookeeper连接断开分为recoverble以及unrecoverble两种场景，这两种的区别主要是基于Session...
published: true
---

# ZooKeeper 监控超时与重连问题处理

> **背景：** 实时链路里同时存在 Kafka、Flink、ZooKeeper、Dubbo 等多种中间件，出问题时往往牵一发动全身，下面是当时的完整记录与思考。

## 现象
更新了zookeeper，spark任务没有接收到通知更新，zookeeper通信报错连接超时

## 源代码
````
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.framework.api.CuratorWatcher;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;

public class ZooKeeperWatcherExample {
    private static final String ZK_CONNECTION_STRING = "localhost:2181"; // ZooKeeper连接字符串
    private static final int SESSION_TIMEOUT_MS = 5000; // 会话超时时间（毫秒）

    public static void main(String[] args) throws Exception {
        // 创建Curator客户端
        CuratorFramework client = CuratorFrameworkFactory.newClient(ZK_CONNECTION_STRING, new ExponentialBackoffRetry(1000, 3));
        client.start();
        // 注册Watcher监听器
        addNodeWatcher(client, "/opt/test");

        // 保持程序运行，以便监听节点变化
        Thread.sleep(Integer.MAX_VALUE);
    }

    private static void addNodeWatcher(CuratorFramework client, String path) throws Exception {
        // 创建Watcher监听器
        CuratorWatcher watcher = new CuratorWatcher() {
            @Override
            public void process(WatchedEvent event) throws Exception {
                if (event.getType() == Watcher.Event.EventType.NodeDataChanged) {
                    // 节点数据发生变化时触发
                    byte[] data = client.getData().usingWatcher(this).forPath(path);
                    String dataStr = new String(data);
                    System.out.println("Node data changed: " + dataStr);
                }
            }
        };

        // 注册Watcher监听指定节点的数据变化
        byte[] data = client.getData().usingWatcher(watcher).forPath(path);
        String dataStr = new String(data);
        System.out.println("Initial node data: " + dataStr);
    }
}

````

## 原因
zookeeper连接断开分为recoverble以及unrecoverble两种场景，这两种的区别主要是基于Session的有效期，所有的client操作包括watch都是和Session关联的，当Session在超时过期时间内，重新成功建立连接，则watch会在连接建立后重新设置。但是当Session Timeout后仍然没有成功重新建立连接，那么Session则处于Expire的状态,这种情况下，ZookeeperClient会重新连接，但是Session将会是全新的一个。同时之前的状态是不会保存的。

1）在session timeout之内连接成功
这个时候client成功切换到连接另一个provider例如是provider2，由于zk在所有的provider上同步了session相关的数据，此时可以认为无缝迁移了。
2）在session timeout之内没有重新连接
这就是session expire的情况，这时候zookeeper集群会任务会话已经结束，并清除和这个session有关的所有数据，包括临时节点和注册的监视点Watcher。
在session超时之后，如果client重新连接上了zookeeper集群，很不幸，zookeeper会发出session expired异常，且不会重建session，也就是不会重建临时数据和watcher。
我们实现的ZookeeperProcessor是基于Apache Curator的Client封装实现的。

它对于Session Expire的处理是提供了处理的监听注册ConnectionStateListner，当遇到Session Expire时，执行使用者要做的逻辑。（例如：重新设置Watch）

## 原因总结
zookeeper存在两种连接断开情况，第一种是在超时之前连接成功，可以无缝连接无需处理，第二种在超时时间之后连接，需要重新设置watch，保证可以继续进行监听。

## 解决方案
我们在ConnectionStateListener的stateChanged()方法中添加了对ConnectionState.RECONNECTED状态的处理逻辑。当重新连接成功时，我们调用addNodeWatcher()方法重新注册Watcher以监听节点数据的变化。

请注意，在重新注册Watcher时，我们使用的是CuratorFramework对象作为参数，而不是直接使用client，这是因为在ConnectionStateListener中的stateChanged()方法中，client可能已经被关闭或不可用。因此，通过将CuratorFramework对象作为参数传递给addNodeWatcher()方法，我们可以确保在重新连接后使用正确的CuratorFramework实例重新注册Watcher。

``` 
 
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.framework.api.CuratorWatcher;
import org.apache.curator.framework.state.ConnectionState;
import org.apache.curator.framework.state.ConnectionStateListener;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;

public class ZooKeeperWatcherExample {
    private static final String ZK_CONNECTION_STRING = "localhost:2181"; // ZooKeeper连接字符串
    private static final int SESSION_TIMEOUT_MS = 5000; // 会话超时时间（毫秒）
    private static final String NODE_PATH = "/opt/test"; // 监听的节点路径

    public static void main(String[] args) throws Exception {
        // 创建Curator客户端
        CuratorFramework client = CuratorFrameworkFactory.newClient(ZK_CONNECTION_STRING, SESSION_TIMEOUT_MS, SESSION_TIMEOUT_MS, new ExponentialBackoffRetry(1000, 3));

        // 注册连接状态监听器
        ConnectionStateListener connectionStateListener = new ConnectionStateListener() {
            @Override
            public void stateChanged(CuratorFramework curatorFramework, ConnectionState connectionState) {
                if (connectionState == ConnectionState.LOST || connectionState == ConnectionState.SUSPENDED) {
                    // 处理会话超时或暂停的异常情况
                    System.out.println("ZooKeeper session lost or suspended. Connection state: " + connectionState);
                    // 在这里执行相应的处理逻辑
                } else if (connectionState == ConnectionState.RECONNECTED) {
                    // 重新连接成功，重新注册Watcher
                    try {
                        addNodeWatcher(curatorFramework, NODE_PATH);
                    } catch (Exception e) {
                        System.out.println("Failed to re-register watcher after reconnection: " + e.getMessage());
                    }
                }
            }
        };

        client.getConnectionStateListenable().addListener(connectionStateListener);
        client.start();

        // 注册Watcher监听器
        addNodeWatcher(client, NODE_PATH);

        // 保持程序运行，以便监听节点变化
        Thread.sleep(Integer.MAX_VALUE);
    }

    private static void addNodeWatcher(CuratorFramework client, String path) throws Exception {
        // 创建Watcher监听器
        CuratorWatcher watcher = new CuratorWatcher() {
            @Override
            public void process(WatchedEvent event) throws Exception {
                if (event.getType() == Watcher.Event.EventType.NodeDataChanged) {
                    // 节点数据发生变化时触发
                    byte[] data = client.getData().usingWatcher(this).forPath(path);
                    String dataStr = new String(data);
                    System.out.println("Node data changed: " + dataStr);
                }
            }
        };

        // 注册Watcher监听指定节点的数据变化
        byte[] data = client.getData().usingWatcher(watcher).forPath(path);
        String dataStr = new String(data);
        System.out.println("Initial node data: " + dataStr);
    }
}

```
