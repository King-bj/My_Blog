---
title: Spring Gateway 请求被截断的故障排查
date: "2026-05-05"
tags: [Java, 故障排查]
description: 现象： 相同的请求，有时候正常返回，有时候返回数据被阶段。 排查：排查nginx返回，nginx返回数据包日志显示无异常。直接请求服务，返回数据无异常，初步定位为gateway问题 安装arathas 定位gateway...
published: false
---

# Spring Gateway 请求被截断的故障排查

> **背景：** Spring / Java 是项目的主技术栈，多数线上事故最终都要落到 JVM 与 Spring 容器层面，下面是当时的完整记录与思考。

现象： 相同的请求，有时候正常返回，有时候返回数据被阶段。

排查：排查nginx返回，nginx返回数据包日志显示无异常。直接请求服务，返回数据无异常，初步定位为gateway问题

安装arathas

定位gateway,发现jps获取不到gateway服务

jps（以及 arthas-boot 默认的进程发现机制）会扫描 /tmp/hsperfdata_<用户名> 目录下的文件来列出 Java 进程。
从你的启动命令中可以看到：

text
-Djava.io.tmpdir=?
实际上你没有显式指定 -Djava.io.tmpdir，但某些环境（如通过 systemd 启动或容器）可能会改变 java.io.tmpdir。
即使没有显式指定，你也可以检查一下：

bash
# 查看该进程实际使用的临时目录
cat /proc/2346018/environ | tr '0' 'n' | grep TMPDIR
# 或者查看根文件系统中的临时目录
ls -la /proc/2346018/root/tmp
如果临时目录不是 /tmp，jps 就会找不到该进程

直接通过pid进行attach和启动mcp
 ./as.sh 2346018 --mcp-endpoint '/mcp' --target-ip 0.0.0.0

访问
http://<arthas-server>:8563/mcp

配置mcp服务

{
  "mcpServers": {
    "arthas-mcp": {
      "type": "streamableHttp",
      "url": "http://localhost:8563/mcp",
      "headers": {
        "Authorization": "Bearer your-secure-password"
      }
    }
  }
}

接口：

http://<gateway-server>/api/apm/traces

入参：
{"traceId":"","orderField":"start","direction":"DESC","pageNum":1,"pageSize":10,"serviceId":"","start":"2026-05-09 132700","end":"2026-05-09 135700","step":"CUSTOM","requestTypeList":[]}
请求头：
authorization
Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2tleSI6ImNhNzk2NjE0LTNhOGMtNGNkOS1iYzlmLWE0OTFmZTBlYzY0NCIsInVzZXJfaWQiOiIxIiwidXNlckFjY291bnQiOiJhZG1pbiJ9.DRYCop-fR9b7PdTQTjgdVX1RorSJ-SvVMHgD4dzai1eg337UqJe3zxSYMiIfQeB8bzZBDftnd6Ue3mAAeeS8Hg

多次请求，偶尔返回被截断。

 通过trace 获取
```
trace com.soft.gateway.filter.XssFilter filter 'params[0].getRequest().getURI().getPath().contains("extend/segment/queryBasicTraces")' -n 5
Press Q or Ctrl+C to abort.
Affect(class count: 1 , method count: 1) cost in 404 ms, listenerId: 16
`---ts=2026-05-09 16:19:31.721;thread_name=reactor-http-nio-6;id=295;is_daemon=true;priority=5;TCCL=org.springframework.boot.loader.LaunchedURLClassLoader@46f7f36a
    `---[0.178591ms] com.soft.gateway.filter.XssFilter:filter()
        +---[3.22% 0.00575ms ] org.springframework.web.server.ServerWebExchange:getRequest() #46
        +---[2.33% 0.004153ms ] org.springframework.http.server.reactive.ServerHttpRequest:getMethod() #48
        +---[2.23% min=0.0012ms,max=0.002785ms,total=0.003985ms,count=2] org.springframework.http.HttpMethod:matches() #49
        +---[4.28% 0.007647ms ] com.soft.gateway.filter.XssFilter:isJsonRequest() #53
        +---[1.32% 0.002351ms ] org.springframework.http.server.reactive.ServerHttpRequest:getURI() #57
        +---[12.45% 0.022237ms ] com.soft.gateway.config.properties.XssProperties:getExcludeUrls() #58
        +---[19.78% 0.035318ms ] com.soft.common.core.utils.StringUtils:matches() #58
        +---[3.27% 0.005841ms ] com.soft.gateway.filter.XssFilter:requestDecorator() #61
        +---[1.57% 0.0028ms ] org.springframework.web.server.ServerWebExchange:mutate() #62
        +---[2.37% 0.004228ms ] org.springframework.web.server.ServerWebExchange$Builder:request() #62
        +---[1.04% 0.001865ms ] org.springframework.web.server.ServerWebExchange$Builder:build() #62
        `---[2.03% 0.003631ms ] org.springframework.cloud.gateway.filter.GatewayFilterChain:filter() #62

`---ts=2026-05-09 16:19:38.987;thread_name=reactor-http-nio-6;id=295;is_daemon=true;priority=5;TCCL=org.springframework.boot.loader.LaunchedURLClassLoader@46f7f36a
    `---[0.160519ms] com.soft.gateway.filter.XssFilter:filter()
        +---[3.63% 0.005826ms ] org.springframework.web.server.ServerWebExchange:getRequest() #46
        +---[2.28% 0.003657ms ] org.springframework.http.server.reactive.ServerHttpRequest:getMethod() #48
        +---[2.47% min=0.001328ms,max=0.002641ms,total=0.003969ms,count=2] org.springframework.http.HttpMethod:matches() #49
        +---[4.50% 0.007217ms ] com.soft.gateway.filter.XssFilter:isJsonRequest() #53
        +---[1.63% 0.002617ms ] org.springframework.http.server.reactive.ServerHttpRequest:getURI() #57
        +---[12.07% 0.019371ms ] com.soft.gateway.config.properties.XssProperties:getExcludeUrls() #58
        +---[18.99% 0.03048ms ] com.soft.common.core.utils.StringUtils:matches() #58
        +---[3.66% 0.005879ms ] com.soft.gateway.filter.XssFilter:requestDecorator() #61
        +---[2.17% 0.003491ms ] org.springframework.web.server.ServerWebExchange:mutate() #62
        +---[2.22% 0.003565ms ] org.springframework.web.server.ServerWebExchange$Builder:request() #62
        +---[1.51% 0.00242ms ] org.springframework.web.server.ServerWebExchange$Builder:build() #62
        `---[2.02% 0.003236ms ] org.springframework.cloud.gateway.filter.GatewayFilterChain:filter() #62

```
