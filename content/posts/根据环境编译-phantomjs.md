---
title: 根据国产化环境编译 phantomjs
date: "2025-05-23"
tags: [ARM, 国产化, 麒麟, 运维]
description: "1.下载源码，考虑编码问题。最好直接在服务器上下载 2.如果本地下载，上传后，使用git重置 3.安装依赖 3.编译openssl make && make install 4.编译phantomjs"
published: true
---

# 根据国产化环境编译 phantomjs

## 背景（Situation）

麒麟 / 统信等国产化环境里没有官方的 phantomjs 包，但旧业务对 phantomjs 还有依赖。

## 目标（Task）

在国产化环境上从源码编译 phantomjs 并跑通基本用例。

## 行动（Action）

1.下载源码，考虑编码问题。最好直接在服务器上下载
git clone https://github.com/ariya/phantomjs.git
git check 2.1.1
git submodule init
git submodule update

2.如果本地下载，上传后，使用git重置

3.安装依赖
安装g++

3.编译openssl
./config --prefix=/usr/local/openssl-1.0.2
./config -t
make && make install

4.编译phantomjs
python build.py --qt-config="-L/usr/local/openssl-1.0.2/lib" --qt-config="-I/usr/local/openssl-1.0.2/include" --qt-config="-no-pch"

## 收获（Result）

编译产物入了内部私仓，后续上新机器只需要装包不需要再重新编译。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
