---
title: Kubernetes 基础知识梳理
date: "2026-06-16"
tags: [K8s, DevOps]
description: "Kubernetes 核心概念速查：Pod、Node、Service、Deployment、StatefulSet、PV/PVC 的定义与使用场景，附生产常见问题梳理。"
published: true
---

# Kubernetes 基础知识梳理

> **背景：** 项目上云后，所有服务运行在 K8s 集群中，运维与开发都需要熟悉 K8s 的基本概念和高频操作，下面是当时的完整记录与思考。

### K8s名词及关系

1.  **Pod**: Pod 是 Kubernetes 中的基本单元，代表在集群中运行的一个或多个紧密相关的容器。每个 Pod 都有一个特定的网络 IP，容器在 Pod 中共享网络命名空间、IP 地址和端口号。
2.  **Node（节点）**: 一个 Node 是运行容器化应用的物理或虚拟机。每个 Node 都由 Master 管理，可以有多个 Pods。
3.  **Master（主节点）**: Master 负责管理集群的状态。它包括几个关键组件，如 API Server、Scheduler、Controller Manager 等。
4.  **API Server**: Kubernetes API Server 是集群控制的前端，用于与用户和其他 Kubernetes 组件交互。
5.  **Scheduler（调度器）**: 调度器负责调度 Pods 到 Nodes 上，基于资源需求、约束条件等因素。
6.  **Controller Manager**: 控制器用于监视集群的状态，并确保实际状态与期望状态匹配。
7.  **Service**: Service 是一种抽象，用于定义如何访问 Pod，提供负载平衡和服务发现机制。
8.  **Deployment**: 部署是管理 Pod 和 ReplicaSets 的方式。它使更新和回滚服务变得容易。
9.  **ReplicaSet**: ReplicaSet 确保指定数量的 Pod 副本始终运行。
10. **Namespace（命名空间）**: 命名空间是对一组资源和对象的逻辑分组，用于隔离和组织集群资源。
11. **Volume（卷）**: 卷是一种存储机制，允许数据在 Pod 重启时持久化。
12. **ConfigMap 和 Secret**: ConfigMaps 和 Secrets 用于存储配置数据和敏感信息，如密码和密钥，可以被 Pods 使用。
13. **Ingress**: Ingress 是一个 API 对象，用于管理外部访问集群中的服务，提供 HTTP 和 HTTPS 路由。
14. **Persistent Volume (PV)**: 持久卷（PV）是由管理员预先配置的一块存储，它是集群中的资源。PV 可以是任何一种支持的存储后端（如 NFS、iSCSI、云提供商的存储解决方案等）。这个资源独立于单个 Pod 的生命周期，允许数据在 Pod 重启和删除时保持持久。
15. **Persistent Volume Claim (PVC)**: 持久卷声明（PVC）是用户对存储资源的请求。用户在 PVC 中指定他们需要的存储大小、访问模式（如读写或只读）等。然后，Kubernetes 系统匹配这些请求与可用的 PV。一旦绑定，PVC 可以被 Pod 使用，就像使用本地节点上的存储一样。
16. **DaemonSet**:
    - **定义**: DaemonSet 确保所有（或某些特定）节点上运行指定的 Pod 副本。每当有新节点加入集群时，DaemonSet 会自动在这些节点上添加 Pod 副本。如果节点从集群中移除，这些 Pod 也会被自动删除。
    - **用途**: 通常用于运行集群级别的服务，如日志收集、监控代理等，在每个节点上运行一个副本。
17. **StatefulSets**:
    - **定义**: StatefulSets 是用于管理有状态应用的工作负载 API 对象。它为每个 Pod 副本提供了稳定的、唯一的网络标识符，并能保持其状态（如存储）。
    - **用途**: 适用于需要稳定的身份标识、稳定的网络名称和持久存储的应用，如数据库（例如 MySQL、PostgreSQL）。
18. **Deployments**:
    - **定义**: Deployments 提供了声明式的更新能力，用于 Pod 和 ReplicaSets（Pod 的集合）。它允许你描述应用的期望状态，Deployment 控制器会自动更改实际状态以匹配期望状态。
    - **用途**: 适用于无状态应用，用于创建和更新应用的实例，支持滚动更新、回滚、缩放等操作。

- 一个 Node 包含多个 Namespaces。
- 在每个 Namespace 内部，有 StatefulSets 和 Deployments，这些都是用于创建 Pods。
- Pods 展示了挂载 PVCs，而 PVCs 又指向 PVs。
- Pods 同时使用 ConfigMaps 和 Secrets 进行配置。
- 一个 Service 指向多个 Pods 的端口
