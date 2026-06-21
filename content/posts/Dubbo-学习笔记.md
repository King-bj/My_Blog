---
title: Dubbo 学习笔记：协议、注册中心与负载均衡
date: "2026-01-16"
tags: [中间件]
description: Dubbo 调用链条 1. 服务暴露（Provider） 2. 服务引用（Consumer） 3. 服务调用 4. 结果返回 关键点：Invoker、Proxy、Filter、Protocol、Registry、Nett...
published: true
---

# Dubbo 学习笔记：协议、注册中心与负载均衡

## 背景（Situation）

实时链路里同时存在 Kafka、Flink、ZooKeeper、Dubbo 等多种中间件，出问题时往往牵一发动全身。

## 目标（Task）

把这次涉及的中间件知识点 / 故障现象 / 处理思路完整记录，沉淀成可复用的经验。

## 行动（Action）

Dubbo 调用链条

## 一、Dubbo RPC 生命周期

1. **服务暴露（Provider）**
   - `ServiceConfig` 启动 → 通过 `Protocol.export` 打开端口 (Netty)
   - 将服务元数据注册到 **注册中心** (Nacos/Zookeeper)
2. **服务引用（Consumer）**
   - `ReferenceConfig` 创建代理 → 向注册中心订阅服务
   - 缓存服务列表（Directory），通过负载均衡 (LoadBalance) 选择调用目标
3. **服务调用**
   - 动态代理拦截调用 → 封装 `RpcInvocation` → Netty 客户端发送请求
   - Provider Netty 服务端接收 → 调用本地实现类 → 返回 `RpcResult`
4. **结果返回**
   - Consumer 收到响应 → 解析结果 → 返回给业务方

**关键点**：Invoker、Proxy、Filter、Protocol、Registry、Netty 通信。

------

## 二、Spring Cloud Feign + Nacos 生命周期

1. **服务注册与发现**
   - Provider 启动 → `spring-cloud-starter-alibaba-nacos-discovery` 注册服务信息到 Nacos
   - Consumer 启动 → 从 Nacos 拉取服务列表
2. **服务引用**
   - `@FeignClient` 注解生成接口代理
   - Ribbon / LoadBalancerClient 负责服务选择
3. **服务调用**
   - 动态代理封装请求 → 转为 HTTP 请求 (RestTemplate/OkHttp)
   - 通过负载均衡选目标 → 发起 HTTP 调用 → Provider Controller 处理
4. **结果返回**
   - Provider 返回 JSON → Consumer 解析 JSON → 返回 Java 对象

**关键点**：Feign 动态代理、Nacos Discovery、LoadBalancer、HTTP 协议。

**Dubbo Filter**：拦截点在 **RPC 框架内部**，基于 SPI，天然能扩展调用链 → AOP at RPC level。

**Feign**：拦截点在 **HTTP 客户端层**，通过 RequestInterceptor/Decoder → AOP at HTTP level。

**Nacos**：只是注册中心，不能作为拦截点，要做拦截只能结合 Gateway。

> 在 Spring Cloud 体系里，Feign + Nacos 默认是服务间直连调用，不会走网关。但如果公司有统一流量治理或安全要求，可以把网关作为 Feign 的统一入口，让 Feign 调用网关，再由网关去路由后端服务。Dubbo 则默认直连 Provider，更强调高性能 RPC 调用。

## 收获（Result）

整理之后这部分内容成了团队内的标准参考，再次遇到类似场景时可以直接复用。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
