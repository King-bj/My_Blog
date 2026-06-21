---
title: 麒麟 arm64 V10SP1 上编译 phantomjs 实战
date: "2025-05-26"
tags: [ARM, 国产化, 麒麟, 运维]
description: "SF #### zxdposter 注册登录 zxdposter"
published: true
---

# 麒麟 arm64 V10SP1 上编译 phantomjs 实战

> **背景：** 公司业务需要全面适配国产化（ARM + 麒麟/统信 + 达梦），我负责把现有 x86 上跑通的组件迁到 ARM 平台，下面是当时的完整记录与思考。

[SF](https://segmentfault.com/blogs)

[#### zxdposter](https://segmentfault.com/u/zxdposter/articles)

[注册登录](https://segmentfault.com/user/login)

# [麒麟 arm64 V10SP1 编译 phantomjs](https://segmentfault.com/a/1190000043849415)

_[图片]__[图片]_](https://segmentfault.com/u/zxdposter)

[**zxdposter**](https://segmentfault.com/u/zxdposter)[](https://segmentfault.com/u/zxdposter)

[5 月 31 日 上海](https://segmentfault.com/a/1190000043849415/revision)

阅读 2 分钟

[](#comment-area)

目前国内国产化代替需求越来越多，但是类似于 `phantomjs` 这种较老的软件网上资料比较少，难以移植到 arm64 上，所以这篇文章分享一下 `phantomjs` 的移植编译，帮助有需求的人。

## 下载源码

```smali
git clone https://github.com/vitallium/phantomjs.git
git check 2.1.1
git submodule init
git submodule update
```

## 下载 openssl 1.0.1 版本

`V10SP1` 上面的 `openssl` 版本为 1.1.1 以上，不适用于 `phantomjs 2.1.1`，因此编译和使用时需要 `1.0.1` 版本，`openssl` 编译比较简单。

```awk
wget https://ftp.openssl.org/source/old/1.0.1/openssl-1.0.1u.tar.gz
./config
make install    # 路径一般为 /usr/local/ssl，也可以只 make，只需要使用 libssl.so 和 libcrypto.so 文件
```

## 修改 phantomjs 源码 bug

`phantomjs` 依赖的 `qtwebkit`，在 `arm64` 编译时存在 bug，需要修改源码后编译。

```awk
vim src/qt/qtwebkit/Source/JavaScriptCore/API/JSStringRef.h
```

```plaintext
--- webkitgtk-2.4.11.orig/Source/JavaScriptCore/API/JSStringRef.h    2016-04-10 08:48:36.000000000 +0200
+++ webkitgtk-2.4.11/Source/JavaScriptCore/API/JSStringRef.h    2017-12-20 23:04:55.000000000 +0100
@@ -27,6 +27,7 @@
 #define JSStringRef_h

 #include <JavaScriptCore/JSValueRef.h>
+#include <uchar.h>

 #ifndef __cplusplus
 #include <stdbool.h>
@@ -43,7 +44,7 @@
 @typedef JSChar
 @abstract A Unicode character.
 */
-    typedef unsigned short JSChar;
+    typedef char16_t JSChar;
 #else
     typedef wchar_t JSChar;
 #endif
```

## 编译

`qt-config` 的路径是上面 `openssl` 编译后库的路径。

```mipsasm
python build.py --qt-config="-L/usr/local/ssl/lib" --qt-config="-I/usr/local/ssl/include" --qt-config="-no-pch"
```

## 使用

需要指定 `libssl` 和 `libcrypto` 的位置，都放在 `libssl_path`。

```routeros
export LD_LIBRARY_PATH=/libssl_path:$LD_LIBRARY_PATH
```

之后就可以使用 `phantomjs`。

[phantomjs](https://segmentfault.com/t/phantomjs)[arm64](https://segmentfault.com/t/arm64)[kylin](https://segmentfault.com/t/kylin)

阅读 1.2k

[更新于 6 月 2 日](https://segmentfault.com/a/1190000043849415/revision)

* * *

_[图片]__[图片]_](https://segmentfault.com/u/zxdposter)

[##### zxdposter](https://segmentfault.com/u/zxdposter)

3.8k 声望

3.5k 粉丝

* * *

« 上一篇

[java/kotlin 生成 echarts 图片最优解](https://segmentfault.com/a/1190000043361837)

下一篇 »

[从实习开始，在一家公司持续八年的编程工作](https://segmentfault.com/a/1190000044031216)

[下载源码](#item-1)[下载 openssl 1.0.1 版本](#item-2)[修改 phantomjs 源码 bug](#item-3)[编译](#item-4)[使用](#item-5)

_[图片]_](https://sponsor.segmentfault.com/ck.php?oaparams=2__bannerid=832__zoneid=1__cb=21eb7482d2__oadest=https%3A%2F%2Fsegmentfault.com%2Fe%2F1160000044353489)

### 引用和评论

**推荐阅读**

_[图片]_<br>###### 从实习开始，在一家公司持续八年的编程工作<br>zxdposter<br>赞 9<br>阅读 797<br>评论 17](https://segmentfault.com/a/1190000044031216?utm_source=sf-similar-article)

**5 条评论**

[得票](https://segmentfault.com/a/1190000043849415?sort=votes)[最新](https://segmentfault.com/a/1190000043849415?sort=newest)

_[图片]_

评论支持部分 Markdown 语法：``**粗体** _斜体_ [链接](http://example.com) `代码` - 列表 > 引用``。你还可以使用 `@` 来通知其他用户。

_[图片]_

[**苦艾**](https://segmentfault.com/u/kuai_5f8e71fcb0366)：

嗨，请教一下，在编译的时候是否遇到过 cannot load such file -- rubygems.rb 的错误呢？

6 月 20 日

来自陕西

[**zxdposter**（作者）](https://segmentfault.com/u/zxdposter)：

[@苦艾](https://segmentfault.com/u/kuai_5f8e71fcb0366) 没有遇到过，你是哪一步出现的

6 月 20 日

[**苦艾**](https://segmentfault.com/u/kuai_5f8e71fcb0366)：

[@zxdposter](https://segmentfault.com/u/zxdposter) 执行python build后报的错误

6 月 20 日

[**苦艾**](https://segmentfault.com/u/kuai_5f8e71fcb0366)：

[@zxdposter](https://segmentfault.com/u/zxdposter) 我编译的环境是Linux 4.19.90-23.6.v2101.ky10.aarch64；如果可以的话，您能否给一个您编译phantomjs后百度网盘的下载地址，感谢。

6 月 20 日

©2023 zxdposter

除特别声明外，[作品采用《署名-非商业性使用-禁止演绎 4.0 国际》进行许可](https://creativecommons.org/licenses/by-nc-nd/4.0/)

[SF<br>使用 SegmentFault 发布](https://segmentfault.com/blogs)

[SegmentFault - 凝聚集体智慧，推动技术进步](https://segmentfault.com/)

[服务协议](https://segmentfault.com/tos?utm_source=sf-footer)

[隐私政策](https://segmentfault.com/privacy?utm_source=sf-footer)

[浙ICP备15005796号-2](http://beian.miit.gov.cn)

[浙公网安备33010602002000号](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602002000)

![](https://segmentfault.com/a/chrome-extension://hdofgklnkhhehjblblcdfohmplcebaeg/img/logo2.png)
