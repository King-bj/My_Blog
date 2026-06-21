---
title: Maven 一键构建 Docker 镜像的实践
date: "2026-01-30"
tags: [Docker, DevOps]
description: "Maven 插件一键构建 Docker 镜像：docker-maven-plugin 配置、Remote API 开放、镜像构建推送到私有仓库，实现 CI/CD 流水线中的镜像自动化。"
published: true
---

# Maven 一键构建 Docker 镜像的实践

> **背景：** 我们的项目大量使用 Docker 做开发 / 测试 / 部署一体化，日常需要快速排查容器、镜像、网络问题，下面是当时的完整记录与思考。

目标: 通过maven插件实现springboot工程构建为docker镜像,并推送到镜像仓库

## 操作步骤

### Step1. 模块pom添加依赖

```xml
        <dependency>
            <groupId>com.myd.common</groupId>
            <artifactId>common-docker</artifactId>
            <type>tar.gz</type>
            <optional>true</optional>
        </dependency>
```

### Step2. 模块pom配置profile

```xml
 <profiles>
        <profile>
            <id>docker</id>
            <properties>
                <registry.name>registry.example.com</registry.name>
                <tag.name>6.2.0</tag.name>
                <docker.platforms>linux/amd64,linux/arm64</docker.platforms>
            </properties>
            <build>
                <plugins>
                    <plugin>
                        <groupId>io.fabric8</groupId>
                        <artifactId>docker-maven-plugin</artifactId>
                        <version>0.43.4</version>
                        <configuration>
                            <images>
                                <image>
                                    <name>${registry.name}/power-process:${tag.name}</name>
                                    <build>
                                        <dockerFile>${project.basedir}/Dockerfile</dockerFile>
                                        <assembly>
                                            <name>assets</name>
                                            <descriptor>${project.basedir}/assembly-docker.xml</descriptor>
                                        </assembly>
                                        <buildx>
                                            <configFile>~/buildkitd.toml</configFile>
                                            <platforms>
                                                <platform>${docker.platforms}</platform>
                                            </platforms>
                                            <attestations>
                                                <provenance>false</provenance>
                                            </attestations>
                                        </buildx>
                                    </build>
                                </image>
                            </images>
                        </configuration>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
```

### Step3. 模块添加`Dockerfile`

> Dockerfile文件与pom.xml文件在同一目录下

```
FROM openjdk:8

COPY assets/ /

RUN chmod a+x /project/*.sh

EXPOSE 38000

WORKDIR /project

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["start"]
```

### Step4. 模块添加`assemble-docker.xml`

> assemble-docker.xml文件与pom.xml文件在同一目录下

> 可根据实际需要打包到进行的文件调整文件内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<assembly xmlns="http://maven.apache.org/ASSEMBLY/2.1.1"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/ASSEMBLY/2.1.1 http://maven.apache.org/xsd/assembly-2.1.1.xsd">
    <id>power</id>
    <includeBaseDirectory>false</includeBaseDirectory>

    <dependencySets>
        <dependencySet>
            <useProjectArtifact>false</useProjectArtifact>
            <outputDirectory>project</outputDirectory>
            <includes>
                <include>com.myd.common:common-docker:tar.gz</include>
            </includes>
            <unpack>true</unpack>
            <scope>runtime</scope>
            <fileMode>0755</fileMode>
        </dependencySet>
    </dependencySets>

    <fileSets>
        <fileSet>
            <directory>target/lib</directory>
            <includes>
                <include>*.jar</include>
            </includes>
            <outputDirectory>project/lib</outputDirectory>
            <fileMode>0644</fileMode>
        </fileSet>
        <fileSet>
            <directory>src/main/resources</directory>
            <outputDirectory>project/config</outputDirectory>
            <lineEnding>unix</lineEnding>
            <fileMode>0644</fileMode>
            <includes>
                <include>logback-spring.xml</include>
                <include>bootstrap.yml</include>
            </includes>
        </fileSet>
    </fileSets>

    <files>
        <file>
            <source>target/${artifactId}-${product.version}.jar</source>
            <outputDirectory>project</outputDirectory>
        </file>
    </files>
</assembly>
```
### Step5. 用户根目录增加文件 如C:UsersAdminbuildkitd.toml
```
debug = true
insecure-entitlements = [ "network.host", "security.insecure" ]

[dns]
  nameservers=["<dns-server-ip>"]

[registry."registry.example.com"]
  http = true
  
```
### Step6. 执行构建命令

```shell
# 构建镜像
mvn -Pdocker clean package docker:build 

# 构建&推送镜像
mvn -Pdocker docker:push
```

## 常见问题

### 如何调用远程服务器docker环境构建镜像

1. 配置远程服务器docker开启RemoteApi访问端口,详见参考文档,建议使用方法三
2. 配置本地环境变量`DOCKER_HOST=tcp://IP:2375`

### 推送镜像报错:no basic auth credentials

配置~/.m2/settings.xml增加以下内容
```xml
        <server>
            <id>registry.example.com</id>
            <username>admin</username>
            <password>your-registry-password</password>
        </server>
```

## 参考文档
[io.fabric8/docker-maven-plugin](https://dmp.fabric8.io/#introduction)
[docker开启Remote Api访问端口](https://www.cnblogs.com/hongdada/p/11512901.html)
