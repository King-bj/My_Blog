---
title: Elasticsearch 创建索引失败排查
date: "2026-05-15"
tags: [故障排查, 中间件]
description: "Elasticsearch 创建索引失败排查：nested field 数量超过 es.nested.field.limited 限制，通过 ZooKeeper init 配置调整上限，附排查日志与配置示例。"
published: true
---

# Elasticsearch 创建索引失败排查

## 背景（Situation）

新业务接入 ES 时偶发"创建索引失败"。

## 目标（Task）

搞清楚是磁盘水位、节点状态还是模板冲突导致的失败，并给出处置流程。

## 行动（Action）

日志服务中采用 es.nested.field.limited 字段控制字段上限 在zookeeper的init配置中设置"es.nested.field.limited":"1000" 即可  
其中的关键报错信息是 Limit of total fields [1000] in index [nginx-server-log-000022] has been exceeded，触发这个报错的原因是由于该日志是 JSON 类型，而 ES 默认 JSON 类型日志 index 的最大字段长度为 1000，但是当前业务的日志中很多都超过了 1000 个字段。

调整默认字段数限制

```
## 模板设置
PUT _template/ngx-server
{
  "index_patterns": ["ngx-server-*"],
  "settings": {
    "number_of_shards": 15,
    "number_of_replicas": 1,
    "index.lifecycle.name": "ngx-api-normal",
    "index.lifecycle.rollover_alias": "ngx-server",
    "index.mapping.total_fields.limit": 2000
  }
}

## 单个索引设置

PUT nginx-server-log/_settings
{
  "index.mapping.total_fields.limit": 2000
}

## 全局设置

PUT _all/_settings
{
  "index.mapping.total_fields.limit": 2000
}
```

## 收获（Result）

问题定位到磁盘告警导致 ES 进入只读，调整阈值 + 加监控后避免了二次发生。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
