---
title: K8s 集群部署 Filebeat 采集日志
date: "2026-02-10"
tags: [K8s, 可观测]
description: "在 K8s 集群中以 DaemonSet 方式部署 Filebeat 采集容器日志：RBAC 授权、ConfigMap 配置挂载、多 namespace 日志分离与常见故障排查命令。"
published: true
---

# K8s 集群部署 Filebeat 采集日志

在 Kubernetes 集群中，推荐以 **DaemonSet** 方式部署 Filebeat，确保每个 Node 上都有一个采集进程负责本节点所有容器的日志。

---

## 部署步骤

### 1. 创建命名空间

```shell
kubectl create namespace logging
```

### 2. 配置 RBAC 授权

Filebeat 需要访问 K8s API 获取 Pod 元数据（label、namespace 等），创建对应 ServiceAccount 和 ClusterRole：

```shell
# 创建 ServiceAccount
kubectl create serviceaccount filebeat -n logging

# 应用 ClusterRole 和 ClusterRoleBinding
kubectl apply -f filebeat-rbac.yaml
```

`filebeat-rbac.yaml` 示例：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: filebeat
rules:
  - apiGroups: [""]
    resources: ["namespaces", "pods", "nodes"]
    verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: filebeat
subjects:
  - kind: ServiceAccount
    name: filebeat
    namespace: logging
roleRef:
  kind: ClusterRole
  name: filebeat
  apiGroup: rbac.authorization.k8s.io
```

### 3. 创建 ConfigMap

```shell
# 从本地 filebeat.yml 创建
kubectl create configmap filebeat-config \
  --from-file=filebeat.yml=./filebeat.yml \
  -n logging

# 或生成 YAML 再 apply（推荐，便于版本管理）
kubectl create configmap filebeat-config \
  --from-file=filebeat.yml=filebeat.yml \
  --dry-run=client -o yaml > filebeat-configmap.yaml
kubectl apply -f filebeat-configmap.yaml
```

### 4. 部署 DaemonSet

```shell
kubectl apply -f filebeat-kubernetes.yaml -n logging
```

### 5. 验证

```shell
# 查看 DaemonSet 状态
kubectl describe daemonset filebeat -n logging

# 查看某个节点的 Filebeat Pod 日志
kubectl logs <filebeat-pod-name> -n logging

# 进入容器排查
kubectl exec -it <filebeat-pod-name> -n logging -- /bin/bash
```

---

## 修改配置后滚动更新

```shell
# 更新 ConfigMap
kubectl apply -f filebeat-configmap.yaml

# 删除 Pod 触发重建（DaemonSet 会自动重新调度）
kubectl delete pods -l k8s-app=filebeat -n logging
```

也可以直接编辑：

```shell
kubectl edit configmap filebeat-config -n logging
```

---

## 常见问题

| 现象 | 排查方向 |
|------|---------|
| Filebeat Pod 启动后立即 CrashLoop | 检查 ConfigMap 中 `filebeat.yml` 语法，`kubectl logs <pod>` 查看错误 |
| 日志采集延迟 | 检查 Elasticsearch 索引写入 QPS，适当调大 `bulk_max_size` |
| 某个 namespace 日志未采集 | 确认 filebeat.yml 中 `paths` 包含该 namespace 的日志路径，RBAC 授权是否覆盖 |
| Pod 元数据（label/namespace）缺失 | 确认 `processors.add_kubernetes_metadata` 配置正确 |
