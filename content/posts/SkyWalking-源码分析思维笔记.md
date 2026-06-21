---
title: SkyWalking 源码分析思维笔记
date: "2026-05-22"
tags: [可观测, Java]
description: "SkyWalking 源码导读：插件 SPI 加载流程、ServiceManager 生命周期、GRPCChannelManager 连接管理与 Agent 启动链路的思维笔记。"
published: true
---

# SkyWalking 源码分析思维笔记

> **背景：** 生产环境涉及上百个微服务，没有完善的可观测体系问题定位就只能靠肉眼看日志，效率极低，下面是当时的完整记录与思考。

## 1. 原理简述

- 在目标类中插入自己的监控代码。
- 典型应用：系统诊断（如阿里 Arthas、笨马 XPocket）。

------

## 2. Agent

### 2.1 启动方式

#### 静态启动

- 使用 `-javaagent` 参数
- 入口方法：`premain()`
- 在类加载时，可任意修改目标类字节码，只要符合规范
- SkyWalking 只支持这种方式启动 Agent

#### 动态附加

- 使用 Attach API
- 入口方法：`agentmain()`
- 类已加载，字节码只能有限修改：
  - 不能增减父类
  - 不能增加接口
  - 不能调整 Field

------

### 2.2 启动流程

1. **初始化配置**
   - 配置来源：
     - `/config/agent.config`
     - 系统环境变量
     - Agent 参数
   - 优先级：自下而上
   - 配置映射到 `Config` 类
   - 根据配置指定日志解析器
   - 检查 Agent 名称和后端地址
   - 标记配置加载完成
2. **加载插件**
   - 并行类加载器
     - 调用 registerAsParallelCapable() 方法开启
     - 原理就是将类加载时的锁从类加载器级别缩小到具体加载的某一个类
     - AgentClassLoader
       - classpath: /config/plugins、/config/activations
   - 插件定义体系
     - 插件定义：XxxInstrumentation
       - 拦截实例方法/构造器：ClassInstanceMethodsEnhancePluginDefine
       - 拦截静态方法：ClassStaticMethodsEnhancePluginDefine
       - AbstractClassEnhancePluginDefine 是所有插件定义的顶级父类
       - 要拦截的类：enhanceClass()
       - 要拦截的方法：getXxxInterceptorPoints()
     - 目标类匹配
       - ClassMatch
         - 按类名匹配：NamedMatch
         - 间接匹配：IndirectMatch
           - PrefixMatch
           - MethodAnnotationMatch
     - 拦截器定义
       - beforeMethod
       - afterMethod
       - handleMethodException
     - 插件声明
       - resources/skywalking-plugin.def
       - 插件名称=插件定义
   - 加载流程：
     - PluginBootstrap 实例化所有插件
       - PluginResourcesResolver 查找 skywalking-plugin.def
       - PluginCfg 封装 PluginDefine
       - DynamicPluginLoader 加载基于 XML 配置的插件
     - PluginFinder 分类插件
       - 命名插件 - NameMatch
       - 间接匹配插件 - IndrectMatch
       - JDK 类库插件
   - 定制 Agent
     - 创建 ByteBuddy 实例
     - 指定 ByteBuddy 要忽略的类
       - synthetic
       - 解决 var that = this 的问题
       - 仅在嵌套类中讨论
       - Field - 访问外部类属性
       - Constructor - 使用 private 构造器
       - Method - 访问内部类属性
       - NBAC
         - Nest Based Access Control
         - JDK11 引入
         - 不再生成 synthetic method
         - 新的嵌套类关系组织方式
           - nestHost 指向宿主类
           - nestMembers 列出嵌套关系中所有类型
     - 将必要类注入 `BootstrapClassLoader`
     - 解决 JDK 模块系统的跨模块访问
     - 根据配置决定是否保存字节码（磁盘/内存）
     - 细节定制
       - 指定 ByteBuddy 要拦截的类
       - 指定做字节码增强的工具
       - 指定字节码增强的模式
         - Redefine
           - 覆盖掉被修改的内容
         - Retransform
           - 保留被修改的内容
       - 注册监听器
       - 将 Agent 安装到 Instrumentation
3. **加载服务**
   - 服务组织
     - 服务需要实现 BootService 接口
     - 如果服务只有一种实现，直接创建一个类即可
     - 如果服务有多种实现
       - 默认实现需要使用 @DefaultImplementor
       - 覆盖实现需要使用 @OverrideImplementor
   - 加载流程
     - SPI 加载所有 BootService 的实现
     - 根据服务的实现模式进行服务的筛选
       - 两个注解都没有的服务实现直接加入集合
       - 对于 @DefaultImplementor
         - 直接加入集合
       - 对于 @OverrideImplementor
         - value 指向的服务有 @DefaultImplementor 则覆盖掉
         - value 指向的服务没有 @DefaultImplementor 则报错
   - 注册关闭钩子

------

### 2.3 插件工作原理

#### Witness 机制

- 作用：识别组件版本

- `witnessClasses`：在指定类加载器下查找指定的类型，如果有多个类型则必须同时存在

- `witnessMethods`：在指定的类下面查找指定的方法，如果有多个方法则必须同时存在

- 工作流程：

  - 校验 `TypeDescription` 合法性
  - Witness 机制校验当前插件是否可用
  - 字节码增强流程

  - **静态方法**
    - 要修改原方法入参
      - 是 JDK 类库的类
      - 不是 JDK 类库的类
        - 实例化插件中定义的 Interceptor
        - 调用 beforeMethod()
          - 可以修改原方法入参
        - 调用原方法
          - 调用时可以传参
          - 对于异常，调用 handleMethodException()
        - 调用 afterMethod()
      - 不修改原方法入参
        - 是 JDK 类库的类
          - 前置工作：使用对应的 Template 生成实际使用的拦截逻辑，即 Xxx_internal
          - 调用 prepare()
            - 打通 BootstrapClassLoader 和 AgentClassLoader
              - 拿到日志对象 ILog
            - 实例化插件定义的拦截器
              - 替代非 JDK 核心类库处理逻辑里的 InterceptorInstanceLoader.load
            - 后续流程和非 JDK 核心类库处理流程一致
        - 不是 JDK 类库的类
          - 实例化插件中定义的 Interceptor
          - 调用 beforeMethod()
          - 调用原方法
            - 调用时不能传参
            - 对于异常，调用 handleMethodException()
          - 调用 afterMethod()
  - 构造器和实例方法
    - 构造器
      - 是 JDK 类库的类
      - 不是 JDK 类库的类
        - 只能在拦截的构造器原本逻辑执行完成以后再执行 onConstruct()
      - 实例方法
        - 参照静态方法

- 将记录状态的上下文 EnhanceContext 设置为「已增强」

------

## 3. 服务 BootService

- **GRPCChannelManager**：Agent 到 OAP 网络连接，定时重连，通知网络状态变化
- **ServiceManagementClient**：向 OAP 汇报信息，保持心跳
- **CommandService**：调度 OAP 下发命令，收集其他服务获得的命令，转交给 `CommandExecutorService`
- **CommandExecutorService**
  - 选择一个具体的命令处理器
  - CommandExecutor
    - `ConfigurationDiscoveryCommandExecutor`：配置变更处理
      - `AgentConfigChangeWatcher`：对某一个配置项的值变化进行监听
      - `WatcherHolder`：对上面监听器的封装
      - WatchHolder 的集合
    - `ProfileTaskCommandExecutor`：性能追踪命令处理器
- **SamplingService**：
  - 控制链路是否上报 OAP
  - 采样策略：
    - 如果配置了采样率，则 3 秒内最多上报配置值数量的链路到 OAP
    - 如果采样机制关闭，则默认所有采集到的链路都要上报到 OAP
  - 采样率动态变化：`SamplingRateWatcher`
- **JVMService**：收集 JVM 指标
  - 收集 JVM 的相关指标
  - 收集和发送分离
    - 收集：`XxxProvider`
    - 发送：`JVMMetricsSender`
- **KafkaXxxService**：
  - 由 Agent 直连 OAP 改为通过 Kafka 交互
  - Agent 和 OAP 依然存在 GRPC 直连
  - 大部分的采集的数据都改为走 Kafka
- **StatusCheckService**：判断异常状态是否有效

------

## 4. 链路追踪

### 4.0 推荐文档

- https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/papers/dapper-2010-1.pdf
- https://github.com/opentracing/specification/blob/master/specification.md

### 4.1 基本概念

- **Trace**：跨线程/进程的整个链路（多个 Segment）
- **Segment**：JVM 内单线程操作集合
- **Span**：单个操作
- **TraceSegmentRef**：
  - 组成 Trace 的基本单元引用
    - Trace 不是一个具体的数据模型，而是多个 Segment 串起来表示的逻辑对象
  - TraceSegmentRef 用于引用 Parent Segment
  - 所有的 Span 维护在一个 LinkedList 中
  - relatedGlobalTraceId 表示当前 Segment 所在的 Trace
  - isSizeLimited 如果为 true 表示当前这条线程内发生的操作次数超过了配置值，Segment 丢弃了一部分操作
- **Span 维护**：LinkedList
- **相关字段**：
  - `relatedGlobalTraceId`：Segment 所属 Trace
  - `isSizeLimited`：是否超出操作次数，丢弃部分操作

### 4.2 Span 类型

- **AsyncSpan**：最顶层的 Span 定义，用于异步插件
- **AbstractSpan**：Span 骨架
  - `setComponent`：指定Span所在的插件
  - `setLayer`：指定 Span 所在插件的类型
  - tag 在 Span 上打标签
  - log 在 Span 上记录异常事件和自定义事件
  - setOperationName 指定 Span 这个动作的名称
    - HTTP 请求 -> URL
    - Redis 操作 -> Redis 命令
  - start 启动 Span
  - ref 串联 TraceSegment
  - setPeer 指定 Span 操作的远端地址
- **AbstractTracingSpan**：用于链路追踪的 Span 模型
  - spanId 从 0 开始自增
  - parentSpanId 记录上一个 Span 的 ID，第一个 Span 的这个值为 -1
  - isInAsyncMode 表示当前Span 表示的异步操作是否已经开始
  - isAsyncStopped 表示当前Span 表示的异步操作是否已经结束
  - TracingContext 当前链路 Segment 和 Span 的上下文
  - refs 当前 Span 所在的 Segment 的上一个 Segment 的引用，可能有多个
- **StackBasedTracingSpan **：基于虚拟栈结构的 Span
  - 并没有一个具体的栈结构
  - 通过 stackDepth 和 currentMaxDepth 来模拟栈操作
  - EntrySpan
    - 只会在第一个插件创建，后面的插件都是复用第一个插件创建的实例
    - 记录的信息是最靠近服务侧的
    - 一个 TraceSegment 只能有一个 EntrySpan
    - 只有当 stackDepth == currentMaxDepth 时才能记录信息
- ExitSpan
  - 所谓 ExitSpan 和 EntrySpan 一样采用复用的机制，前提是在插件嵌套的情况下
  - 多个 ExitSpan 不存在嵌套关系，是平行存在的时候，是允许同时存在多个 ExitSpan
  - 把 ExitSpan 简单理解为离开当前进程/线程的操作
  - TraceSegment 里不一定非要有 ExitSpan
  - 记录的信息是最靠近消费侧的
- LocalSpan
  - 通常用于记录一个本地方法调用
- NoopXxxSpan
  - 表示一个不会被记录的操作
  - 为了确保Span整个工作流程的统一

### 4.3 链路追踪上下文

- **AbstractTracerContext**
  - 跨进程传播数据
    - inject
    - extract
    - 数据载体 ContextCarrier
  - 跨线程传播数据
    - capture
    - continued
    - 数据载体 ContextSnapshot
- **TracingContext**
  - 管理当前 Segment 和自己前后的 Segment 的引用 TraceSegmentRef
  - 管理当前 Segment 内的所有 span - 基于栈结构 activeSpanStack
  - 创建 Entry Exit Local 三种 Span
  - 结束 Span 和自身
- **IgnoredTracerContext**
  - 被忽略的 Segment 的上下文管理器
- 适配器 - ContextManager
  - 用于适配 AbstractTracerContext 以创建具体的实现的实例
  - 代理了 AbstractTracerContext 的一些主要方法
  - 这里面所有的方法实际上都是调用的对应的 AbstractTracerContext 实例的方法
  - RuntimeContext
    - 和 TraceContext 生命周期一致
    - 有时候需要记录一些额外的信息，那么就记录在 RuntimeContext
  - ContextManagerExtendService
    - 真正用于创建具体的 TracerContext
- 链路数据发送
  - TraceSegmentServiceClient
    - 基于 GRPC
    - 每次发送必须强制等待所有数据都发送完
  - KafkaTraceSegmentServiceClient
    - 基于 Kafka
    - 每条数据包装为一条 Kafka 消息同步发送

## 5. 工具

- **DataCarrier** / **QueueBuffer**：数据存储最小单元
- **Buffer**：Object 数组环形队列
  - Agent 使用：ArrayBlockingQueueBuffer
  - OAP 使用：AtomicIntegerArray（JDK8+）
- **BufferStrategy**
  - BLOCKING：阻塞等待
  - IF_POSSIBLE：直接丢弃
- **Channels**：管理多个 Buffer，使用 `IDataPartitioner`
  - SimpleRollingPartitioner：轮询
  - ProducerThreadPartitioner：线程绑定
- **数据消费**
  - **ConsumerThread**：绑定多个 Buffer
  - **MultipleChannelsConsumer**：管理多个 Group
  - **ConsumeDriver**：多线程消费一个 Channels
  - **BulkConsumePool**：管理多个 MultipleChannelsConsumer，增加 Group 时分配 Buffer
