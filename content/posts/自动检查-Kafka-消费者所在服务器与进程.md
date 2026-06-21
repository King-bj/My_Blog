---
title: 自动反查 Kafka 消费者所在的服务器与进程
date: "2026-04-10"
tags: [DevOps, 中间件]
description: "通过 kafka-consumer-groups.sh CLIENT-ID 字段反查消费者所在主机与 PID 的自动化脚本，解决消费者异常时难以快速定位进程的问题。"
published: true
---

# 自动反查 Kafka 消费者所在的服务器与进程

## 背景（Situation）

Kafka 集群里某个 topic 的消费延迟告警了，但消费者分布在多台机器上，没有一份实时的对账表。

## 目标（Task）

写一个能从 broker 反查"某消费组的每个 partition 当前由哪台机器在消费"的脚本。

## 行动（Action）

### 思路

Kafka broker 本身记录了每个 consumer group 的成员信息，关键工具是 `kafka-consumer-groups.sh`：

```bash
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
    --describe --group power-log-consumer
```

输出里 `CLIENT-ID` 字段通常带了我们自定义的 `host-pid` 信息。如果没有，则需要拿 `CLIENT-ID + HOST` 字段去登录机器找进程。

### 自动化脚本

```bash
#!/usr/bin/env bash
# 用法: ./find_consumer.sh <group-name>
GROUP=$1

kafka-consumer-groups.sh --bootstrap-server "$KAFKA_BROKER" \
    --describe --group "$GROUP" \
| awk 'NR>1 {print $7, $8}' \
| sort -u \
| while read host client; do
    ip=$(echo "$host" | sed 's#/##')
    ssh -o StrictHostKeyChecking=no "$ip" \
        "ps -ef | grep -v grep | grep -E '$client|kafka.consumer'" \
    | awk -v ip="$ip" '{print ip" "$2" "$8}'
done
```

输出格式：

```
10.0.1.21  PID 13245  /opt/log-agent/bin/agent
10.0.1.22  PID 18033  /opt/log-agent/bin/agent
```

### 接入运维平台

后续把脚本包了一层 HTTP 接口，告警系统在告警卡片上直接给出"卡住的消费者位置"，运维同事一键跳转到机器登录。


## 收获（Result）

脚本固化进运维平台后，定位"是哪台机器的消费者卡住了"从十几分钟变成 30 秒；近一年内 Kafka 消费延迟告警的平均恢复时间下降到 5 分钟以内。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
