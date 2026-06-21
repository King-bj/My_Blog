---
title: Minikube 本地开发环境使用笔记
date: "2026-05-14"
tags: [K8s, DevOps]
description: "Minikube 本地多节点集群搭建：私有 Registry 配置、Ingress 启用、持久化存储与常见坑，适合 K8s 开发测试环境快速上手。"
published: true
---

# Minikube 本地开发环境使用笔记

> **背景：** 项目上云后，所有服务运行在 K8s 集群中，运维与开发都需要熟悉 K8s 的基本概念和高频操作，下面是当时的完整记录与思考。

# 启动 3 节点集群（带私有 Registry 与国内镜像加速）
minikube start \
  --driver=docker \
  --registry-mirror=https://registry.docker-cn.com \
  --insecure-registry=registry.example.com \
  --nodes 3 \
  --cpus='8' --memory='16g' \
  --kubernetes-version=v1.25.15

# 指定主机 IP 作为 API Server 地址（多网卡场景）
minikube start \
  --vm-driver=docker \
  --registry-mirror=https://registry.docker-cn.com \
  --insecure-registry=registry.example.com \
  --kubernetes-version=v1.25.15 \
  --apiserver-ips="<host-ip>" \
  --apiserver-port=8443 \
  --extra-config=kubelet.cgroup-driver=systemd \
  --cni=calico \
  --nodes 3 \
  --cpus='8' --memory='16g'

# 为命名空间配置私有仓库拉取 Secret
kubectl create secret docker-registry registry-key \
  --docker-server=registry.example.com \
  --docker-username=<registry-user> \
  --docker-password=<registry-password> \
  -n <namespace>

# 绑定 ServiceAccount 使用该 Secret 拉取镜像
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "registry-key"}]}'

minikube profile list

重建docker0网络
sudo systemctl stop docker
sudo ip link delete docker0
sudo systemctl start docker
