---
title: CentOS 7.9 调整 /home 空间到 / 根目录
date: "2025-04-07"
tags: [Linux, 运维, 系统管理]
description: "[会员中心 ](https://mall.csdn.net/vip) 足迹 动态 [创作中心 ](https://mp.csdn.net/ \"创作中心\")"
published: true
---

# CentOS 7.9 调整 /home 空间到 / 根目录

> **背景：** 生产环境中我们维护着上百台 Linux 服务器，日常运维里这些场景出现得很频繁，下面是当时的完整记录与思考。

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

# CentOS7.9调整/home空间到/根目录

_[图片]_

[Jack魏](https://jackwei.blog.csdn.net) _[图片]_于 2021-03-08 12:36:38 发布 _[图片]_54253 <a id="blog_detail_zk_collection"></a>_[图片]_收藏 8 

分类专栏： [Linux](https://blog.csdn.net/weihao0240/category_8621733.html) [常见问题](https://blog.csdn.net/weihao0240/category_8598868.html) 文章标签： [linux](https://so.csdn.net/so/search/s.do?q=linux&t=blog&o=vip&s=&l=&f=&viparticle=) [磁盘](https://so.csdn.net/so/search/s.do?q=%E7%A3%81%E7%9B%98&t=blog&o=vip&s=&l=&f=&viparticle=) [空间](https://so.csdn.net/so/search/s.do?q=%E7%A9%BA%E9%97%B4&t=blog&o=vip&s=&l=&f=&viparticle=)

版权

[_[图片]_Linux 同时被 2 个专栏收录_[图片]_](https://blog.csdn.net/weihao0240/category_8621733.html "Linux")

32 篇文章 1 订阅

订阅专栏

[_[图片]_常见问题](https://blog.csdn.net/weihao0240/category_8598868.html "常见问题")

131 篇文章 0 订阅

订阅专栏

### <a id="t0"></a>[CentOS7](https://so.csdn.net/so/search?q=CentOS7&spm=1001.2101.3001.7020).9调整/home空间到/根目录

- [1. 查看CentOS版本](#1_CentOS_5)
- [2. 解除挂载并删除/home卷](#2_home_16)
- [3. 重新创建/home卷并挂载](#3_home_46)
- [4. 分配空间到 / 根目录](#4____79)

> 说明: `/home`盘符空间很大, 但是`/`[根目录](https://so.csdn.net/so/search?q=%E6%A0%B9%E7%9B%AE%E5%BD%95&spm=1001.2101.3001.7020)很少
> 于是就想移花接木, 这里使用的是`CentOS7`请酌情参考使用
> 参考链接https://www.cnblogs.com/jackyzm/p/10335119.html

# <a id="t1"></a><a id="1_CentOS_5"></a>1. 查看CentOS版本

```
`# 查看centos版本
rpm -q centos-release

# 第二种方式
cat /etc/redhat-release` 

- 1
- 2
- 3
- 4
- 5

```

_[图片：在这里插入图片描述]_

# <a id="t2"></a><a id="2_home_16"></a>2. 解除[挂载](https://so.csdn.net/so/search?q=%E6%8C%82%E8%BD%BD&spm=1001.2101.3001.7020)并删除/home卷

```
`# 1. 解除挂载
umount /home

# 2. 如果解除报错, 查看占用进程, 然后kill掉
fuser -mv /home
kill -9 xxxx
# 然后在解除一下
umount /home

# 如果没有fuser就按下面安装
yum install -y psmisc

# 3. 删除逻辑卷
lvremove /dev/centos/home

# 4. 查看卷组可用空间
vgdisplay` 

![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCodeMoreWhite.png)

- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10
- 11
- 12
- 13
- 14
- 15
- 16
- 17

```

> 原因就是进入/home目录了, `不要进入home目录`
> 或者是其他进程在操作home目录

_[图片：在这里插入图片描述]_

_[图片：在这里插入图片描述]_

# <a id="t3"></a><a id="3_home_46"></a>3. 重新创建/home卷并挂载

```
`# 1. 新建卷
lvcreate -L 500G -n home centos
# 2. 查看逻辑卷空间
lvdisplay
# 3. 查看卷组可用空间
vgdisplay
# 4. 建立xfs文件系统
mkfs -t xfs /dev/centos/home
# 5. 新建的逻辑卷挂载到/home下面 
mount /dev/centos/home /home/
# 6. 查看硬盘情况
df -h` 

- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10
- 11
- 12

```

> 1.新建卷500G到home下面

_[图片：在这里插入图片描述]_

> 2.  查看卷组可用空间
>     可用看到Free空闲还有`372.63GB`

_[图片：在这里插入图片描述]_

> 4.  建立xfs文件系统

_[图片：在这里插入图片描述]_

> 5.  新建的逻辑卷挂载到/home下面

_[图片：在这里插入图片描述]_

# <a id="t4"></a><a id="4____79"></a>4. 分配空间到 / 根目录

```
`# 1. 将空余空间分配到根目录
lvextend -L +370G /dev/centos/root
# 2. 查看硬盘情况
df -h
# 3. 扩容,不执行这个不会显示
xfs_growfs /dev/centos/root` 

- 1
- 2
- 3
- 4
- 5
- 6

```

_[图片：在这里插入图片描述]_
_[图片]_

文章知识点与官方知识档案匹配，可进一步学习相关知识

[CS入门技能树](https://edu.csdn.net/skill/gml/gml-1c31834f07b04bcc9c5dff5baaa6680c)[Linux入门](https://edu.csdn.net/skill/gml/gml-1c31834f07b04bcc9c5dff5baaa6680c)[初识Linux](https://edu.csdn.net/skill/gml/gml-1c31834f07b04bcc9c5dff5baaa6680c)22257 人正在系统学习中

_[图片]_

Java架构师成长之路

_[图片]_QQ群名片

_[图片]_

[_[图片]_Jack魏](https://jackwei.blog.csdn.net)

关注

-  _[图片]_ <a id="spanCount"></a>1 
- _[图片]_
-  _[图片]_ <a id="get-collection"></a>8 
- _[图片]_
-  [_[图片]_ 0](#commentBox) 

- _[图片]_

专栏目录

[*CentOS*7默认安装的/*home*中转移*空间**到**根目录*](https://blog.csdn.net/fanchoulu0315/article/details/82744349)

[fanchoulu0315的博客](https://blog.csdn.net/fanchoulu0315)

 _[图片]_ 1671 

[1. 备份/*home*中的用户数据   [root@localhost /]# mkdir /backup &amp;&amp; mv /*home*/* /backup [root@localhost /]# ls /*home*/   2. 卸载这个/*home*并删除逻辑卷*home* # umount /*home* # df -h //查看*磁盘*情况 # lvremove /dev/*centos*/...](https://blog.csdn.net/fanchoulu0315/article/details/82744349)

[*CentOS*7 手动将硬盘分配至*根目录*](https://blog.csdn.net/weixin_43935187/article/details/121452035)

[统哥哥的博客](https://blog.csdn.net/weixin_43935187)

 _[图片]_ 1404 

[实际操作如下： [root@0003 ~]# df -h （查看当前*磁盘*使用情况） Filesystem Size Used Avail Use% Mounted on /dev/mapper/*centos*-root 44G 19G 26G 43% / devtmpfs 7.8G 0 7.8G 0% /dev tmpfs 7.8G 0 7.8G 0% /dev/sh](https://blog.csdn.net/weixin_43935187/article/details/121452035)

<a id="commentBox"></a>

[*centos7.9* 扩容/根分区（扩根）（扩容和缩容）](https://blog.csdn.net/nanhavezhi/article/details/126385112)

[nanhavezhi的博客](https://blog.csdn.net/nanhavezhi)

 _[图片]_ 353 

[docker容器跑起来默认占用/var/lib目录的*空间*，我知道的有两种解决办法，欢迎大家补充。一是迁移工作目录，二是扩根。反正都是要挂盘，我直接扩根了，省点事。](https://blog.csdn.net/nanhavezhi/article/details/126385112)

[*linux* 下如何*回到**根目录*<br>热门推荐](https://blog.csdn.net/luogan129/article/details/54576936)

[luogan129的博客](https://blog.csdn.net/luogan129)

 _[图片]_ 11万+ 

[*linux* 下如何*回到**根目录**linux* 下如何*回到**根目录*？ cd www , 意思是 *到*www目录； cd .. , 意思是*到*上一级目录； cd - ,意思是返*回到*上次的目录，类似windows返回 ； cd /，意思是*回到**根目录*。](https://blog.csdn.net/luogan129/article/details/54576936)

[*Centos*为硬盘新增容量分区并挂载*到**根目录*](https://blog.csdn.net/SCGH_Fx/article/details/106397911)

[SCGH_Fx的专栏](https://blog.csdn.net/SCGH_Fx)

 _[图片]_ 1463 

[1.查看硬盘的情况。 可以看*到*硬盘新增了大小，但是没有被用起来。 下面我要做的其实就是lvm扩展 [root@Slave2 ~]# fdisk /dev/sda Welcome to fdisk (util-*linux* 2.23.2). Changes will remain in memory only, until you decide to write them. Be careful before using the write command. Command (m for.](https://blog.csdn.net/SCGH_Fx/article/details/106397911)

[从*CentOS*7默认安装的/*home*中转移*空间**到**根目录*/ - LVM操作简明教程](https://itman.blog.csdn.net/article/details/49814097)

[evandeng2009](https://blog.csdn.net/evandeng2009)

 _[图片]_ 3万+ 

[# df -hFilesystem Size Used Avail Use% Mounted on /dev/mapper/*centos*-root 50G 4.8G 46G 10% / devtmpfs 3.9G 0 3.9G 0% /dev tmpfs 3.9G 140](https://itman.blog.csdn.net/article/details/49814097)

[初学*linux*遇*到*的问题：环境*centOS* 7，CD命令进入*根目录*<br>最新发布](https://blog.csdn.net/liu646589/article/details/126849439)

[liu646589的博客](https://blog.csdn.net/liu646589)

 _[图片]_ 349 

[自学*linux*遇*到*的问题：cd命令进入*根目录*。](https://blog.csdn.net/liu646589/article/details/126849439)

[一文学会*CentOS* 文件常用命令](https://blog.csdn.net/janyxe/article/details/124524027)

[janyxe的博客](https://blog.csdn.net/janyxe)

 _[图片]_ 413 

[系列文章目录 保姆级别 VMware Workstation 16 Pro 最新安装教程 VMware 安装*CentOS* 保姆级别教程 一文学会*CentOS* 文件常用命令 如果本文对你们的开发之路有所帮助，请帮忙点个赞，您的支持是我坚持写博客的动力 前言 上一文教会了大家*CentOS* 安装，本文将手把手教大家熟悉*CentOS* 常用指令 文件 目录操作命令 cd 路径命令 命令 含义 cd /*home* 移动目录 cd ~ 移动*到*家目录 cd … 返回上一层目录 cd / 返](https://blog.csdn.net/janyxe/article/details/124524027)

[*CentOS*系统下*调整**home*和/根分区大小](https://blog.csdn.net/youdo/article/details/124226515)

[youdo的博客](https://blog.csdn.net/youdo)

 _[图片]_ 912 

[*Linux*或*CentOS*系统下*调整**home*和\根分区大小](https://blog.csdn.net/youdo/article/details/124226515)

[*Centos*移动/*home*目录*空间**到*/*根目录*下](https://blog.csdn.net/qixiang2013/article/details/125278641)

[qixiang2013的专栏](https://blog.csdn.net/qixiang2013)

 _[图片]_ 580 

[环境搭建](https://blog.csdn.net/qixiang2013/article/details/125278641)

[*CentOS7.9*安装教程【图文视频】](https://blog.csdn.net/aiowang/article/details/114296180)

[aiowang的专栏](https://blog.csdn.net/aiowang)

 _[图片]_ 3203 

[简介: 本文主要是介绍在VMware Workstation16下，进行*CentOS7.9*-mini安装，图文详解，视频搭配（待更新）。 环境准备 系统：WindowServer2019 虚拟机软件：VMware Workstation 下载地址：https://www.vmware.com/cn/products/workstation-pro/workstation-pro-evaluation.html 镜像文件：*CentOS*-7-x86_64-Minimal-2009.dvd 阿里云下载地址：htt](https://blog.csdn.net/aiowang/article/details/114296180)

[*CentOS7.9**调整*/*Home*分区大小](https://blog.csdn.net/Solo_Andy/article/details/123496930)

[Andyluna的博客](https://blog.csdn.net/Solo_Andy)

 _[图片]_ 2524 

[*CentOS*7刚安装时如果选择默认分区设置，则*根目录*/的分区大小只有50G，swap分区与内存大小一致，其余所有的*空间*都会放在/*home*分区下。比如总共200G的*磁盘**空间*情况下，默认分区*home*分区会有144G。有些人觉得不合理，那么可不可以重新*调整*并压缩/*Home*分区的大小，将多余分分区放*到*/目录呢？当然可以嘛，不然我记录干嘛呢，这是我自己的操作心得，仅供参考！ 1.首先查看*磁盘*分区的默认初始情况： [root@localhost ~]# df -h 文件系统 容量](https://blog.csdn.net/Solo_Andy/article/details/123496930)

[*Centos*7把*home*目录下多余的*空间*转移*到*/*根目录*下](https://huaweicloud.csdn.net/635667b9d3efff3090b5db86.html)

[前方的路在刚开始](https://blog.csdn.net/qq_38403590)

 _[图片]_ 1054 

[通过df-h发现，*根目录*只有32G，而*home*目录可用的，居然有142G。第五步（将逻辑卷，拓展*到**磁盘*系统,*磁盘*名字要与之前df-h的逻辑卷保持一致）第二步，取消挂载，一定要询问使用这台机器的所有人，有没有在*home*下挂服务。把你需要挂载的机器的逻辑卷记住（上面的图，左边是逻辑卷，右边是虚拟*磁盘*）如果，不能取消，说明有其他程序在使用，找*到*他们，杀死他们。先加*到*逻辑卷（df -h ，*根目录*，左边对应的就是逻辑卷）第四步（创建卷，为*home*目录，卷名为*centos*）就是这个类，不能修改，首先第一步，进行备份，.](https://huaweicloud.csdn.net/635667b9d3efff3090b5db86.html)

[虚拟机下*centos*7扩展*根目录*及*home*分区，xfs格式](https://blog.csdn.net/baozi_xiaoge/article/details/103641786)

[baozi_xiaoge的博客](https://blog.csdn.net/baozi_xiaoge)

 _[图片]_ 1587 

[文章目录一、虚拟机扩展硬盘二、分区三、格式化四、扩展 一、虚拟机扩展硬盘 虚拟机关机的情况下，编辑虚拟机设置，硬盘扩展*磁盘*大小 二、分区 1、利用fdisk /dev/sda 进入开始分区（因为操作过多，xshell冲掉了分区的操作，图片是其他系统的分区） 需要注意的两点，sda假如已有两个分区，默认分区是3，起始扇区默认。 last 扇区 我这里新扩容500G，给*根目录*150G，*home*350...](https://blog.csdn.net/baozi_xiaoge/article/details/103641786)

[*CentOS*常用基础命令大全（*linux*命令）](https://blog.csdn.net/dengqiaolinh1206/article/details/101582790)

[dengqiaolinh1206的博客](https://blog.csdn.net/dengqiaolinh1206)

 _[图片]_ 284 

[1.关机 (系统的关机、重启以及登出 ) 的命令 shutdown -h now 关闭系统(1) init 0 关闭系统(2) telinit 0 关闭系统(3) shutdown -h hours:minutes & 按预定时间关闭系统 shutdown -c 取消按预定时间关闭系统 shutdown -r now 重启(1) r...](https://blog.csdn.net/dengqiaolinh1206/article/details/101582790)

[服务器重新部署踩坑记](https://blog.csdn.net/sD7O95O/article/details/110411940)

[dotNET跨平台](https://blog.csdn.net/sD7O95O)

 _[图片]_ 266 

[服务器重新部署踩坑记Intro之前的服务器是 Ubuntu 18.04 ，上周周末想升级一下服务器系统，从 18.04 升级*到* 20.04，结果升级升挂了... 后来 SSH 始终连不上...](https://blog.csdn.net/sD7O95O/article/details/110411940)

[*CentOS*7 扩容时发现 /dev/mapper/*centos*-*home* 不存在，创建后登录终端显示 -bash-4.2](https://blog.csdn.net/u010953609/article/details/121208748)

[哈哈虎的博客](https://blog.csdn.net/u010953609)

 _[图片]_ 3637 

[这里是在实验环境操作时发现/dev/mapper/*centos*-*home* 不存在 如果是实际生产环境，请谨慎操作，先备份 /*home* 目录 这篇博文写的比较详细，我也是完全参照他完成的 *centos*7创建/dev/mapper/*centos*-*home* 逻辑分区 lvcreate命令 lvdisplay命令 找不*到* /*home* 逻辑分区 之前已经挂载了新虚拟盘，扩容了 root，打算扩容 /*home*，结果没有找*到* 以前的 /*home* 挂载*到*了哪里？直接 / 了？ 查看*磁盘*设备 $ ls /dev/sd*](https://blog.csdn.net/u010953609/article/details/121208748)

[*centos* *linux* lvm分区,*Centos*系统*调整*LVM卷/*home*分区*到*/分区](https://blog.csdn.net/weixin_33208391/article/details/116690692)

[weixin_33208391的博客](https://blog.csdn.net/weixin_33208391)

 _[图片]_ 125 

[1.首先查看*磁盘*使用情况[root@localhost ~]# df -h文件系统 容量 已用 可用 已用% 挂载点Filesystem Size Used Avail Use% Mounted on/dev/mapper/VolGroup-lv_root 154G 7.9G 139G 6% /tmpfs 1.9G 100...](https://blog.csdn.net/weixin_33208391/article/details/116690692)

[*linux*7无法分配硬盘,*Centos* 7 *磁盘* *调整*](https://blog.csdn.net/weixin_30335379/article/details/116836853)

[weixin_30335379的博客](https://blog.csdn.net/weixin_30335379)

 _[图片]_ 403 

[一、*调整* *centos*-*home*分区 扩大 *centos*-root分区描述：1、/*home*内容备份2、删除逻辑卷(/*home*文件系统)3、扩大/root文件系统4、新建/*home*5、恢复/*home*内容1、查看分区df -h2、备份*home*分区文件tar cvf /opt/*home*.tar /*home*3、卸载/*home*，如果无法卸载，先终止使用/*home*文件系统的进程fuser -km /*home*/...](https://blog.csdn.net/weixin_30335379/article/details/116836853)

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
    

©️2022 CSDN 皮肤主题：编程工作室 设计师：CSDN官方博客 [返回首页](https://blog.csdn.net/)

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

[_[图片：]_](https://jackwei.blog.csdn.net)

<a id="uid"></a>[Jack魏](https://jackwei.blog.csdn.net "Jack魏") _[图片]_

码龄7年 [_[图片]_ 外企德科](https://i.csdn.net/#/uc/profile?utm_source=14998968 "外企德科") 

[627<br>原创](https://jackwei.blog.csdn.net)

[6914<br>周排名](https://blog.csdn.net/rank/list/weekly)

[823<br>总排名](https://blog.csdn.net/rank/list/total)

744万+

访问

[_[图片]_](https://blog.csdn.net/blogdevteam/article/details/103478461)

等级

1万+

积分

<a id="fan"></a>781

粉丝

624

获赞

581

评论

3079

收藏

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

_[图片]_

[私信](https://im.csdn.net/chat/WeiHao0240)

<a id="btnAttent"></a>关注

_[图片]_

### 热门文章

- [Vim入门技巧&常用命令整理 _[图片]_ 229058](https://jackwei.blog.csdn.net/article/details/104882179)
- [Excel批量把数字格式变成文本格式且不用双击出现左上绿标 _[图片]_ 202043](https://jackwei.blog.csdn.net/article/details/121517767)
- [Nginx高性能Web服务器详解 _[图片]_ 200672](https://jackwei.blog.csdn.net/article/details/116100276)
- [maven多模块项目单独打包指定模块jar包 _[图片]_ 199593](https://jackwei.blog.csdn.net/article/details/121287087)
- [基于Java Swing的学生成绩管理系统 _[图片]_ 199516](https://jackwei.blog.csdn.net/article/details/121206444)

### 最新评论

- [最新DevC++6.3安装教程](https://jackwei.blog.csdn.net/article/details/113757133#comments_24132240)
    
    [Jack魏:](https://jackwei.blog.csdn.net) 有没有具体的截图，私聊我一下吧
    
- [最新DevC++6.3安装教程](https://jackwei.blog.csdn.net/article/details/113757133#comments_23995805)
    
    [m0_63091874:](https://blog.csdn.net/m0_63091874) 工具栏运行里面只有 运行 参数 删除性能信息 切换断点能用，其他的都不显示 这种是什么情况，麻烦大佬讲解一下
    
- [Excel批量把数字格式变成文本格式且不用双击出现左上绿标](https://jackwei.blog.csdn.net/article/details/121517767#comments_23962769)
    
    [m0_74875650:](https://blog.csdn.net/m0_74875650) 感谢感谢_[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]__[图片]_
    
- [图解算法 使用Java](https://jackwei.blog.csdn.net/article/details/124565955#comments_23921183)
    
    [csdn11xiaobaiyang:](https://blog.csdn.net/csdn11xiaobaiyang) 你好，有电子版书么
    
- [浩哥的Linux学习笔记之cp命令](https://jackwei.blog.csdn.net/article/details/121899391#comments_23893074)
    
    [唐晓白:](https://blog.csdn.net/weixin_59433011) 博主干的好
    

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

- [再有人问你虚拟机连接问题，把这篇文章丢给他](https://jackwei.blog.csdn.net/article/details/127659382)
- [码云/GitHub Fork代码仓并提交PR代码](https://jackwei.blog.csdn.net/article/details/127661721)
- [IDEA绿色版本重装系统之后git远程仓出现的问题](https://jackwei.blog.csdn.net/article/details/127460202)

2022

[11月 7篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=11)

[10月 6篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=10)

[09月 1篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=09)

[08月 9篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=08)

[07月 4篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=07)

[06月 7篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=06)

[05月 17篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=05)

[04月 7篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=04)

[03月 9篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=03)

[02月 7篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=02)

[01月 28篇](https://jackwei.blog.csdn.net?type=blog&year=2022&month=01)

[2021年307篇](https://jackwei.blog.csdn.net?type=blog&year=2021&month=12)

[2020年68篇](https://jackwei.blog.csdn.net?type=blog&year=2020&month=12)

[2019年163篇](https://jackwei.blog.csdn.net?type=blog&year=2019&month=12)

### 目录

1.  [CentOS7.9调整/home空间到/根目录](#t0)
2.  [1. 查看CentOS版本](#t1)
3.  [2. 解除挂载并删除/home卷](#t2)
4.  [3. 重新创建/home卷并挂载](#t3)
5.  [4. 分配空间到 / 根目录](#t4)

### 分类专栏

-  [_[图片：]_  浩哥的JAVA之路](https://blog.csdn.net/weihao0240/category_9294383.html) 41篇
-  [_[图片：]_ Java并发编程](https://blog.csdn.net/weihao0240/category_12103087.html) 
-  [_[图片：]_ Spring](https://blog.csdn.net/weihao0240/category_11960713.html) 4篇
-  [_[图片：]_ JDK1.1源码学习](https://blog.csdn.net/weihao0240/category_11708609.html) 3篇
-  [_[图片：]_ JavaSE整理](https://blog.csdn.net/weihao0240/category_10466830.html) 6篇
-  [_[图片：]_ Java官方实例](https://blog.csdn.net/weihao0240/category_11794069.html) 4篇
-  [_[图片：]_ Linux](https://blog.csdn.net/weihao0240/category_8621733.html) 32篇
-  [_[图片：]_ 浩哥的Linux学习笔记](https://blog.csdn.net/weihao0240/category_11506835.html) 7篇
-  [_[图片：]_ 运维](https://blog.csdn.net/weihao0240/category_10985682.html) 39篇
-  [_[图片：]_ 软考](https://blog.csdn.net/weihao0240/category_11069119.html) 19篇
-  [_[图片：]_ 读书笔记](https://blog.csdn.net/weihao0240/category_9663049.html) 198篇
-  [_[图片：]_ 山海经](https://blog.csdn.net/weihao0240/category_11781221.html) 1篇
-  [_[图片：]_ 算法竞赛](https://blog.csdn.net/weihao0240/category_8599084.html) 7篇
-  [_[图片：]_ 数据结构与算法](https://blog.csdn.net/weihao0240/category_11742056.html) 3篇
-  [_[图片：]_ 力扣刷题记录](https://blog.csdn.net/weihao0240/category_11793949.html) 3篇
-  [_[图片：]_ 剑指Offer](https://blog.csdn.net/weihao0240/category_11528232.html) 2篇
-  [_[图片：]_ 面试集锦](https://blog.csdn.net/weihao0240/category_11717875.html) 1篇
-  [_[图片：]_ Docker](https://blog.csdn.net/weihao0240/category_10614158.html) 10篇
-  [_[图片：]_ 粉丝福利](https://blog.csdn.net/weihao0240/category_11593656.html) 1篇
-  [_[图片：]_ Elastic](https://blog.csdn.net/weihao0240/category_10869128.html) 5篇
-  [_[图片：]_ RabbitMQ](https://blog.csdn.net/weihao0240/category_10882367.html) 5篇
-  [_[图片：]_ Zabbix](https://blog.csdn.net/weihao0240/category_10629809.html) 7篇
-  [_[图片：]_ 微信开发](https://blog.csdn.net/weihao0240/category_10977169.html) 2篇
-  [_[图片：]_ 人生随笔](https://blog.csdn.net/weihao0240/category_11324391.html) 19篇
-  [_[图片：]_ MATLAB](https://blog.csdn.net/weihao0240/category_11609016.html) 
-  [_[图片：]_ git](https://blog.csdn.net/weihao0240/category_9343115.html) 25篇
-  [_[图片：]_ 浩哥系列](https://blog.csdn.net/weihao0240/category_9426936.html) 5篇
-  [_[图片：]_ 计算机基础](https://blog.csdn.net/weihao0240/category_9750445.html) 
-  [_[图片：]_ 常见问题](https://blog.csdn.net/weihao0240/category_8598868.html) 131篇
-  [_[图片：]_ Python](https://blog.csdn.net/weihao0240/category_9505467.html) 1篇
-  [_[图片：]_ Node.js](https://blog.csdn.net/weihao0240/category_9378264.html) 5篇
-  [_[图片：]_ MySQL](https://blog.csdn.net/weihao0240/category_8598791.html) 37篇
-  [_[图片：]_ 软件安装教程](https://blog.csdn.net/weihao0240/category_8656431.html) 69篇
-  [_[图片：]_ 技术分享](https://blog.csdn.net/weihao0240/category_8598779.html) 30篇
-  [_[图片：]_ C/C++](https://blog.csdn.net/weihao0240/category_8598792.html) 3篇
-  [_[图片：]_ 项目分享](https://blog.csdn.net/weihao0240/category_8598782.html) 24篇
-  [_[图片：]_ 课设毕设](https://blog.csdn.net/weihao0240/category_8599099.html) 30篇
-  [_[图片：]_ STM32](https://blog.csdn.net/weihao0240/category_8717048.html) 6篇

_[图片]__[图片]_举报
