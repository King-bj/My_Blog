---
title: Kubernetes 控制机制（声明式 + Reconcile）设计解读
date: "2026-06-19"
tags: [K8s, 架构设计]
description: "K8s 控制平面核心机制解读：声明式 API、Reconcile Loop、level-triggered 事件模型与最终一致性，是理解和编写自定义 Controller 的必备基础。"
published: true
---

# Kubernetes 控制机制（声明式 + Reconcile）设计解读

团队成员对 K8s 长期停留在 `kubectl apply` 的层面，遇到调度异常、Operator 行为不一致时无从下手。把 K8s 核心控制机制讲清楚，是提升团队 K8s 运维能力的前提。

---

## 一、声明式 API：描述目标，而非步骤

命令式：`kubectl scale deployment foo --replicas=3`（告诉系统"做什么"）

声明式：`kubectl apply -f deployment.yaml`（告诉系统"我要什么样的状态"，系统负责达成）

**意义：**
1. **幂等性**：同一个 YAML `apply` 多次，结果一致
2. **自愈**：Pod 异常删除后，Controller 自动补齐
3. **容错**：网络分区或短暂故障不会导致系统状态撕裂

---

## 二、控制器模式（Reconcile Loop）

K8s 所有控制器都遵循同一个模式：

```
Observe（观察当前状态）
  ↓
Diff（与期望状态对比）
  ↓
Act（执行动作使二者趋同）
  ↓
回到 Observe（循环）
```

用伪代码表示：

```go
func (c *Controller) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
    // 1. 读取当前状态
    var obj MyResource
    if err := c.Get(ctx, req.NamespacedName, &obj); err != nil {
        return reconcile.Result{}, client.IgnoreNotFound(err)
    }

    // 2. 对比期望状态
    if obj.Spec.Replicas == *obj.Status.Replicas {
        return reconcile.Result{}, nil // 已一致，无需操作
    }

    // 3. 执行操作
    return reconcile.Result{}, c.adjustReplicas(ctx, &obj)
}
```

**核心原则：控制逻辑只依赖当前状态，不依赖事件历史。**

这个设计来源于分布式系统的基本认知：在一个经常出现局部错误的环境中，"历史事件"是不可靠的，但"当前快照"是可以确认的。

---

## 三、Level-Triggered vs Edge-Triggered

K8s 使用 **level-triggered（水平触发）** 而非 edge-triggered（边沿触发）：

| | Edge-Triggered | Level-Triggered |
|-|---------------|----------------|
| 触发时机 | 状态变化瞬间 | 状态持续不一致时 |
| 事件丢失 | 危险：丢失事件则永久不一致 | 安全：只要不一致就持续尝试 |
| K8s 实现 | 不用 | 使用，通过 Reconcile Loop |

**实际含义：** 即使因为网络问题漏掉了某个 watch 事件，Controller 定期全量 Resync 也能发现不一致并修复。

---

## 四、最终一致性保证

K8s 不保证强一致，但通过以下机制保证最终一致：

1. **Informer 缓存**：Controller 从本地缓存读取状态，减少 API Server 压力
2. **Workqueue 去重**：同一个对象的多次变更合并为一次 Reconcile
3. **指数退避重试**：Reconcile 失败后指数退避重试，最终达成期望状态
4. **定期 Resync**：默认每 10 分钟全量同步一次，修复漏掉的事件

---

## 五、自定义 Controller 的设计要点

1. **Reconcile 必须幂等**：同一个 Request 被处理多次，结果一致
2. **不要在 Reconcile 里存内存状态**：重启后 Reconcile 会重新执行，内存状态丢失
3. **Status 与 Spec 分离**：Spec 是期望状态（用户写），Status 是当前状态（Controller 写）
4. **OwnerReference 管理子资源**：创建的子资源（Pod/Service）要设置 OwnerReference，保证级联删除

---

## 结论

理解了 Reconcile Loop 和 level-triggered 模型，就能回答大多数 K8s 运维问题：

- "为什么 Deployment 删了 Pod 之后又重建？" → Controller 检测到实际副本数 < 期望副本数，自动补齐
- "为什么 apply 了 YAML 没生效？" → 看 Reconcile 日志，找到哪一步 Act 失败了
- "为什么 CRD 对象删不掉？" → Finalizer 未清除，Controller 还在做清理操作
