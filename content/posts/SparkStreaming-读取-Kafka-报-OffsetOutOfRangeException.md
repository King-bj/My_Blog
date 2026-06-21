---
title: Spark Streaming 读取 Kafka 报 OffsetOutOfRangeException
date: "2026-02-13"
tags: [中间件]
description: SparkStreaming读取kakfa报错OffsetOutOfRangeException Kafka停机超过数据清理时间后，spark消费的还是停机之前的offset，然而该topic数据已经被清理了，所以报错越...
published: true
---

# Spark Streaming 读取 Kafka 报 OffsetOutOfRangeException

## 背景（Situation）

Spark Streaming 任务凌晨重启后报 OffsetOutOfRangeException，业务数据中断。

## 目标（Task）

判断是 Kafka 数据过期还是 Checkpoint 老化引起，并恢复任务。

## 行动（Action）

### 现象
SparkStreaming读取kakfa报错OffsetOutOfRangeException
### 排查原因
Kafka停机超过数据清理时间后，spark消费的还是停机之前的offset，然而该topic数据已经被清理了，所以报错越界
### 解决方案：
1. 设置清理时间更长。及时重启kafka服务
2. 代码内设置报错后依然能让job正常运行，需要在发现local_offset<earliest_offset时矫正local_offset为合法值。

需要在执行后增加提交偏移量这一步
提交偏移量时，我们使用了offsetRange.untilOffset() + 1来表示下一条要读取的偏移量。这是因为Kafka的偏移量是表示下一条消息的Offset，而不是当前已消费的最后一条消息的Offset。所以在提交偏移量时，需要将untilOffset()加一来表示下一条待消费的消息的Offset。
```
 // 数据处理
    rdd.foreachPartition(partitionOfRecords -> {
        // 在每个分区上处理数据
        doSomeThing(partitionOfRecords, broadcast);

        // 提交偏移量
        OffsetRange offsetRange = offsetRanges[TaskContext.get().partitionId()];
        ((CanCommitOffsets) stream.inputDStream()).commitAsync(Collections.singletonMap(
            new org.apache.kafka.common.TopicPartition(offsetRange.topic(), offsetRange.partition()),
            new org.apache.kafka.clients.consumer.OffsetAndMetadata(offsetRange.untilOffset() + 1)
        ));
    });
```

## 收获（Result）

结论是保留期短于停机时长导致 offset 失效，调整保留期 + 重置 offset 后恢复，并补上长停机时的预案。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
