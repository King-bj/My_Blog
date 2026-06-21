---
title: Kubernetes 高频命令速查表
date: "2025-07-19"
tags: [Kubernetes, K8s, 云原生, 运维]
description: 所有命令后加上 -n 即为在该命名命名空间下执行命令，不加则为在默认命名空间下执行命令。如： 查询所有pod 一般除了pvc，只建议使用删除yaml运行的所有内容删除服务，以避免删除错误。 pvc为持久化存储，只有当需要...
published: true
---

# Kubernetes 高频命令速查表

> **背景：** 项目上云后，所有服务运行在 K8s 集群中，运维与开发都需要熟悉 K8s 的基本概念和高频操作，下面是当时的完整记录与思考。

### K8S常用命令

[TOC]

所有命令后加上 -n <命名空间> 即为在该命名命名空间下执行命令，不加则为在默认命名空间下执行命令。如：

```shell
#查询命名空间下pod
kubectl get po -n <命名空间>
#查询默认空间下pod
kubectl get po
```

#### 镜像更新

##### 登录docker

```
docker login -u <账号> -p <密码> <私仓地址> 
```

##### 加载镜像

```
docker load -i <镜像名>.tar
```

##### 镜像打标签

```
docker tag hub.bigitom.com/<镜像名>:<标签名> <私仓地址>/<镜像名>:<标签名>
```

##### 镜像推送到私库

```
docker push <私仓地址>/<镜像名>:<标签名>
```

#### 查询类

查询所有pod 

```shell
#普通查询
kubectl get po
#查询更多详细信息比如nodeip,podip
kubectl get po -o wide
```

##### 查询所有service

```shell
kubectl get svc
```

##### 查询所有使用的持久卷声明

```shell
kubectl get pvc
```

##### 查询所有使用的持久卷

```shell
kubectl get pv
```

##### 查询pod日志 

```shell
# -f 参数可以持续查看日志
kubectl logs <pod名称> 
```

##### 查询pod启动描述信息

```shell
kubectl describe pod <pod名称> 
```

##### 查询所有的configmap

```shell
kubectl get configmap 
```

##### 查询具体configmap的值

```shell
kubectl describe configmap <configmap名称> 
```

##### 查询pod的yaml配置

```shell
#查询的是当前启动环境的所有配置，包含k8s自动分配的一些配置比如hostip等
kubectl get po <pod名称> -o yaml
```

##### 查看deployment详细信息

```shell
kubectl describe deployment <deployment名称>
```

##### 查看所有的daemonset

```
kubectl get daemonset  
```

##### 查看所有的statefulsets

```
kubectl get  statefulsets 
```

##### 查看daemonset信息

```
kubectl describe daemonset <daemonset名称>
```

##### 查看StatefulSets信息

```
kubectl describe statefulsets  <statefulsets名称>
```

##### 进入容器

```shell
#进入容器
kubectl exec -it <POD名称>  sh 
```

#### 创建类

##### 根据文件生成configmap

```shell
#根据文件生成configmap
kubectl create configmap <configmap名称> --from-frile=<文件路径> 
#根据文件生成configmap的yaml文件,不会创建configmap
kubectl create configmap <configmap名称> --from-frile=<文件路径> --dry-run=client -o yaml > <文件名>
```

##### 创建命名空间

```
kubectl create ns <命名空间名称>
```

##### 创建secret身份认证或密钥

```shell
kubectl create secret docker-registry registry-key-power --docker-server=<私仓地址> --docker-username=<私仓账号> --docker-password=***REDACTED***
```

#### 运行类

##### 运行yaml文件

```
kubectl apply -f <yaml文件名称>
```

##### 一次性运行指定镜像，并进入镜像中（通常用于pod启动后迅速失败，无法进入容器内查询问题时使用）

```
#启动镜像后进入容器内
kubectl run -it myshell --rm --image=<镜像名称> --restart=Never sh
```

##### 设置使用默认拉取镜像使用的secret

```shell
kubectl patch serviceaccount <命名空间> -p '{"imagePullSecrets": [{"name": "registry-key-power"}]}'  
```

##### 临时开启端口访问

```shell
kubectl port-forward --address 0.0.0.0 service/<service名称>  <映射端口>:<service端口>
```

##### 重启deployment服务

```shell
kubectl rollout restart deployment  <deployment名称>
```

##### 重启以特殊前缀开头的所有deployment启动的服务

```shell
kubectl get deployments --no-headers=true | awk '/^<前缀>/{print $1}' | xargs -I {} kubectl rollout restart deployment {}
#样例，重启所有power开头的deployment类型服务
kubectl get deployments --no-headers=true | awk '/^power/{print $1}' | xargs -I {} kubectl rollout restart deployment {}
```

#### 删除类

一般除了pvc，只建议使用删除yaml运行的所有内容删除服务，以避免删除错误。 pvc为持久化存储，只有当需要永久删除数据时才需要删除pvc

##### 删除yaml运行的所有内容

```shell
#不会删除pvc持久化存储
kubectl delete  -f <yaml文件名称>
```

##### 删除pvc

```
kubectl delete  pvc  <pvc名称>
```

##### 删除pod

```shell
kubectl delete pod  <pod名称>
#强制删除pod
kubectl delete pod <pod名称>  --grace-period=0 --force
```

##### 删除configmap

```shel
kubectl delete  configmap  <configmap名称>
```

##### 删除service

```shell
kubectl delete  svc  <service名称>
```

kube-prompt

kubectl port-forward --address 0.0.0.0 service/quickstart-es-http     9200:9200  -n middleware
