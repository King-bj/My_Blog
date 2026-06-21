---
title: Docker 镜像相关常用命令整理
date: "2025-06-13"
tags: [Docker, 容器, 运维]
description: "iptables -I INPUT 5 -p tcp --dport 9094 -j ACCEPT myd@1231220 default"
published: true
---

# Docker 镜像相关常用命令整理

> **背景：** 我们的项目大量使用 Docker 做开发 / 测试 / 部署一体化，日常需要快速排查容器、镜像、网络问题，下面是当时的完整记录与思考。

#打包镜像
docker build -f powerfactory/Dockerfile -t power-log-web .
docker build -f Dockerfile -t kafka .
#导出已有镜像
docker save -o 镜像压缩包名.tar 已有镜像名 # -o是output，后面可以加导出的路径和名称，myapp.tar是导出的名称，myapp是已有的要导出的镜像名
#加载镜像
docker load -i myapp.tar # 可以得到和之前myapp一样的镜像
#查看导入的镜像
docker images

docker run -e LOCAL_IP=192.168.100.244 -e NACOS_IP=192.168.140.72 -e NAMESPACE=test -it --rm kafka

docker build -f powermodel-server/Dockerfile -t powermodel-server .

docker buildx build --platform linux/amd64,linux/arm/v6,linux/arm/v7,linux/arm64/v8,linux/386,linux/ppc64le,linux/s390x -t doubledong/hello . --push

docker tag phantomjs:latest hub.bigitom.com/phantomjs:6.2.0
docker push hub.bigitom.com/phantomjs:6.2.0

docker buildx build -t phantomjs --platform linux/amd64,linux/arm64 -f power_log_server/DockerfilePhantomjs .

docker buildx create --driver docker-container --name spark3.0.1 --config C:\Users\59527\buildkitd.toml

docker buildx build --progress=plain --builder spark3.0.1 --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-log-web:6.2.0 --push -f Dockerfile .

docker pull elasticsearch:8.3.3@sha256:017d3d7fe92217b01c68191dab31b6479b05fdb4be4315c3f293fae19748fb48

docker tag elasticsearch:8.3.3@sha256:017d3d7fe92217b01c68191dab31b6479b05fdb4be4315c3f293fae19748fb48 hub.bigitom.com/elasticsearch:8.3.3

docker push hub.bigitom.com/elasticsearch:8.3.3

docker pull hub.bigitom.com/power-log-schedule:6.2.0 --platform linux/arm64

docker pull elastic/eck-operator:2.10.0@sha256:3ec43fdb29459e0aa2c00a63b0266ca6d9853acab31f2d2bc4c2bf0bc513b162

docker tag elastic/eck-operator:2.10.0@sha256:3ec43fdb29459e0aa2c00a63b0266ca6d9853acab31f2d2bc4c2bf0bc513b162 hub.bigitom.com/eck-operator:2.10.0

docker push hub.bigitom.com/eck-operator:2.10.0

docker buildx create --driver docker-container --name spark3.0.1 --config ./buildkitd.toml

docker buildx build --progress=plain --builder spark3.0.1 --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-log-web:6.2.0 --push -f Dockerfile .

docker buildx build --progress=plain --builder multi-arch --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/pythonbase:6.2.0 --push -f DockerfilePython .

iptables -I INPUT 5 -p tcp --dport 9094 -j ACCEPT

mvn -Pdocker docker:build docker:push

git update-index --assume-unchanged logs/*

----------------------

docker load -i mysql-8.0-arm64.tar

docker tag hub.bigitom.com/mysql:8.0 hub.bigitom.com/mysql:8.0-arm64

docker push hub.bigitom.com/mysql:8.0-arm64

docker manifest create --insecure hub.bigitom.com/mysql:8.0 hub.bigitom.com/mysql:8.0-arm64 hub.bigitom.com/mysql:8.0-amd64

docker manifest push --insecure hub.bigitom.com/mysql:8.0

----------------------------------

#spark镜像

docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/spark:3.0.1 --push -f kubernetes/dockerfiles/spark/Dockerfile . 

docker buildx create --driver docker-container --name sparkdocker --config C:Users59527buildkitd.toml

docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/skywalking:6.2.0 --push -f docker/oap/Dockerfile .

myd@1231220

create user dbadmin with password '***REDACTED***';
alter user dbadmin superuser;

docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-front-apm:6.2.0 --push -f Dockerfile .

docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-apm-agent:6.2.0 --push -f apm-agent/Dockerfile .

docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --provenance=false  --tag hub.bigitom.com/power-apm-agent:6.2.0 --push -f apm-agent/Dockerfile .

default
docker buildx build --progress=plain --builder sparkdocker --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/spark-operator:6.2.0 --push -f Dockerfile .

docker buildx build --progress=plain --builder multi-arch --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-front:6.2.0-xw --push -f Dockerfile .  --provenance=false

docker buildx build --progress=plain --builder power  --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-log-flume:6.2.0-xw --push -f Dockerfile .  --provenance=false

docker buildx build   --builder power  --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/opensearch:1.3.4 --push -f Dockerfile2 .  --provenance=false

docker buildx build   --builder power  --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/power-log-web:6.2.0 --push -f DockerfileLogWeb .  --provenance=false

docker tag  opensearchproject/opensearch:1.3.4 hub.bigitom.com/opensearch:1.3.4

docker push hub.bigitom.com/opensearch:1.3.4

docker buildx build   --builder power  --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/log-gen:1.0.0 --push -f Dockerfile .  --provenance=false

docker buildx build   --builder power  --platform linux/amd64,linux/arm64 --tag hub.bigitom.com/log-gen:1.0.0 --push -f Dockerfile .  --provenance=false
