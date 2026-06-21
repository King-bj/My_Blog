---
title: MyBatis 常见问题踩坑记录
date: "2026-06-14"
tags: [故障排查, 实战]
description: 线上故障排查的完整复盘记录。
published: true
---

# MyBatis 常见问题踩坑记录

## 背景（Situation）

项目里多处使用 MyBatis，偶尔会遇到映射、缓存、批处理等小坑。

## 目标（Task）

把这些零碎问题归档，避免下次重新踩。

## 行动（Action）

### Mapper接⼝我们都没有实现的⽅法却可以使⽤，是为什么呢

- 使用了动态代理
- 在扫描配置文件时，会将包下的每个mapper文件解析为MapperProxyFactory对象并存储
- 代理对象调⽤⽅法，执⾏是 在MapperProxy中的invoke方法，invoke方法里会获取一个MapperMethod对象，并执行execute方法
- execute方法会判断执行方法的类型（update,delete,select,insert),最终执行的还是sqlSession的方法，其中查询方法还会判断返回值

### 什么是延迟加载

- 在用到数据是才进行加载，也就是懒加载
- 优点是先从单表查询，需要时再从关联表去关联查询，大大提交数据库性能
- 缺点是在大批量数据查询时，查询工作需要消耗时间，可能造成用户等待时间边长
- 通常在一对多，多对多采用延迟加载，一对一和多对一采用立即加载
- 延迟加载是居于嵌套查询实现的（先执行A，再根据A的结果查询B）
- 通过一下方式实现（前两步实现嵌套查询，增加第三步实现延迟加载）

   - **select**标签里返回值写为resultMap
   - 在resultMap里针对多表的collection中增加select=“嵌套查询的sql的namespace”及column="传递的参数"
   - collection中增加fetchType="lazy",或者在全局文件中增加setting name="lazyLoadingEnabled" value="true"配置，局部优先全局策略

## 收获（Result）

形成了一份团队内的"MyBatis 避坑清单"，新成员上手时直接发给他们。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
