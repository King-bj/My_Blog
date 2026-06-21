---
title: FTPClient 文件传输损坏：ASCII 与 BINARY 模式踩坑
date: "2026-05-05"
tags: [故障排查, Java]
description: "FTPClient 传输二进制文件损坏：RFC 959 默认 ASCII 模式会对换行符做转换，setFileType(BINARY_FILE_TYPE) 一行修复，附 ASCII 与 BINARY 模式原理对比。"
published: true
---

# FTPClient 文件传输损坏：ASCII 与 BINARY 模式踩坑

## 背景（Situation）

老系统通过 FTPClient 跟一个外部业务方互传文件，最近反馈下载的文件偶发损坏。

## 目标（Task）

在不能改对方接口的前提下定位本地 FTPClient 用法的问题。

## 行动（Action）

用Apache的FTPClient下载文件时发现一个问题，就是下载txt文件没问题，但下载zip/tar.gz等文件时文件会被破坏，查了一下原因，原来是这样：
因为RFC959中规定了缺省的传输模式应该是ASCII的，org.apache.commons.net.ftp.FTPClient实现也遵守此标准。所以org.apache.commons.net.ftp.FTPClient在缺省情况下是按ASCII形式进行传输的，如果你是传输的BINARY二进制文件（如zip），那么上传完后的文件就会被破坏，但是传输ASCII文件（如txt）是没有问题的。

所以如果你是传输的BINARY二进制文件的话，就需要在建立连接、登陆后，接下来设置文件类型，代码示例如下：
ftpclient.connect(host);
ftpclient.login(user, password);
ftpclient.setFileType(FTPClient.BINARY_FILE_TYPE);
ftpClient.setBinaryType();

## 收获（Result）

把传输模式从 ASCII 改为 BINARY 后问题消失，并补上了文件 MD5 校验作为兜底。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
