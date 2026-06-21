---
title: Minikube 本地开发环境使用笔记
date: "2025-08-09"
tags: [Kubernetes, K8s, 云原生, 运维]
description: "minikube start --driver=docker --registry-mirror=https://registry.docker-cn.com --insecure-registry=hub.bigito..."
published: true
---

# Minikube 本地开发环境使用笔记

> **背景：** 项目上云后，所有服务运行在 K8s 集群中，运维与开发都需要熟悉 K8s 的基本概念和高频操作，下面是当时的完整记录与思考。

#启动3节点集群
minikube start --driver=docker --registry-mirror=https://registry.docker-cn.com --insecure-registry=hub.bigitom.com --nodes 3 --cpus='8' --memory='16g' --kubernetes-version=v1.18.18

minikube start -p k8s-v2 --driver=docker --registry-mirror=https://registry.docker-cn.com --insecure-registry=hub.bigitom.com --nodes 3 --cpus='8' --memory='16g' --kubernetes-version=v1.18.18

minikube start -p k8s-v18 --vm-driver=docker --registry-mirror=https://registry.docker-cn.com --image-mirror-country cn --insecure-registry=hub.bigitom.com --kubernetes-version=v1.18.18 --nodes 3

minikube start --vm-driver=docker --registry-mirror=https://registry.docker-cn.com --image-mirror-country cn --insecure-registry=hub.bigitom.com --kubernetes-version=v1.18.18 --cpus='8' --memory='16g' --nodes 3

minikube start --vm-driver=docker --registry-mirror=https://registry.docker-cn.com --image-mirror-country cn --insecure-registry=hub.bigitom.com --kubernetes-version=v1.21.14 --apiserver-ips="192.168.140.153" --apiserver-port=8443 --cpus='8' --memory='16g' --nodes 3

minikube start --vm-driver=docker --registry-mirror=https://registry.docker-cn.com  --insecure-registry=hub.bigitom.com --kubernetes-version=v1.21.14 --apiserver-ips="192.168.140.153" --apiserver-port=8443 --cpus='8' --memory='16g' --nodes 3

minikube start --vm-driver=docker --registry-mirror=https://registry.docker-cn.com  --insecure-registry=hub.bigitom.com  --apiserver-ips="192.168.140.153" --apiserver-port=8443 --cpus='8' --memory='16g' --nodes 3

minikube start --vm-driver=docker --registry-mirror=https://registry.docker-cn.com  --insecure-registry=hub.bigitom.com --kubernetes-version=v1.25.15 --apiserver-ips="192.168.140.153" --apiserver-port=8443 --cpus='8' --memory='16g' --nodes 3

 1.25.15

minikube start
-p k8s-v1
--registry-mirror=https://registry.docker-cn.com
--insecure-registry=hub.bigitom.com
--image-mirror-country=cn
--driver=docker
--extra-config=kubelet.cgroup-driver=systemd
--cni=calico
--nodes 3
--cpus='8' --memory='16g'

#授权
kubectl create secret docker-registry registry-key-power --docker-server=hub.bigitom.com --docker-username=admin --docker-password=***REDACTED*** -n elastic-system

kubectl create secret docker-registry registry-key-power --docker-server=hub.bigitom.com --docker-username=admin --docker-password=***REDACTED*** -n agent

kubectl patch serviceaccount kafka -p '{"imagePullSecrets": [{"name": "registry-key-power"}]}'

minikube profile list

重建docker0网络
sudo systemctl stop docker
sudo ip link delete docker0
sudo systemctl start docker
