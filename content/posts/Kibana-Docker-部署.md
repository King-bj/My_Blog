---
title: Kibana 通过 Docker 与 ES 对齐部署
date: "2026-01-25"
tags: [Docker, 可观测]
description: "例如：首先需要把Kibana从DockerHub上拉取下来：统一版本7.6.2 docker pull kibana:7.6.2 docker run --name kibana -e ELASTICSEARCH_HOS..."
published: true
---

# Kibana 通过 Docker 与 ES 对齐部署

## 背景（Situation）

ELK 体系里 Kibana 的可视化分析非常依赖与后端 ES 版本对齐，手动装容易出错。

## 目标（Task）

把 Kibana 用 Docker 部署起来，跟现有 ES 集群版本严格对齐。

## 行动（Action）

### 1.拉取Kibana
例如：首先需要把Kibana从DockerHub上拉取下来：统一版本7.6.2
#拉取Kibana
`docker pull kibana:7.6.2`

### 2.启动kibana容器：
-e ELASTICSEARCH_HOSTS 设置elasticsearch地址
#运行kibana 注意IP一定不要写错
`docker run --name kibana -e ELASTICSEARCH_HOSTS=http://自己的elasticsearchIP地址:9200 -p 5601:5601 -d kibana:7.6.2`

### 3.进入kibana容器
接下来使用docker命令进入到kibana容器里面：
#进入容器
`docker exec -it 容器ID /bin/sh`
进入容器中找到/usr/share/kibana/config/kibana.yml
#使用vi 修改文件内容
`vi /usr/share/kibana/config/kibana.yml `
### 4.覆盖配置文件
将如下内容写到kibana.yml中，然后保存退出：:wq
```shell
server.name: kibana
server.host: "0"
#elasticsearch.hosts: [ "http://elasticsearch:9200" ]
elasticsearch.hosts: [ "http://自己的elasticsearch的IP:9200" ]
xpack.monitoring.ui.container.elasticsearch.enabled: true
#设置kibana中文显示
i18n.locale: zh-CN
```
### 5.最后访问页面
 http://自己的IP地址:5601

## 收获（Result）

新增 Kibana 实例只要 2 条命令，团队成员都能自助跑起来。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
