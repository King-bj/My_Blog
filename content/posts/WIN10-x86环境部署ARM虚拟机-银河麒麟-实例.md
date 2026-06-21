---
title: 在 Win10 x86 上部署 ARM 银河麒麟虚拟机
date: "2025-05-05"
tags: [ARM, 国产化, 麒麟, 运维]
description: "[会员中心 ](https://mall.csdn.net/vip) 足迹 动态 [创作中心 ](https://mp.csdn.net/ \"创作中心\")"
published: true
---

# 在 Win10 x86 上部署 ARM 银河麒麟虚拟机

> **背景：** 公司业务需要全面适配国产化（ARM + 麒麟/统信 + 达梦），我负责把现有 x86 上跑通的组件迁到 ARM 平台，下面是当时的完整记录与思考。

[_[图片]_](https://www.csdn.net/)

- [博客](https://blog.csdn.net/)
- [下载](https://download.csdn.net/)
- [学习](https://edu.csdn.net/)
- [社区](https://bbs.csdn.net/)
- [GitCode](https://gitcode.net?utm_source=csdn_toolbar)
- [云服务](https://dev-portal.csdn.net/welcome?utm_source=toolbar)
- [猿如意](https://devbit.csdn.net?source=csdn_toolbar)

登录/注册

[会员中心 _[图片]_](https://mall.csdn.net/vip) 

[足迹](https://i.csdn.net/#/user-center/collection-list?type=1)

[动态](https://blink.csdn.net)

[创作中心 _[图片]_](https://mp.csdn.net/ "创作中心") 

[发布](https://mp.csdn.net/edit)

# WIN10 x86环境部署ARM虚拟机（银河麒麟）实例

_[图片]_

[Frank_xx](https://blog.csdn.net/weixin_44255842) _[图片]_于 2021-10-08 17:31:47 发布 _[图片]_14546 <a id="blog_detail_zk_collection"></a>_[图片]_收藏 103 

分类专栏： [银河麒麟](https://blog.csdn.net/weixin_44255842/category_11388297.html) [Linux](https://blog.csdn.net/weixin_44255842/category_11388296.html) 文章标签： [arm](https://so.csdn.net/so/search/s.do?q=arm&t=blog&o=vip&s=&l=&f=&viparticle=) [运维](https://so.csdn.net/so/search/s.do?q=%E8%BF%90%E7%BB%B4&t=blog&o=vip&s=&l=&f=&viparticle=)

版权

_[图片]_华为云开发者联盟 该内容已被华为云开发者联盟社区收录，社区免费抽大奖🎉，赢华为平板、Switch等好礼！

加入社区

[_[图片]_银河麒麟 同时被 2 个专栏收录_[图片]_](https://blog.csdn.net/weixin_44255842/category_11388297.html "银河麒麟")

2 篇文章 1 订阅

订阅专栏

[_[图片]_Linux](https://blog.csdn.net/weixin_44255842/category_11388296.html "Linux")

3 篇文章 0 订阅

订阅专栏

# <a id="t0"></a><a id="WIN10_x86ARM_0"></a>WIN10 x86环境部署[ARM](https://so.csdn.net/so/search?q=ARM&spm=1001.2101.3001.7020)虚拟机（银河麒麟）实例

### <a id="t1"></a>目录

- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](#WIN10_x86ARM_0)
- [前言](#_4)
- [部署前的准备](#_7)
- [安装](#_33)
- [安装虚拟机](#_60)
- [启动虚拟机](#_76)
- [利用shell工具连接](#shell_87)

# <a id="t2"></a><a id="_4"></a>前言

在我们日常的生产以及运维中，我们经常使用到不同[架构](https://so.csdn.net/so/search?q=%E6%9E%B6%E6%9E%84&spm=1001.2101.3001.7020)的服务器，我们经常使用的是x86架构的cpu，这样一来我们对于同样是x86架构的64位处理器的操作系统，我们可以利用vmware等虚拟软件进行虚拟，而对于不同cpu架构的arm架构的操作系统，我们可以通过QEMU模拟器来进行模拟一个arm环境，方便我们进行对某些运行在arm架构系统上面的软件进行测试与学习。

# <a id="t3"></a><a id="_7"></a>部署前的准备

首先，我们需要一个系统镜像，这个镜像需要时arm架构的

我以arm架构的银河麒麟为例：

> Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso

_[图片：在这里插入图片描述]_

下载地址：（包含各个架构系统的合集）
[点我](https://itas109.blog.csdn.net/article/details/109453945?utm_medium=distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromBaidu~default-6.no_search_link&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromBaidu~default-6.no_search_link)

QEMU 软件的下载地址：
https://qemu.weilnetz.de/w64/2021/qemu-w64-setup-20210505.exe

UEFI（BIOS的替代方案）的下载地址
http://releases.linaro.org/components/kernel/uefi-linaro/16.02/release/qemu64/QEMU_EFI.fd

安装前的总结：

| 名称  | 路径  |
| --- | --- |
| Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso | H:\image |
| qemu-w64-setup-20210505.exe | H:\vm\arm64 |
| QEMU_EFI.fd | H:\vm\arm64 |

# <a id="t4"></a><a id="_33"></a>安装

运行qemu-w64-setup-20210505.exe 安装 。
安装在当前目录

_[图片：在这里插入图片描述]_
安装好后，我们需要利用qemu生成一个硬盘文件
步骤：
进入到qemu的安装目录，如下图，打开cmd命令行
_[图片：在这里插入图片描述]_
执行以下命令：

```
`qemu-img create -f qcow2 H:vmarm64kylindisk.qcow2 40G` 

- 1

```

最终得到一个命名为kylindisk.qcow2的磁盘文件，以后我们利用此文件进行安装[虚拟机](https://so.csdn.net/so/search?q=%E8%99%9A%E6%8B%9F%E6%9C%BA&spm=1001.2101.3001.7020)。
_[图片：在这里插入图片描述]_

这样我们就得到以下位置信息

| 名称  | 位置  |
| --- | --- |
| 虚拟机镜像 | H:\image\ Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso |
| qemu | H:\vm\arm64\qemu |
| QEMU_EFI.fd | H:\vm\arm64\QEMU_EFI.fd |
| 虚拟机磁盘位置 | H:\vm\arm64\kylindisk.qcow2 |

至此安装虚拟机所需要的东西都已经准备好了

# <a id="t5"></a><a id="_60"></a>安装虚拟机

进入到qemu所在位置
进入到cmd命令行，执行以下命令

```
`qemu-system-aarch64.exe -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios H:vmarm64QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=H:vmarm64kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=H:imageKylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom  -net nic -net user,hostfwd=tcp::2222-:22` 

- 1

```

需要注意的是路径要一一对应上，否则可能会报错

安装过程省略，和普通的虚拟机一样，就是会特别慢…

安装好后，查看cpu架构
_[图片：在这里插入图片描述]_

# <a id="t6"></a><a id="_76"></a>启动虚拟机

安装好后，我们需要再次启动（无需指定iso文件启动）
进入到qemu所在位置
进入到cmd命令行，执行以下命令

```
`qemu-system-aarch64.exe -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios H:vmarm64QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=H:vmarm64kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22` 

- 1

```

# <a id="t7"></a><a id="shell_87"></a>利用shell工具连接

我们建立好虚拟机后，通常需要利用shell工具进行文件的传输或者远程交互。

宿主访问虚拟机需要访问本机2222
ssh 127.0.0.1:2222

这样就可以访问了

自此，我们就在WIN10 x86环境部署好了ARM虚拟机（银河麒麟）

文章知识点与官方知识档案匹配，可进一步学习相关知识

[云原生入门技能树](https://edu.csdn.net/skill/cloud_native/cloud_native-11a547517d4f412e9639ca61dcd6eaf7)[云原生环境小结](https://edu.csdn.net/skill/cloud_native/cloud_native-11a547517d4f412e9639ca61dcd6eaf7)[云原生的分层](https://edu.csdn.net/skill/cloud_native/cloud_native-11a547517d4f412e9639ca61dcd6eaf7)7582 人正在系统学习中

[_[图片]_Frank_xx](https://blog.csdn.net/weixin_44255842)

关注

-  _[图片]_ <a id="spanCount"></a>18 
- _[图片]_
-  _[图片]_ <a id="get-collection"></a>103 
- _[图片]_
-  [_[图片]_ 23](#commentBox) 

- _[图片]_

专栏目录

[安装*arm**虚拟机*_Windows 10 *ARM*64 QEMU*虚拟机*安装步骤](https://blog.csdn.net/weixin_36410293/article/details/112570169)

[weixin_36410293的博客](https://blog.csdn.net/weixin_36410293)

 _[图片]_ 1万+ 

[1，下载QEMU*虚拟机*软件，使用以下版本，并安装到计算机任意目录之下。https://qemu.weilnetz.de/w64/2017/qemu-w64-setup-20171217.exehttps://qemu.weilnetz.de/w32/2017/qemu-w32-setup-20171217.exe2，下载WINDOWS 10 *ARM*64镜像，从以下地址获取，下载完成后，把镜像移入Q...](https://blog.csdn.net/weixin_36410293/article/details/112570169)

[*WIN10* *x86**环境**部署**ARM**虚拟机*(CENTOS)*实例*](https://huaweicloud.csdn.net/635643a2d3efff3090b5cc54.html)

[weixin_44265105的博客](https://blog.csdn.net/weixin_44265105)

 _[图片]_ 5171 

[*WIN10* *x86**环境**部署**ARM**虚拟机* 参考文章： https://blog.csdn.net/weixin_36410293/article/details/112570169 https://blog.csdn.net/weixin_35289035/article/details/112570161 https://blog.csdn.net/vah101/article/details/116732656 操作系统： *Win10* 20H2 I7-9750H 2T SSD 16G 下载地址： Ce](https://huaweicloud.csdn.net/635643a2d3efff3090b5cc54.html)

<a id="commentBox"></a>

[*WIN10* *x86**环境**部署**ARM**虚拟机*(CENTOS)*实例*_午夜芭蕾的博客](https://blog.csdn.net/weixin_44265105/article/details/117704631)

11-19

[cdrom设置了系统镜像,就会从镜像启动,此时安装系统,设置为空置则从*虚拟机*磁盘启动。 c:cdC:\Program Files\qemusetdisk=D:\VirtualBox_VMs*arm*64-centos7\disk1.qcow2 remsetcdrom=D:\backup\iso\CentOS\CentOS-7-aarch64-Everyt...](https://blog.csdn.net/weixin_44265105/article/details/117704631)

[配置*ARM**虚拟机*_-西西弗斯的博客_配置*arm**虚拟机*](https://blog.csdn.net/f2157120/article/details/110410276)

11-12

[还是百度百科说的:Das U-Boot 是一个主要用于嵌入式系统的引导加载程序,可以支持多种不同的计算机系统结构,包括PPC、*ARM*、AVR32、MIPS、*x86*、68k、Nios与MicroBlaze。 更加详细一点来说,u-boot是一种普遍用于嵌入式系统中的Bootloader,...](https://blog.csdn.net/f2157120/article/details/110410276)

[Windows *x86* *环境* *虚拟机* 安装*银河麒麟*V10 *arm*架构系统<br>最新发布](https://blog.csdn.net/weixin_54594861/article/details/125652594)

[吃不胖的Harry公子的博客](https://blog.csdn.net/weixin_54594861)

 _[图片]_ 1551 

[Windows *x86* *环境* 安装*银河麒麟*V10 *arm*架构系统（适用于单片机等） 菜鸟整理，欢迎交流](https://blog.csdn.net/weixin_54594861/article/details/125652594)

[iso qemu 安装ubuntu_Ubuntu 14.04 下搭建*ARM*架构的QEMU*虚拟机*](https://blog.csdn.net/weixin_39851918/article/details/111807224)

[weixin_39851918的博客](https://blog.csdn.net/weixin_39851918)

 _[图片]_ 299 

[Requirement:*x86* 架构的Ubuntu系统本次安装选用Debian *ARM*需要的文件:kernelinitrdDebian-*ARM* iso0x0000安装 QEMU *虚拟机*sudo apt-get install qemu-system-*arm*1. 创建一个directory来存放相关文件mkdir qemu_debian && cd qemu_debian2. 获取k...](https://blog.csdn.net/weixin_39851918/article/details/111807224)

[搭建*ARM*架构的QEMU*虚拟机*_楼兰公子的博客_*arm* qemu](https://blog.csdn.net/nh5431313/article/details/121295032)

11-21

[1. 创建虚拟硬盘 (大小随意) qemu-img create debian.img 20G 2. 载入 *ARM* kernel, initrd 以及ISO qemu-system-*arm* -M versatileab -kernel ./vmlinuz-3.2.0-4-versatile -initrd ./initrd.gz -cdrom ./debian-7.9.0-*arm*el...](https://blog.csdn.net/nh5431313/article/details/121295032)

[*ARM* 虚拟化简介_Adrian503的博客](https://blog.csdn.net/Adrian503/article/details/126499017)

11-20

[*ARM* 虚拟化简介 计算机系统抽象架构 虚拟化和抽象非常的类似 常见的几种*虚拟机* 有两种类型的 Hypervisor/vmm 科普一下早期的虚拟化实现方法,像Xen 和 linux kvm 都是基于硬件虚拟化来实现的,在早期的时候,没有硬件虚拟化技术之前,...](https://blog.csdn.net/Adrian503/article/details/126499017)

[linux上的*arm**虚拟机*,*ARM* Linux教程之一：安装VirtualBox*虚拟机*](https://blog.csdn.net/weixin_34851528/article/details/116677627)

[weixin_34851528的博客](https://blog.csdn.net/weixin_34851528)

 _[图片]_ 2222 

[*虚拟机*(Virtual Machine)指通过软件模拟的具有完整硬件系统功能的、运行在一个完全隔离*环境*中的完整计算机系统。通过*虚拟机*软件，你可以在一台物理计算机上模拟出另一台或多台虚拟的计算机，这些*虚拟机*完全就像真正的计算机那样进行工作，例如你可以安装操作系统、安装应用程序、访问网络资源等等。简而言之，就是，使用你现在的电脑，通过安装一个叫“virtualbox”的软件，你就可以在你的电脑里面拥有...](https://blog.csdn.net/weixin_34851528/article/details/116677627)

[盗梦空间：在*X86*平台上构建*ARM*模拟器](https://blog.csdn.net/wwwyue1985/article/details/123975969)

[wwwyuewww的专栏](https://blog.csdn.net/wwwyue1985)

 _[图片]_ 1828 

[需求来源于如何构建*arm*平台的Ubuntu文件系统。 我们希望在*ARM*开发板上使用Ubuntu系统，那么就需要构建一个Ubuntu的根文件系统，基于该基础文件系统，进一步扩展开发。 当然，也可能大部分的需求更多是来源于如何在host系统上构建*arm**环境*，编译*arm*程序。殊途同归，问题都归结为一点，即如何在host系统上构建*arm*模拟*环境*。 从上述构建文件系统需求出发，搜索到的资料无一例外的提到了chroot命令和qemu-*arm*-static安装包。 具体思路是，安装qemu-*arm*-static安](https://blog.csdn.net/wwwyue1985/article/details/123975969)

[Windows 搭建*ARM**虚拟机* UOS系统](https://blog.csdn.net/q1009020096/article/details/124491422)

[q1009020096的博客](https://blog.csdn.net/q1009020096)

 _[图片]_ 6782 

[使用QEMU模拟*ARM**环境*进行UOS *ARM*开发。 1. 搭建*环境* 1.1 *虚拟机*安装 下载安装qemu 按照提示下一步下一步，完成安装。 默认情况qemu安装于C:\Program Files\qemu目录。 安装完成后设置*环境*变量 完成后运行cmd，测试*环境*变量配置完成 qemu-system-aarch64 --version 1.2 操作系统及BIOS 下载UOS *ARM*镜像 https://www.chinauos.com/resource/download-professional](https://blog.csdn.net/q1009020096/article/details/124491422)

[*x86*服务器*部署*kylin v10（*arm*版）*虚拟机*](https://blog.csdn.net/l1422586361/article/details/121696210)

[l1422586361的博客](https://blog.csdn.net/l1422586361)

 _[图片]_ 3442 

[本次讲解在*x86* linux*环境*下使用qemu进行*arm*版*银河麒麟*的*部署*，适用于*运维*人员进行相关项目的趟雷操作 qemu、VMware、docker区别 讲到*虚拟机*，得益于windows*环境*下的盛行，很多人第一时间想到的是VMware。亦或者考虑到*部署*的方便，考虑到的是docker，这里讲一下三者的区别，以下是我个人理解，所以不会讲到什么术语，简单理解下就行 VMware：基于本地的硬件配置，完全模拟一个“操作系统”，功能完全复刻操作系统所具备的功能，能够独立使用，但不必要占用空间/硬盘开销大 doc.](https://blog.csdn.net/l1422586361/article/details/121696210)

[在VMware*虚拟机*上安装*arm*-linux-gcc](https://shiyixin.blog.csdn.net/article/details/105246618)

[墨染锦年的博客](https://blog.csdn.net/qq_44710568)

 _[图片]_ 1万+ 

[记录一下 操作系统:CentOS7 Linux version ：4.9.25-27.el7.1.b1.13 下载*arm*-gcc-linux 私人链接，侵权请告知：https://pan.baidu.com/s/1_-rbsjnYpQ74pk863j5cBg 提取码：e1jn 等待时间进入*虚拟机*目录/usr/local/，mkdir *arm*/ 创建目录，修改该文件夹的属性为rwx，输入命令...](https://shiyixin.blog.csdn.net/article/details/105246618)

[在*x86*上使用*arm*的模拟器](https://blog.csdn.net/GeiGe123/article/details/116781368)

[GeiGe123的博客](https://blog.csdn.net/GeiGe123)

 _[图片]_ 783 

[使用qemu-*arm*-static模拟运行*arm*的文件系统 1、安装qemu-*arm*-static apt install qemu-*arm*-static 2、准备一个*arm*的根文件系统 rootfs debian … 都可以； 3、准备*环境* cp /usr/bin/qemu-*arm*-static rootfs/usr/bin/ cp /etc/resolv.conf rootfs/etc/resolv.conf （确保网络可用） # 下面几个可能也不需要做 mount -t proc /proc roo](https://blog.csdn.net/GeiGe123/article/details/116781368)

[mac pro M1(*ARM*)安装：VMWare Fusion及linux(centos7/ubuntu)（一）<br>热门推荐](https://wu55555.blog.csdn.net/article/details/122517521)

[55555的博客](https://blog.csdn.net/qq_24950043)

 _[图片]_ 4万+ 

[0.引言 最近正好在mac M1上安装centos*虚拟机*以及开发*环境*，特记录下，以供后续有需要的同学参考 1.下载 1.1 安装VMware Fusion 我选择在VMware上运行*虚拟机*，所以需要下载VMware Fusion 下载地址：VMware Fusion for M1 选择*ARM*版本下载，目前是官方推出的针对M1的试用版本，无需激活，后续是否收费还未可知 下载后双击安装即可 1.2 下载centos centos for m1下载地址：centos for m1 北京外国语大学镜像地址（推荐下](https://wu55555.blog.csdn.net/article/details/122517521)

[CE6.0模拟器--*X86**环境*运行*Arm*程序](https://download.csdn.net/download/SuperArthur/3353362)

06-10

[DE=E:\超图CE6.0模拟器\1.0\DeviceEmulator.exe" /video 800x480x16" BIN=E:\超图CE6.0模拟器\WINCE6\CE60_*ARM*_CHS.bin ShareFolder=e:\ [Setting] RAM=256 Title=超图CE6模拟器 2xZoom=0 KeepOnTop=0 SerialConsole=0 DefaultSave=0 CE50_*ARM*_CHS.bin](https://download.csdn.net/download/SuperArthur/3353362)

[mac pro M1(*ARM*)安装：VMware Fusion重启*虚拟机*后又提示需要安装](https://wu55555.blog.csdn.net/article/details/127035332)

[55555的博客](https://blog.csdn.net/qq_24950043)

 _[图片]_ 798 

[不少同学反馈，安装后再重启需要重新安装，这是因为又连接了镜像文件，并且从镜像启动了。1、关闭*虚拟机*，打开*虚拟机*设置，打开。我们需要修改两项配置。5、然后重新启动即可。](https://wu55555.blog.csdn.net/article/details/127035332)

[【Linux operation 23】Win 10 64位（*X86* 架构CPU）安装*ARM*架构的*虚拟机*（*银河麒麟*高级服务器操作系统 V10)](https://huaweicloud.csdn.net/63560fced3efff3090b59589.html)

[qq_22938603的博客](https://blog.csdn.net/qq_22938603)

 _[图片]_ 9856 

[1、*银河麒麟*高级服务器操作系统 V10（鲲鹏版）下载： 官网下载 https://www.kylinos.cn/scheme/server/1.html 1.*银河麒麟*高级服务器操作系统V10 *x86*/兆芯/海光 Kylin-Server-10-SP2-*x86*-Release-Build09-20210524.iso https://pan.baidu.com/s/19CmmJWl0jDzUTJxEcJZ3Tg 提取码：now7 *arm*64/飞腾/鲲鹏 Kylin-Server-10-SP2-aarch](https://huaweicloud.csdn.net/63560fced3efff3090b59589.html)

[*x86*的PC机上运行*ARM*架构开发板](https://blog.csdn.net/sydyh43/article/details/122609999)

[sydyh43的博客](https://blog.csdn.net/sydyh43)

 _[图片]_ 1099 

[一、背景 1、当你需要基于*arm* + linux框架开发需求（如驱动，应用程序，调试等）时，但是没有相应的物理开发*环境*，只有一台装了*虚拟机*linux系统的*X86*电脑。如果是这种情况，可以继续往下看。 2、需要linux系统上安装*虚拟机*qemu，在qemu上运行*arm**环境*。 3、一套完整的*arm* + linux启动流程，主要包括u-boot，kernel和rootfs这三元组。其中在qemu中，可以跳过u-boot来启动内核，挂载文件系统。 基于以上几个组成部分，完成安装。 二、安装 1、准备工作](https://blog.csdn.net/sydyh43/article/details/122609999)

[使用qemu在*x86*上模拟*arm*64*环境*](https://blog.csdn.net/H_haow/article/details/105552687)

[青](https://blog.csdn.net/H_haow)

 _[图片]_ 3685 

[背景 最近要验证代码能否兼容*arm*平台，因此需要在本地模拟一个*arm**环境*，目前虚拟化中，看起来只有qemu能满足在*x86*服务器上虚拟*arm**环境* qemu编译 # 基础依赖安装 yum install zlib-devel glib2-devel pixman-devel -y # clone qemu源码 git clone https://git.qemu.org/git/qemu.git ...](https://blog.csdn.net/H_haow/article/details/105552687)

[WIndows下使用Qemu安装*Arm*版Kylin系统](https://blog.csdn.net/h1007886499/article/details/121110333)

[h1007886499的博客](https://blog.csdn.net/h1007886499)

 _[图片]_ 3384 

[提示：转载请注明出处 文章目录前言一、Qemu是什么？二、操作步骤1.*环境*准备(1).qemu安装(2).QEMU_EFI.fd：镜像启动时的BIOS。(3).*ARM*系统的.iso镜像：(4).制作镜像(5).准备目录2.安装*虚拟机*3.启动*虚拟机*总结问题描述： 前言 随着国产化的浪潮一步一步的加大，我们接触的国产系统和国产硬件也在不断的增多，忍不住的吐槽，现在的硬件是真的倒退了好多年，而且也特别的贵，但是为支持国产，我们也需要更多的进行国产化的适配和学习，linux下搭建比较简单，windows则比较复](https://blog.csdn.net/h1007886499/article/details/121110333)

### “相关推荐”对你有帮助么？

- _[图片]_
    
    非常没帮助
    
- _[图片]_
    
    没帮助
    
- _[图片]_
    
    一般
    
- _[图片]_
    
    有帮助
    
- _[图片]_
    
    非常有帮助
    

©️2022 CSDN 皮肤主题：游动-白 设计师：我叫白小胖 [返回首页](https://blog.csdn.net/)

- [关于我们](https://www.csdn.net/company/index.html#about)
- [招贤纳士](https://www.csdn.net/company/index.html#recruit)
- [商务合作](https://marketing.csdn.net/questions/Q2202181741262323995)
- [寻求报道](https://marketing.csdn.net/questions/Q2202181748074189855)
- _[图片]_ 400-660-0108
- _[图片]_[kefu@csdn.net](mailto:webmaster@csdn.net)
- _[图片]_[在线客服](https://csdn.s2.udesk.cn/im_client/?web_plugin_id=29181)
- 工作时间 8:30-22:00

- [公安备案号11010502030143](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502030143)
- [京ICP备19004658号](http://beian.miit.gov.cn/publish/query/indexFirst.action)
- [京网文〔2020〕1039-165号](https://csdnimg.cn/release/live_fe/culture_license.png)
- [经营性网站备案信息](https://csdnimg.cn/cdn/content-toolbar/csdn-ICP.png)
- [北京互联网违法和不良信息举报中心](http://www.bjjubao.org/)
- [家长监护](https://download.csdn.net/tutelage/home)
- [网络110报警服务](http://www.cyberpolice.cn/)
- [中国互联网举报中心](http://www.12377.cn/)
- [Chrome商店下载](https://chrome.google.com/webstore/detail/csdn%E5%BC%80%E5%8F%91%E8%80%85%E5%8A%A9%E6%89%8B/kfkdboecolemdjodhmhmcibjocfopejo?hl=zh-CN)
- [账号管理规范](https://blog.csdn.net/blogdevteam/article/details/126135357)
- [版权与免责声明](https://www.csdn.net/company/index.html#statement)
- [版权申诉](https://blog.csdn.net/blogdevteam/article/details/90369522)
- [出版物许可证](https://img-home.csdnimg.cn/images/20220705052819.png)
- [营业执照](https://img-home.csdnimg.cn/images/20210414021142.jpg)
- ©1999-2022北京创新乐知网络技术有限公司

[_[图片：]_](https://blog.csdn.net/weixin_44255842)

<a id="uid"></a>[Frank_xx](https://blog.csdn.net/weixin_44255842 "Frank_xx")

码龄4年 [_[图片]_ 武汉达梦数据库](https://i.csdn.net/#/uc/profile?utm_source=14998968 "武汉达梦数据库") 

[13<br>原创](https://blog.csdn.net/weixin_44255842)

[17万+<br>周排名](https://blog.csdn.net/rank/list/weekly)

[13万+<br>总排名](https://blog.csdn.net/rank/list/total)

1万+

访问

[_[图片]_](https://blog.csdn.net/blogdevteam/article/details/103478461)

等级

178

积分

<a id="fan"></a>13

粉丝

23

获赞

23

评论

119

收藏

_[图片]_

_[图片]_

_[图片]_

[私信](https://im.csdn.net/chat/weixin_44255842)

<a id="btnAttent"></a>关注

_[图片]_

_[图片]_

### 热门文章

- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例 _[图片]_ 14503](https://blog.csdn.net/weixin_44255842/article/details/120652227)
- [springboot +mybatis +druid 连接达梦数据库 _[图片]_ 2277](https://blog.csdn.net/weixin_44255842/article/details/118901949)
- [达梦数据库-操作系统配置信息检查命令汇总 _[图片]_ 531](https://blog.csdn.net/weixin_44255842/article/details/120544353)
- [达梦数据库快速安装入门（包含linux和win下） _[图片]_ 402](https://blog.csdn.net/weixin_44255842/article/details/118636331)
- [达梦数据库审计功能 _[图片]_ 342](https://blog.csdn.net/weixin_44255842/article/details/119454965)

### 最新评论

- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](https://blog.csdn.net/weixin_44255842/article/details/120652227#comments_24256454)
    
    [weixin_57884836:](https://blog.csdn.net/weixin_57884836) 如果卡在logo界面，可以尝试把磁盘文件由40G扩大到60G
    
- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](https://blog.csdn.net/weixin_44255842/article/details/120652227#comments_24187583)
    
    [ZeroHero99:](https://blog.csdn.net/ZeroHero99) 大神，通过终端修改文件可以修复上网问题吗？
    
- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](https://blog.csdn.net/weixin_44255842/article/details/120652227#comments_24187570)
    
    [ZeroHero99:](https://blog.csdn.net/ZeroHero99) 我也是，一点击火狐浏览器虚拟机就直接关闭_[图片]_
    
- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](https://blog.csdn.net/weixin_44255842/article/details/120652227#comments_24187554)
    
    [ZeroHero99:](https://blog.csdn.net/ZeroHero99) 大神，我也上不了网，有没有教程啊，急~~_[图片]_
    
- [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](https://blog.csdn.net/weixin_44255842/article/details/120652227#comments_23387442)
    
    [冬冬啷个咚:](https://blog.csdn.net/weixin_50791990) 哥们这个问题解决了吗
    

### 您愿意向朋友推荐“博客详情页”吗？

- _[图片]_
    
    强烈不推荐
    
- _[图片]_
    
    不推荐
    
- _[图片]_
    
    一般般
    
- _[图片]_
    
    推荐
    
- _[图片]_
    
    强烈推荐
    

### 最新文章

- [达梦数据库 主备架构切换为单机架构](https://blog.csdn.net/weixin_44255842/article/details/124987467)
- [达梦数据库-操作系统配置信息检查命令汇总](https://blog.csdn.net/weixin_44255842/article/details/120544353)
- [达梦数据库-主机配置检查命令汇总](https://blog.csdn.net/weixin_44255842/article/details/120484309)

[2022年1篇](https://blog.csdn.net/weixin_44255842?type=blog&year=2022&month=05)

[2021年9篇](https://blog.csdn.net/weixin_44255842?type=blog&year=2021&month=10)

[2020年3篇](https://blog.csdn.net/weixin_44255842?type=blog&year=2020&month=09)

_[图片]_

### 目录

1.  [WIN10 x86环境部署ARM虚拟机（银河麒麟）实例](#t0)
2.  1.  [目录](#t1)
3.  [前言](#t2)
4.  [部署前的准备](#t3)
5.  [安装](#t4)
6.  [安装虚拟机](#t5)
7.  [启动虚拟机](#t6)
8.  [利用shell工具连接](#t7)

_[图片]_

### 分类专栏

-  [_[图片：]_  数据库](https://blog.csdn.net/weixin_44255842/category_11196466.html) 6篇
-  [_[图片：]_ 达梦数据库](https://blog.csdn.net/weixin_44255842/category_11196470.html) 9篇
-  [_[图片：]_ Linux](https://blog.csdn.net/weixin_44255842/category_11388296.html) 3篇
-  [_[图片：]_ 银河麒麟](https://blog.csdn.net/weixin_44255842/category_11388297.html) 2篇
-  [_[图片：]_ java](https://blog.csdn.net/weixin_44255842/category_11220042.html) 1篇
-  [_[图片：]_ spring](https://blog.csdn.net/weixin_44255842/category_10100505.html) 2篇

_[图片]__[图片]_举报
