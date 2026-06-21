---
title: Kafka 安全配置：SASL、SSL 与 ACL
date: "2026-02-03"
tags: [中间件]
description: "KafkaClient { com.sun.security.auth.module.Krb5LoginModule required KafkaClient { org.apache.kafka.common.secu..."
published: true
---

# Kafka 安全配置：SASL、SSL 与 ACL

> **背景：** 实时链路里同时存在 Kafka、Flink、ZooKeeper、Dubbo 等多种中间件，出问题时往往牵一发动全身，下面是当时的完整记录与思考。

_[图片：512d0c9d0d5d0e49cbdf3fec3073eeda.png]_
_[图片：7cab352c5121468efa2b2d4b53b116e8.png]_

a1.sinks.sink1.type = org.apache.flume.sink.kafka.KafkaSink
a1.sinks.sink1.kafka.bootstrap.servers = kafka-1:9093,kafka-2:9093,kafka-3:9093
a1.sinks.sink1.kafka.topic = mytopic
a1.sinks.sink1.kafka.producer.security.protocol = SSL
# optional, the global truststore can be used alternatively
a1.sinks.sink1.kafka.producer.ssl.truststore.location = /path/to/truststore.jks
a1.sinks.sink1.kafka.producer.ssl.truststore.password = ***REDACTED*** to access the truststore>

a1.sinks.sink1.type = org.apache.flume.sink.kafka.KafkaSink
a1.sinks.sink1.kafka.bootstrap.servers = kafka-1:9093,kafka-2:9093,kafka-3:9093
a1.sinks.sink1.kafka.topic = mytopic
a1.sinks.sink1.kafka.producer.security.protocol = SASL_PLAINTEXT
a1.sinks.sink1.kafka.producer.sasl.mechanism = GSSAPI
a1.sinks.sink1.kafka.producer.sasl.kerberos.service.name = kafka

a1.sinks.sink1.type = org.apache.flume.sink.kafka.KafkaSink
a1.sinks.sink1.kafka.bootstrap.servers = kafka-1:9093,kafka-2:9093,kafka-3:9093
a1.sinks.sink1.kafka.topic = mytopic
a1.sinks.sink1.kafka.producer.security.protocol = SASL_SSL
a1.sinks.sink1.kafka.producer.sasl.mechanism = GSSAPI
a1.sinks.sink1.kafka.producer.sasl.kerberos.service.name = kafka
# optional, the global truststore can be used alternatively
a1.sinks.sink1.kafka.producer.ssl.truststore.location = /path/to/truststore.jks
a1.sinks.sink1.kafka.producer.ssl.truststore.password = ***REDACTED*** to access the truststore>

KafkaClient {
  com.sun.security.auth.module.Krb5LoginModule required
  useKeyTab=true
  storeKey=true
  keyTab="/path/to/keytabs/flume.keytab"
  principal="flume/flumehost1.example.com@YOURKERBEROSREALM";
};

KafkaClient {
    org.apache.kafka.common.security.plain.PlainLoginModule required
    username="your_username"
    password=***REDACTED***
};

# SASL/SSL 配置
a1.sinks.k1.kafka.producer.security.protocol = SASL_SSL
a1.sinks.k1.kafka.producer.sasl.mechanism = PLAIN
a1.sinks.k1.kafka.producer.ssl.truststore.location = /path/to/truststore.jks
a1.sinks.k1.kafka.producer.ssl.truststore.password = ***REDACTED***
a1.sinks.k1.kafka.producer.sasl.jaas.config = org.apache.kafka.common.security.plain.PlainLoginModule required username="your_username" password=***REDACTED***

# 配置 SASL
agent.sinks.kafkaSink.kafka.producer.sasl.mechanism = PLAIN
agent.sinks.kafkaSink.kafka.producer.security.protocol = SASL_PLAINTEXT
agent.sinks.kafkaSink.kafka.producer.sasl.jaas.config = org.apache.kafka.common.security.plain.PlainLoginModule required username="your_username" password=***REDACTED***
