---
title: K8s 集群部署 Filebeat 采集日志
date: "2025-07-22"
tags: [Kubernetes, K8s, 云原生, 运维]
description: power-log-server-deployment 删除命名空间 1.配置放到nacos 2.请求走gateway 3.用户走基础服务
published: true
---

# K8s 集群部署 Filebeat 采集日志

> **背景：** 项目上云后，所有服务运行在 K8s 集群中，运维与开发都需要熟悉 K8s 的基本概念和高频操作，下面是当时的完整记录与思考。

kubectl edit configmap filebeat-config -n logging

#生成配置  
kubectl create configmap filebeat-config --from-file=filebeat.yml=filebeat.yml --dry-run=client -o yaml > filebeat-configmap.yaml  
#应用到configmap  
kubectl apply -f filebeat-configmap.yaml

#删除pod  
kubectl delete pods -l k8s-app=filebeat -n logging  
kubectl delete pod power-log-server-deployment-c5cfd795c-pp8k9  
power-log-server-deployment

#删除deployment  
kubectl delete deployment power-log-server-deployment

#启动domset  
kubectl apply -f filebeat-kubernetes.yaml -n logging

#查看domset  
kubectl describe daemonset filebeat -n logging

#查看报错  
kubectl describe pod powerlogsparkparse-9795cd8c16055387-driver -n power

#删除domset  
kubectl delete daemonset filebeat -n logging

#查看服务  
kubectl get pods -n powerprocess

#进入容器  
kubectl exec -it filebeat-lmcc4 -n logging -- /bin/bash  
kubectl exec -it power-log-server-deployment-c5cfd795c-6r86q -n powerlog -- /bin/bash

#容器日志  
kubectl logs filebeat-dz49j -n logging

删除命名空间  
kubectl delete namespace kafka

kubectl delete namespace powerlog  
kubectl delete namespace test  
kubectl delete namespace powerprocess  
kubectl delete namespace power  
第一步：  
#创建命名空间:  
kubectl create namespace logging  
kubectl create namespace powerlog  
kubectl create namespace power  
kubectl create namespace powerprocess

#创建 ConfigMap:  
kubectl create configmap filebeat-config --from-file=filebeat.yml=./filebeat.yml -n logging

#创建ServiceAccount  
kubectl create serviceaccount filebeat -n logging

#ClusterRole和ClusterRoleBinding授权  
kubectl apply -f filebeat-rbac.yaml

#启动  
kubectl apply -f filebeat-kubernetes.yaml -n logging

kubectl apply -f power_log_server_k8s.yml -n powerlog

kubectl apply -f kafka-statefulset.yaml -n kafka  
kubectl apply -f kafka-service.yaml -n kafka

kubectl get pods -n powerlog

kubectl logs power-process-5b48c9c6db-sxr9j

kubectl delete deployment power-log-server  
kubectl delete deployment power-log-schedule  
kubectl delete deployment power-msg

kubectl describe pod kafka-0

kubectl delete statefulset elastic-operator

kubectl logs elastic-operator-0 -n elastic-system

kubectl exec -it power-log-web-556d77644d-nt8hj -- /bin/bash

#重启服务  
kubectl rollout restart deployment  power-log-server -n mysql

kubectl port-forward --address 0.0.0.0 kafka-0 9092:9092

kubectl port-forward --address 0.0.0.0 service/redis-master-service 6379:6379  
kubectl port-forward --address 0.0.0.0 service/powerlogsparkparse-5c6bf08c198bcedb-driver-svc 4040:4040  
kubectl port-forward --address 0.0.0.0 service/power-log-web 38033:38033

kubectl port-forward --address 0.0.0.0 service/power-job 38300:38300 -n agent  
kubectl port-forward --address 0.0.0.0 service/kafka 30093:30093  
kubectl port-forward --address 0.0.0.0 service/kafka-rpc 30092:30092

kubectl port-forward --address 0.0.0.0 service/spark-manager 8080:8080 -n middleware

kubectl port-forward --address 0.0.0.0 service/kafka 30098:30098 -n agent  
kubectl port-forward --address 0.0.0.0 service/kafka-rpc 30097:30097 -n agent

kubectl port-forward --address 0.0.0.0 service/quickstart-es-http 9200:9200 -n middleware  
kubectl port-forward --address 0.0.0.0 service/activemq-service 8161:8161 -n middleware  
kubectl port-forward --address 0.0.0.0 service/activemq-service 61616:61616 -n middleware

kubectl port-forward --address 0.0.0.0 service/nacos-headless 8848:8848 -n middleware

kubectl port-forward --address 0.0.0.0 service/power-front-xw 8080:80 -n agent

kubectl port-forward --address 0.0.0.0 service/power-front 9999:80 -n agent

kubectl port-forward --address 0.0.0.0 service/power-apm 12800:12800 -n mysql

kubectl port-forward --address 0.0.0.0 service/power-portal 38020:38020 -n agent

kubectl port-forward mongo-75f59d57f4-4nd6q 28015:27017

kubectl get deployments --no-headers=true -n agent | awk '/^power/{print $1}' | xargs -I {} kubectl rollout restart deployment {} -n agent

授权  
kubectl create secret docker-registry registry-key-power  
--docker-server=hub.bigitom.com  
--docker-username=admin  
--docker-password=***REDACTED*** -n kafka

kubectl create secret docker-registry registry-key-power --docker-server=hub.bigitom.com --docker-username=admin --docker-password=***REDACTED*** -n redis

docker login -u admin -p Admin@123 hub.bigitom.com

kubectl delete elasticsearch quickstart

kubectl create secret generic quickstart-es-elastic-user --from-literal=elastic=Elastic@123.com

kubectl port-forward --address 0.0.0.0 service/nacos 38033:38033 -n mysql

kubectl port-forward --address 0.0.0.0 service/power-log-web 38033:38033 -n mysql

kubectl port-forward --address 0.0.0.0 service/power-log-server 38030:38030

kubectl port-forward --address 0.0.0.0 service/power-front 80:9999 -n apm

kubectl port-forward --address 0.0.0.0 service/power-log-server 38030:38030 -n mysql

kubectl port-forward --address 0.0.0.0 service/power-job 38300:38300 -n mysql

kubectl port-forward --address 0.0.0.0 service/quickstart-es-http 9200:9200 -n middleware

kubectl port-forward --address 0.0.0.0 service/redis-master-service 6379:6379 -n middleware

kubectl port-forward --address 0.0.0.0 service/my-bench-prometheus-benchmark-vmsingle 8428:8428 -n vm-benchmark

kubectl port-forward --address 0.0.0.0 service/redis-cluster-headless  6379:6379 -n middleware

1.配置放到nacos

2.请求走gateway

3.用户走基础服务
