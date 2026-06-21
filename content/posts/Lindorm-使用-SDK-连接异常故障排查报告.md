---
title: Lindorm SDK 连接异常故障排查报告
date: "2026-06-21"
tags: [故障排查, 可观测]
description: "Lindorm SDK 连接异常排查：Arthas watch 拦截 OkHttp 层定位请求路径差异，根因为 SDK 默认 gRPC 端口与 HTTP 端口不一致，附完整排查日志与修复方案。"
published: true
---

> **背景：** 生产环境涉及上百个微服务，没有完善的可观测体系问题定位就只能靠肉眼看日志，效率极低，下面是当时的完整记录与思考。

## 现象

Lindom通过api能正常访问，通过prometheus配置数据源，test会报400错误，但不影响正常查询到数据，通过SDK访问，理论上应该一致，但实际请求查询接口报错，错误码0，msg null，难以直接定位。

## 排查过程

### 1. 手动调用 HTTP 请求查询 API

通过手动调用http请求查询api，能正常返回结果。

### 2. 调整 SDK 日志级别

通过调整sdk日志打印级别为debug，打印的错误信息只有0错误码，msg和null信息，无其他有意义逻辑，从源代码解析SDK请求，应该也是封装了一层http请求，考虑进行抓包，获取实际请求的参数和地址。

### 3. 通过 Arthas 排查

#### 3.1 监控 ErrorResult.fromJSON 的输入输出（最关键）

  直接查看服务端返回的原始 JSON 是什么：

  watch com.aliyun.lindorm.tsdb.client.model.ErrorResult fromJSON '{params, returnObj, throwExp}' -x 3

  这会打印出：入参（服务端返回的原始 JSON 字符串）和解析后的 ErrorResult 对象。

  ---
  
2. 查看应用层面的请求参数
  LindormTSDBClientImpl.query 的三个参数：
```shell
  watch com.aliyun.lindorm.tsdb.client.impl.LindormTSDBClientImpl query 'params' -x 2

  输出示例：
  method=com.aliyun.lindorm.tsdb.client.impl.LindormTSDBClientImpl.query location=AtExceptionExit 
  ts=2026-06-15 12:04:26.152; [cost=6.280392ms] result=@Object[][
    @String[default2],
    @String[SELECT COUNT(*) as cnt FROM udp_packet WHERE plan_id = 'it_mock_batch_1781238373281_task1_0' AND mid = 'task1'],
    @Integer[1000],
  ]
```
  ---

3. 查看http层面的请求参数

  拦截 OkHttp 层，拿到完整 URL、Headers、Method
```shell
  watch com.aliyun.lindorm.tsdb.client.shaded.com.squareup.okhttp3.OkHttpClient newCall '{params[0].method(), params[0].url().toString(), params[0].headers()}' -x 3

  输出示例：
  method=com.aliyun.lindorm.tsdb.client.shaded.com.squareup.okhttp3.OkHttpClient.newCall location=AtExit 
  ts=2026-06-15 12:11:12.314; [cost=0.037506ms] result=@ArrayList[
    @String[POST],
    @String[http://ld-2ze35s2dew4cq4qmt-proxy-tsdb-pub.lindorm.rds.aliyuncs.com:8242/api/v2/sql?chunked=true&db=default2&chunk_size=1000],
    @Headers[
        namesAndValues=@String[][
            @String[User-Agent],
            @String[LindormTSDBClient/1.0.6],
        ],
        Companion=@Companion[
        ],
    ],
  ]
```
  ---

4. 查看实际的请求SQL
```shell
  watch com.aliyun.lindorm.tsdb.client.shaded.com.squareup.okhttp3.RequestBody create '{params}' -x 3

  输出示例：
  method=com.aliyun.lindorm.tsdb.client.shaded.com.squareup.okhttp3.RequestBody.create location=AtExit
  ts=2026-06-15 12:14:48.209; [cost=0.066396ms] result=@ArrayList[
      @Object[][
          @MediaType[
              mediaType=@String[text/plain],
              type=@String[text],
              subtype=@String[plain],
              parameterNamesAndValues=@String[][isEmpty=true;size=0],
              TOKEN=***REDACTED***
              QUOTED=@String["([^"]*)"],
              TYPE_SUBTYPE=@Pattern[([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)/([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)],
              PARAMETER=@Pattern[;s*(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)=(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)|"([^"]*)"))?],
              Companion=@Companion[com.aliyun.lindorm.tsdb.client.shaded.com.squareup.okhttp3.MediaType$Companion@5cdcc325],
          ],
          @String[SELECT COUNT(*) as cnt FROM udp_packet WHERE plan_id = 'it_mock_batch_1781238373281_task1_0' AND mid = 'task1'],
      ],
  ]
```
  排查后，发现是nacos配置的lindorm数据库是 ${}  取值，导致返回异常，接口没有正常返回数据库不存在等错误而是返回0错误嘛，打印请求的url和参数后修正该问题解决。
