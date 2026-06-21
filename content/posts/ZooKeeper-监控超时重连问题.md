---
title: ZooKeeper Session 超时与 Watcher 重注册问题处理
date: "2023-03-25"
tags: [中间件, 故障排查]
description: "生产环境 ZooKeeper 更新后 Spark 任务未收到通知，根因是 Session Expire 后旧 Watcher 失效。文章覆盖 Session 超时协商机制、recoverable/unrecoverable 两种断连场景，以及基于 Curator ConnectionStateListener 的 Watcher 自动重注册方案。"
published: true
---

# ZooKeeper Session 超时与 Watcher 重注册问题处理

## 现象

更新了 ZooKeeper 节点数据后，下游 Spark 任务没有收到通知、未触发索引切换，ZooKeeper 客户端日志报连接超时。

---

## Session 超时原理

### 超时时间的协商

ZooKeeper 客户端与服务端建立连接时，会提交客户端设置的 `sessionTimeout`。服务端有两个配置项：

- `minSessionTimeout`：默认 `tickTime × 2`
- `maxSessionTimeout`：默认 `tickTime × 20`

最终生效的超时时间按以下规则确定：

```java
if (clientSessionTimeout < minSessionTimeout) {
    sessionTimeout = minSessionTimeout;
} else if (clientSessionTimeout > maxSessionTimeout) {
    sessionTimeout = maxSessionTimeout;
} else {
    sessionTimeout = clientSessionTimeout;
}
```

服务端使用 `ExpiryQueue` 将所有客户端连接按超时时间分桶管理，到期时逐桶检查。

### 两种断连场景

| 场景 | 条件 | 结果 |
|------|------|------|
| **Recoverable（可恢复）** | 在 `sessionTimeout` 内重新连接成功 | Session 有效，Watcher 在重连后自动恢复 |
| **Unrecoverable（不可恢复）** | `sessionTimeout` 到期仍未重连 | Session Expire，临时节点和 Watcher 全部被清除 |

Session Expire 后客户端重连时，服务端返回 `SESSIONEXPIRED` 错误码，客户端抛出 `KeeperException.SessionExpiredException`，注册的 Watcher 收到 `KeeperState.Expired` 通知。**此时必须主动重建连接，并重新注册所有 Watcher。**

---

## 根因分析

本次更新 ZooKeeper 期间，由于维护窗口超过了客户端配置的 `sessionTimeout`，Session 进入 Expire 状态。重连成功后，之前注册的索引变更 Watcher 已被服务端清除，因此节点数据变更通知无法到达 Spark 任务。

---

## 解决方案

### 1. 调大超时时间（临时缓解）

在 ZooKeeper `zoo.cfg` 中调整：

```properties
minSessionTimeout=10000
maxSessionTimeout=60000
```

客户端连接时相应增大 `sessionTimeout` 参数。

### 2. 实现 Session Expire 后的 Watcher 自动重注册（根本方案）

使用 Apache Curator 的 `ConnectionStateListener`，在 `RECONNECTED` 状态时重新注册所有 Watcher：

```java
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.framework.api.CuratorWatcher;
import org.apache.curator.framework.state.ConnectionState;
import org.apache.curator.framework.state.ConnectionStateListener;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;

public class ZooKeeperWatcherExample {
    private static final String ZK_CONNECTION_STRING = "localhost:2181";
    private static final int SESSION_TIMEOUT_MS = 30000;
    private static final String NODE_PATH = "/config/index-name";

    public static void main(String[] args) throws Exception {
        CuratorFramework client = CuratorFrameworkFactory.newClient(
            ZK_CONNECTION_STRING,
            SESSION_TIMEOUT_MS,
            SESSION_TIMEOUT_MS,
            new ExponentialBackoffRetry(1000, 3)
        );

        client.getConnectionStateListenable().addListener((curatorFramework, connectionState) -> {
            if (connectionState == ConnectionState.LOST || connectionState == ConnectionState.SUSPENDED) {
                System.out.println("ZooKeeper session lost/suspended: " + connectionState);
            } else if (connectionState == ConnectionState.RECONNECTED) {
                // Session Expire 后重连：必须重新注册 Watcher
                try {
                    addNodeWatcher(curatorFramework, NODE_PATH);
                } catch (Exception e) {
                    System.err.println("Failed to re-register watcher: " + e.getMessage());
                }
            }
        });

        client.start();
        addNodeWatcher(client, NODE_PATH);
        Thread.sleep(Long.MAX_VALUE);
    }

    private static void addNodeWatcher(CuratorFramework client, String path) throws Exception {
        CuratorWatcher watcher = event -> {
            if (event.getType() == Watcher.Event.EventType.NodeDataChanged) {
                byte[] data = client.getData().usingWatcher(
                    (CuratorWatcher) e -> {}
                ).forPath(path);
                System.out.println("Index updated: " + new String(data));
                // 重新注册自身，保持持续监听
                addNodeWatcher(client, path);
            }
        };
        client.getData().usingWatcher(watcher).forPath(path);
    }
}
```

**关键点**：`RECONNECTED` 与 `LOST`/`SUSPENDED` 的区别在于 Session 是否已 Expire；Curator 的重试策略只能处理 Recoverable 断连，Session Expire 后必须在 `ConnectionStateListener` 里手动重建监听。

---

## 结果

调整 `sessionTimeout` 并补充 Watcher 自动重注册逻辑后，ZooKeeper 维护窗口期间不再出现通知丢失，团队将此模式写入了中间件客户端编码规范。
