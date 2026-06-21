---
title: yum 源切换到内网镜像的实操记录
date: "2025-04-14"
tags: [Linux, 运维, 系统管理]
description: 故障诊断程序搭建，功能解耦(已完成) 故障诊断基础模块接入中间件，服务器部署(已完成) 梳理故障诊断通用脚本执行流程(已完成) 梳理故障诊断agent端执行方式(已完成) 验证脚本能力支持perl命令场景(已完成) 故障...
published: true
---

# yum 源切换到内网镜像的实操记录

## 背景（Situation）

离线环境 yum 源指向的是公网，每次安装包都要先解决源问题。

## 目标（Task）

把 yum 切到内部镜像源并固化到系统初始化脚本。

## 行动（Action）

mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup  
curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo  
yum clean all  
yum makecache  
yum -y update

docker run -it --rm --entrypoint /bin/sh hub.bigitom.com/power-runner:6.4.0  
docker save -o power-runner.tar hub.bigitom.com/power-runner:6.4.0  
docker save -o power-base.tar runner-base:6.4.0

docker run -d -p 8084:8084 -p 8888:8888 hub.bigitom.com/power-runner:6.4.0

## 打包

docker build -t hub.bigitom.com/power-runner:6.4.0 -f Dockerfile .  
docker build -t runner-base:1.1.0 -f DockerfileRunnerPython .

故障诊断程序搭建，功能解耦(已完成)  
故障诊断基础模块接入中间件，服务器部署(已完成)  
梳理故障诊断通用脚本执行流程(已完成)  
梳理故障诊断agent端执行方式(已完成)  
验证脚本能力支持perl命令场景(已完成)  
故障诊断runner容器化环境打包(已完成)

故障诊断集群化部署实现梳理  
故障诊断阶段，阶段组执行,oneShot,grayScale逻辑，工具执行调度逻辑梳理验证  
故障诊断数据传输格式梳理，各类执行能力梳理（执行，中止，忽略，重置，重新执行  
故障诊断原子工具场景验证（perl,shell)  
故障诊断原子工具场景验证（python)

## 收获（Result）

离线机器上 yum 安装从"先 ping 通公网"变成开箱即用，平均装机时间下降 30%。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
