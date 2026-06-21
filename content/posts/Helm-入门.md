---
title: Helm 入门：从 kubectl apply 到包管理
date: "2025-07-09"
tags: [Kubernetes, K8s, 云原生, 运维]
description: 不同环境只维护 values-.yaml，模板保持唯一来源，避免 YAML 漂移。
published: true
---

# Helm 入门：从 kubectl apply 到包管理

## 背景（Situation）

K8s 集群里要部署的应用越来越多，纯 `kubectl apply` 维护多套环境的 YAML 既冗余又容易漂移。

## 目标（Task）

评估并落地 Helm 作为团队的标准包管理工具，先从单机安装与最小命令集开始。

## 行动（Action）

### 安装

```bash
# Linux 一键安装脚本（官方）
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod +x get_helm.sh
./get_helm.sh
helm version
```

### 最小可用流程

```bash
# 1. 添加官方仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 2. 查找 chart
helm search repo nginx

# 3. 安装
helm install my-nginx bitnami/nginx -n web --create-namespace

# 4. 升级 / 回滚
helm upgrade my-nginx bitnami/nginx -f values.yaml
helm rollback my-nginx 1

# 5. 卸载
helm uninstall my-nginx -n web
```

### 我们的自定义 chart 目录约定

```
charts/<app-name>/
├── Chart.yaml         # 元数据
├── values.yaml        # 默认值
├── values-dev.yaml    # 环境覆盖
├── values-prod.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── _helpers.tpl
```

不同环境只维护 `values-<env>.yaml`，模板保持唯一来源，避免 YAML 漂移。


## 收获（Result）

Helm 让我们把一套应用打成 chart，开发/测试/生产共用模板、差异通过 values 文件管理，新环境上线时间从半天压缩到 20 分钟。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
