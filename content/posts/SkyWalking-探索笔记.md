---
title: SkyWalking 探索笔记：链路追踪是怎么跑起来的
date: "2025-09-03"
tags: [监控, 可观测, 运维]
description: 问 1：你提到自己对 SkyWalking 的设计有理解 — 能否简单讲一下 SkyWalking Agent 是怎么做字节码增强的？ 问 2：在你看来，Segment 和 Span 的区别是什么？为什么要有这两个概念？...
published: true
---

# SkyWalking 探索笔记：链路追踪是怎么跑起来的

> **背景：** 生产环境涉及上百个微服务，没有完善的可观测体系问题定位就只能靠肉眼看日志，效率极低，下面是当时的完整记录与思考。

**问 1：你提到自己对 SkyWalking 的设计有理解 — 能否简单讲一下 SkyWalking Agent 是怎么做字节码增强的？**

- 回答思路：
  - Agent 以 `-javaagent` 启动，通过 `Instrumentation` 接口注册一个 ClassFileTransformer。
  - 使用 ByteBuddy／ASM 来修改类加载 / 方法进入 /方法退出 插入拦截逻辑。
  - 插件机制：不同插件拦截不同框架或库（HTTP 客户端／服务端，RPC，缓存调用，数据库访问等）。
  - 插件内部设定安全边界：即使插件的逻辑有异常，也不会影响业务。AgentClassLoader 用于隔离类加载问题。
  - 异步队列与缓冲用于采集数据与上报的解耦，防止影响业务线程响应。

**问 2：在你看来，Segment 和 Span 的区别是什么？为什么要有这两个概念？**

- 回答思路：
  - Span 是 Trace 中的一个调用片段，代表一个方法调用或一次跨进程请求。它有 ParentId, SpanId, TraceId, start / end 时间等指标。
  - Segment 是同一个 JVM /同一实例 /同一线程中的多个 Span 的集合，是一个本地的调用链条单位。Segment 可以看作是 Span 的容器 + Trace 中的一部分。
  - Segment 用于本地线程中构造调用链，然后跨进程或跨实例通过 Ref/上下文传递将它们关联到一个全局 Trace。
  - 这样设计好处：本地处理更轻量、快速；跨进程传播通过 header 等方式；同时本地内部的 Span 管理 /时间计算 /上下文维护集中在 Segment 内，便于优化性能。

**问 3：在一个高并发系统中，如果每个请求都采全量 Trace，上报量非常大，你会如何设计削峰或限流？**

- 回答思路：
  - 可以在 Agent 端做采样；例如只对异常请求或者响应时间超过阈值的请求强制追踪；平常请求做抽样采集（比如固定比例或者动态比例）。
  - 上报通道设计：优先使用 Kafka 等中间件做缓冲和削峰；如果使用 gRPC／HTTP，也要加异步发送 +本地队列 +满队列丢弃策略。
  - 监控 trace 上报失败率、延迟，对于慢上报或网络不可靠的情况进行 fallback。
  - 控制 span 的粒度与插件覆盖范围：尽可能只对关键路径做拦截，减少过多无用 span。
  - 资源隔离：Agent 的线程、内存要限制，不让探针自己成为瓶颈。使用环形队列、多生产者单消费者，尽量无锁或低锁结构减少竞争。

**问 4：SkyWalking 和 Arthas 的关系？怎么看它们在排查问题时配合使用？**

- 回答思路：
  - Arthas 是针对线上 Java 应用的诊断工具 —— 动态 attach，查看类加载、方法调用、线程栈、Heap 等，实时调试；适合“已经怀疑某个服务/方法有问题，需要看具体实现细节”的情况。
  - SkyWalking 是监控 /可观测性 /告警平台，用来监测指标、追踪调用链、定位“在哪个服务或哪个环节”出现性能问题或异常。它是“发现问题”的工具。
  - 二者结合使用效果好：我在以前的项目中如果通过 SkyWalking 看到某条调用链响应变慢、错误率上升，我会用 Arthas attach 到对应服务实例，追踪具体方法、看参数、线程情况、GC 或者类加载问题。这样问题定位速度快。
  - 如果有条件，还可以做 SkyWalking + Arthas 的插件/集成：比如 SkyWalking Agent 插件控制 Arthas 启停，让运维或者自己能从 UI 直接触发诊断行为（你之前的经验中可以提起）。

**问 5：你提到你了解 SkyWalking 的存储模型 — 在实际生产里，Trace / Span 数据量很大，什么策略可以保证查询性能以及存储成本可控？**

- 回答思路：
  - 使用分区 / Shard + 时间分区的方式，把旧数据逐渐冷存；冷热分离。 <br> - 索引设计：对常用查询字段（traceId, service name, endpoint,时间戳,父子关系）做索引；把 span summary 或 metrics 聚合存储成“压缩”版本以便查询统计。 <br> - 聚合层次 (L1, L2 聚合)，先在服务端做部分计算，减少原始 span 存储/传输。 <br> - 使用压缩、数据清理（TTL）等机制，对于超过保留期的 trace 数据删除或者归档 <br> - 上报通道选择与网络带宽控制；Agent 可以控制上报频率/批量发送以减少频繁小包对网络与控制面的负荷 <br> - 在 UI 层或前端做缓存 /分页 /延迟加载 /异步展示，以免 UI 查询过重影响后台系统。

| 方面                            | 核心内容                                                     | 要点／权衡点                                                 |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Agent 探针层（客户端）**      | · 使用 Java Agent（`-javaagent`）来进行字节码增强（bytecode instrumentation）[阿里云开发者社区+3博客园+3博客园+3](https://www.cnblogs.com/stateis0/p/16099932.html?utm_source=chatgpt.com)  · 插件机制（plugins）覆盖各种框架（HTTP、RPC、数据库、缓存等）以拦截方法、构造 Span / Segment[InfoQ 写作社区+2阿里云开发者社区+2](https://xie.infoq.cn/article/3bff5919c317b9a37280ac759?utm_source=chatgpt.com)  · AgentClassLoader 的使用以避免与业务类加载器冲突[博客园+1](https://www.cnblogs.com/stateis0/p/16099932.html?utm_source=chatgpt.com)  · 数据采集后的异步缓冲/队列机制／环形队列（MPSC 多生产单消费等）以降低阻塞和性能开销；在满载／队列满时丢弃来防止 OOM 或阻塞[Apache SkyWalking](https://skywalking.apache.org/zh/2022-08-30-pingan-jiankang/?utm_source=chatgpt.com) | · 性能开销 vs 数据完整性：探针越全面、拦截越深入，对应的开销越大，需要合理控制  · 入侵性要低（代码侵入、业务逻辑干扰要最小）；插件出错不应影响业务  · 与其他 Agent 或运维工具的兼容性问题（例如 Arthas） · 网络和上报通道的选择（gRPC vs Kafka vs HTTP）对于削峰、容错、延迟影响大 |
| **Trace / Span / Segment 模型** | · Trace: 一次业务请求的全链路；Span: Trace 中的一个调用段（一个服务内部或跨进程调用）[博客园+2InfoQ 写作社区+2](https://www.cnblogs.com/kebibuluan/p/18627792?utm_source=chatgpt.com)  · Segment: 在一个实例／JVM 内部（或线程内）的一段调用链路（多个 Span 的集合），并与全局 Trace 关联起来[博客园+1](https://www.cnblogs.com/stateis0/p/16099932.html?utm_source=chatgpt.com)  · 上下文传播（跨进程／跨线程）——HTTP Header、RPC 元数据 attachment 等方式 carry TraceId / SpanId /上下文[Echo Blog+2Apache SkyWalking+2](https://houbb.github.io/2023/07/25/distributed-trace-01-overview?utm_source=chatgpt.com) | · 采样（Sampling）：如何在高流量场景下做抽样而不丢失关键问题 trace  · 延迟与实时性 vs 系统开销  · TraceId 生成、冲突、关联性  · 日志 /指标 与 trace 的整合性 |
| **服务端 + OAP 模块**           | · 接收 Agent 上报的数据（Trace、Span、Segment，Metrics, 拓扑数据等）[Apache SkyWalking+1](https://skywalking.apache.org/zh/2022-08-30-pingan-jiankang/?utm_source=chatgpt.com)  · 指标聚合（L1, L2 等层级聚合）以降低存储量和查询成本，同时保证可用性和实时性[Apache SkyWalking](https://skywalking.apache.org/zh/2022-08-30-pingan-jiankang/?utm_source=chatgpt.com)  · 存储后端支持（如 ES, Kafka, 可扩展存储）以及索引、压缩、资源规划 [Apache SkyWalking+1](https://skywalking.apache.org/zh/2022-08-30-pingan-jiankang/?utm_source=chatgpt.com)  · UI 与 Topology 可视化、搜索 Trace、报警规则、依赖关系图等功能[InfoQ 写作社区+2博客园+2](https://xie.infoq.cn/article/3bff5919c317b9a37280ac759?utm_source=chatgpt.com) | · 存储成本 vs 索引性能：Trace 数据量巨大，查询性 vs 存储开销需平衡  · 聚合粒度 vs 延迟 vs 精确性  · 可扩展性（水平扩／分区／多实例）  · 网络带宽、传输可靠性（尤其在 Agent 到 OAP，或者使用 Kafka 中转） |
| **兼容性 / 扩展性 /安全性**     | · 插件体系使它能支持多种框架和协议（HTTP, RPC, Dubbo, 微服务多个语言）[博客园+2Apache Dubbo+2](https://www.cnblogs.com/kebibuluan/p/18627792?utm_source=chatgpt.com)  · 支持 OpenTracing / OpenTelemetry 等标准协议 / API 实现[InfoQ 写作社区+1](https://xie.infoq.cn/article/3bff5919c317b9a37280ac759?utm_source=chatgpt.com)  · 与其他运维／诊断工具（如 Arthas）集成或共存；SkyWalking 可以集成 Arthas 控制插件，从 UI 发起 Arthas 操作来做更深入排查[Apache SkyWalking](https://skywalking.apache.org/zh/2023-09-17-integrating-skywalking-with-arthas/?utm_source=chatgpt.com)  · 安全性与隔离（Agent 权限、安全边界）以及对业务进程的隐私／敏感信息处理 | · 插件冲突：多个 Agent 或诊断工具同时植入可能冲突  · 安全隐患：探针中是否有敏感数据收集、权限控制  · 版本升级／探针兼容性问题  · 在云环境／容器／K8s 中部署时的运维简便性 |

## 3️⃣ 性能优化策略

由于 Trace 数据量巨大，SkyWalking 在存储和查询上做了多层优化：

### (1) 异步写入

- Agent 采集数据后，通过 OAP Server 异步写入存储，**不阻塞业务线程**。
- 数据先在内存队列/缓存中缓冲，批量写入后端存储。

### (2) 批量处理

- 多个 Segment/Span 进行 **批量写入**，减少存储系统的请求次数。
- 对 Elasticsearch 或 MySQL 进行批量 insert 或 bulk 操作。

### (3) 数据压缩与编码

- Span/Segment 使用 **Protobuf 编码**，减少存储空间和网络开销。
- 大量字段可选，减少冗余信息写入。

### (4) 数据分层

- **原始 Trace 数据**：可保留 N 天，用于查询链路和调试。
- **聚合指标数据**：长期保存，用于 Dashboard / 告警，减少重复存储。

### (5) 索引设计

- Elasticsearch 存储时，常按 **TraceId / Service / Endpoint / Time** 建索引，快速定位特定请求链。
- 查询链路时，先根据 TraceId 或时间范围过滤，再聚合 Segment/Span，减少扫描量。

### (6) 查询优化

- Trace 查询通常是 **按 TraceId 或时间窗口**，结合索引减少全表扫描。
- OAP Server 会做 **Segment 聚合和缓存**，避免每次都读取原始 Span。

## 6️⃣ 数据存储与查询特点

1. **Segment 结构化 + 二进制字段**：
   - `data_binary` 存储 Span 的详细信息（序列化后的 Trace Segment）。
   - 快速写入 ES，减少字段膨胀。
2. **辅助索引字段**：
   - `trace_id`、`segment_id`、`service_id`、`endpoint_id`、`time_bucket` 用于 ES 索引，支持 Trace 查询和服务拓扑分析。
3. **日志与异常**：
   - `has_logs`、`is_error` 字段用于快速定位错误 Segment。
   - Span 细节在 `data_binary` 中，查询 Trace 时会反序列化。
