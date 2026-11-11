# 关于我与作品

我是 King。2016 年开始做 Java 开发，2019 年 11 月起负责运维平台研发，2024 年开始承担生产 Kubernetes 运维。做过自动化作业、集中日志和监控平台，也负责过一体化平台在 Kubernetes 上的完整安装，以及业务系统的 SkyWalking 探针接入。

## 可以从这三篇读起

- [在麒麟 ARM64 上验证 eBPF 链路采集](/posts/kylin-ebpf-tracing)。业务团队希望在应用进程外采集调用链。我负责选型和跨版本验证。旧内核最终跑通了 HTTP/1.x 主链路，也留下了明确的能力边界。
- [Kubernetes 迁移后的雪花 ID 冲突](https://docs.jinla.fun/posts/k8s-id)。多个 Pod 为什么会算出相同的实例 ID？文章记录了修复过程，以及哈希方案仍会碰撞的条件。
- [运维平台容量估算](https://docs.jinla.fun/posts/ops-cap)。用一组假设负载，分别估算指标采集速率和日志峰值写入，再判断应该观测哪些组件。

## 代码与个人项目

[Notify Hub 通知投递器](https://github.com/King-bj/rc_jinla/blob/main/src/main/java/com/notifyhub/dispatcher/NotificationDispatcher.java) 是一道面试题中的实现。任务从消息表进入投递流程，失败后重试，耗尽次数后进入死信状态。如果供应商已经接收、本地事务却提交失败，仍有重复投递的可能。

业余我也做 [MindRound](https://github.com/King-bj/mindRound)，探索本地桌面应用里的人物上下文和工具授权。其他兴趣项目和日常笔记保留在博客里。

## 联系

欢迎交流运维开发、平台工程和可观测性岗位。[求职邮箱](mailto:jlnwcy@gmail.com) · [GitHub](https://github.com/King-bj)

