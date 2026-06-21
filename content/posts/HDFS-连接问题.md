---
title: HDFS 凌晨连不上的故障复盘
date: "2025-04-25"
tags: [故障排查, 中间件]
description: "HDFS 凌晨批处理任务连接失败的完整复盘：DNS 缓存过期与 Kerberos 票据权限配置问题排查，不重启集群的在线恢复方案与自检脚本沉淀。"
published: true
---

# HDFS 凌晨连不上的故障复盘

## 背景（Situation）

每天凌晨 02:00 有一批离线计算任务需要读写 HDFS，某天开始持续报错 `java.net.ConnectException: Connection refused to host: <namenode-ip>`，任务全部失败，但日间手动访问 HDFS 完全正常。

## 目标（Task）

在不重启 HDFS 集群的前提下找到根因并恢复，同时沉淀检查清单防止复发。

## 行动（Action）

### 现象梳理

- 凌晨失败，日间正常 → 排除 HDFS 服务本身问题
- 同一批任务，日间手动触发成功 → 排除任务逻辑问题
- 凌晨任务运行账号与日间不同 → 重点排查权限与票据

### 排查步骤

**Step 1：确认 NameNode 是否存活**

```shell
hdfs dfsadmin -report
hdfs dfs -ls /
```

两个命令均正常 → NameNode 无异常。

**Step 2：复现凌晨失败场景**

切换到凌晨任务使用的服务账号，手动执行：

```shell
sudo -u batch_user hdfs dfs -ls /data/batch/
```

报错：`Permission denied: user=batch_user, access=READ_EXECUTE, inode="/data/batch"`

→ 问题定位到权限，不是连接问题。

**Step 3：确认 Kerberos 票据状态**

```shell
sudo -u batch_user klist
```

输出：`Credentials cache: ... Expired: ...`

→ `batch_user` 的 Kerberos 票据在凌晨 01:58 过期，任务在 02:00 启动时无法通过认证，底层报 ConnectException 但实际是 AuthenticationException。

**Step 4：修复票据续期**

```shell
# 方案一：手动 kinit（临时）
sudo -u batch_user kinit -kt /etc/security/keytabs/batch.keytab batch_user@REALM.COM

# 方案二：crontab 自动续期（长效）
# 每天 01:00 提前续期
0 1 * * * batch_user kinit -kt /etc/security/keytabs/batch.keytab batch_user@REALM.COM
```

**Step 5：验证修复**

```shell
sudo -u batch_user hdfs dfs -ls /data/batch/
```

正常返回目录列表，凌晨任务恢复成功。

### 根因总结

| 表象 | Connection refused |
|------|-------------------|
| 实际根因 | Kerberos 票据过期导致 HDFS 客户端认证失败，Java 客户端将 AuthenticationException 包装为 ConnectException |
| 为什么只在凌晨 | 票据有效期 24h，每天凌晨 02:00 前到期，日间操作是在票据过期前进行的 |

## 收获（Result）

为所有使用 Kerberos 认证的批处理账号添加自动续期 crontab，并将「票据有效期检查」加入上线前自检清单。再未出现同类故障。
