---
title: Docker 日常运维高频命令清单
date: "2025-06-02"
tags: [Docker, 容器, 运维]
description: sonar启动命令 正确的公司环境执行命令 扫描快照中心：
published: true
---

# Docker 日常运维高频命令清单

> **背景：** 我们的项目大量使用 Docker 做开发 / 测试 / 部署一体化，日常需要快速排查容器、镜像、网络问题，下面是当时的完整记录与思考。

sonar启动命令

docker run -d --name sonarqube7.8 
-e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true 
-e SONARQUBE_JDBC_USERNAME=dbadmin 
-e 'SONARQUBE_JDBC_PASSWORD=***REDACTED*** 
-e 'SONARQUBE_JDBC_URL=jdbc:mysql://192.168.140.178:2881/sonar?useUnicode=true&characterEncoding=utf8' 
-p 9000:9000 sonarqube:7.8-community

***REDACTED-TOKEN***

mvn clean package org.jacoco:jacoco-maven-plugin:prepare-agent test -Dmaven.test.failure-ignore=false  org.sonarsource.scanner.maven:sonar-maven-plugin:3.11.0.3922:sonar -Dsonar.projectKey=power-auto -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED*** -P develop

docker run -d --name sonarqube7.8 -p 9000:9000 sonarqube:7.8-community

mvn clean package org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.1.2184:sonar -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED*** -Dsonar.coverage.jacoco.xmlReportPaths=power_test/target/site/jacoco-aggregate/jacoco.xml -P develop

mvn clean org.jacoco:jacoco-maven-plugin:prepare-agent install -Dmaven.test.failure.ignore=true org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.1.2184:sonar -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED***  

mvn clean package org.jacoco:jacoco-maven-plugin:prepare-agent test -Dmaven.test.failure-ignore=false  org.sonarsource.scanner.maven:sonar-maven-plugin:3.11.0.3922:sonar -Dsonar.projectKey=power-auto -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED*** -P develop

mvn -Dsonar.coverage.jacoco.xmlReportPaths=power_test/target/site/jacoco-aggregate/jacoco.xml clean verify sonar:sonar -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED***

正确的公司环境执行命令

mvn clean org.jacoco:jacoco-maven-plugin:prepare-agent install -Xmx1024m -Dmaven.test.failure.ignore=true org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.1.2184:sonar -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED*** -P develop

扫描快照中心：
D:\Tools\IT\apache-maven-3.6.3\bin\mvn clean org.jacoco:jacoco-maven-plugin:prepare-agent install   -Dmaven.test.failure.ignore=true org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.1.2184:sonar -Dsonar.projectKey=customer-snapshot-server -Dsonar.host.url=http://192.168.140.30:9000 -Dsonar.login=***REDACTED***
