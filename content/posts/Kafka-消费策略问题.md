---
title: Kafka auto.offset.reset 消费策略踩坑
date: "2026-03-20"
tags: [中间件, 故障排查]
description: "Kafka auto.offset.reset 策略详解：earliest/latest/none 各场景行为、无 committed offset 时的边界处理，以及与 enable.auto.commit 的配合关系。"
published: true
---

# Kafka auto.offset.reset 消费策略踩坑

## 背景（Situation）

日志采集链路新上了一个 consumer group，上线后发现历史日志全部丢失，只消费到了上线时刻之后的新消息。排查后发现是 `auto.offset.reset` 配置不当导致的。

## 目标（Task）

彻底搞清楚 `auto.offset.reset` 在各种边界场景下的实际行为，避免数据丢失。

## 行动（Action）

### auto.offset.reset 三个可选值

| 值 | 触发条件 | 行为 |
|----|---------|------|
| `earliest` | consumer group 在该 partition 上**没有 committed offset** | 从该 partition 最早可用的消息开始消费 |
| `latest`（默认） | consumer group 在该 partition 上**没有 committed offset** | 从当前最新的消息位置开始（已有消息不消费） |
| `none` | consumer group 在该 partition 上**没有 committed offset** | 抛出 `NoOffsetForPartitionException`，让业务代码决定如何处理 |

**关键点**：这三个值只在**没有 committed offset** 的情况下才生效。如果已有提交记录，则无论此参数如何设置，都从上次提交位置继续消费。

### 没有 committed offset 的几种情况

1. **全新 consumer group**：从未消费过该 topic
2. **consumer group 被删除**：`kafka-consumer-groups.sh --delete` 后重建
3. **offset 过期**：Kafka 默认保留 `offsets.retention.minutes=10080`（7天），超期后 committed offset 被删除
4. **切换 group.id**：换了新的消费者组名

### 与 enable.auto.commit 的关系

`enable.auto.commit=true`（默认）会定期自动提交 offset，但存在**重复消费**风险：如果消息处理成功但自动提交还没触发就宕机，重启后会重新消费。

生产推荐配置：

```properties
# 关闭自动提交
enable.auto.commit=false
# 处理成功后手动调用
consumer.commitSync();
```

### 回溯历史消息的正确姿势

如果需要重放历史消息，不要改 `auto.offset.reset`（此时已有 offset 存在，改了也没用），而是：

```shell
# 将指定 consumer group 的所有 partition offset 重置到最早
kafka-consumer-groups.sh \
  --bootstrap-server <broker>:9092 \
  --group <your-group> \
  --topic <your-topic> \
  --reset-offsets \
  --to-earliest \
  --execute
```

或重置到指定时间点：

```shell
kafka-consumer-groups.sh \
  --bootstrap-server <broker>:9092 \
  --group <your-group> \
  --topic <your-topic> \
  --reset-offsets \
  --to-datetime 2024-01-01T00:00:00.000 \
  --execute
```

## 收获（Result）

把消费策略文档写进部署模板，明确规定：生产 consumer 必须显式设置 `auto.offset.reset=earliest` 并关闭自动提交，再没出现过"重启就丢消息"的事件。
