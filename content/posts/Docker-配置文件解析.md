---
title: Dockerfile 高频指令对照表：FROM / RUN / COPY / ENV / EXPOSE / ENTRYPOINT
date: "2025-06-10"
tags: [Docker, 容器, 运维]
description: Docker 实战中沉淀下来的命令与配置。
published: true
---

# Dockerfile 高频指令对照表：FROM / RUN / COPY / ENV / EXPOSE / ENTRYPOINT

## 背景（Situation）

新人写 Dockerfile 时常常分不清 RUN、CMD、ENTRYPOINT 这几个指令的区别，导致镜像构建出 bug。

## 目标（Task）

把 Dockerfile 中最高频的指令含义整理成简明对照表。

## 行动（Action）

FROM 选取基础镜像
RUN 执行命令比如 安装必要的依赖
COPY 复制文件，包括从本地目录复制到镜像中和从镜像中复制到镜像中
ENV 设置环境变量
EXPOSE 暴露服务端口
ENTRYPOINT 定义启动命令

## 收获（Result）

作为入职培训材料后，团队新成员第一周就能独立写出可用的 Dockerfile。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
