---
title: Spring Bean 的完整生命周期
date: "2026-03-21"
tags: [Java, Spring]
description: doGetBean 方法开始 spring bean都是懒加载，在第一次获取的时候才创建bean的实例
published: true
---

# Spring Bean 的完整生命周期

> **背景：** Spring / Java 是项目的主技术栈，多数线上事故最终都要落到 JVM 与 Spring 容器层面，下面是当时的完整记录与思考。

doGetBean 方法开始
spring bean都是懒加载，在第一次获取的时候才创建bean的实例

- 阶段1 处理名称，检查缓存 
   - 别名解析为实际名称，在进行后续处理
   - 若要FactoryBean本身，需要使用&名称获取
   - singletonOjbects是一级缓存，放单例成品对香港
   - singletonFactories 是三级缓存，放单例工厂，解决循环依赖问题
   - earlySingletonObjects 二级缓存，放单例工厂的产品，可称为提前单例对象，解决有需要产生代理的情况下，产生的循环依赖问题
- 阶段2 处理父子容器 
   - 父子容器的bean名称可以重复
   - 优先找子容器的bean，找到了直接返回，找不到继续到父容器找
- 阶段3 dependsOn 
   - 用在非显式依赖的bean的创建顺序控制（a dependsOn b)
- 阶段4 按Scope创建bean 
   - scope理解为从xxx范围内查找这个bean更贴切
   - single 单例 从refresh 创建 close时销毁 BeanFactory会记录哪些bean要调用销毁方法，从单例池范围内获取bean，如果没有，就创建并放入单例池
   - prototype 多例 首次使用时创建，并需要手动调用destorybean调用销毁方法  从不缓存bean，每次都创建新的
   - request 首次使用时创建 从request 对象范围内获取bean，如果没有，则创建并放入request
- 创建bean
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653444324479-58e090c9-6bde-4744-a170-9e518033303c.png#clientId=ua3ea2923-eadf-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=465&id=ua993f365&margin=%5Bobject%20Object%5D&name=image.png&originHeight=665&originWidth=855&originalType=binary&ratio=1&rotation=0&showTitle=false&size=275265&status=done&style=none&taskId=u411bc851-5c38-477b-a969-a481235e005&title=&width=598.5)
   - 创建bean实例 
      - 通过AutowiredAnnotationBeanPostProcessor选择构造（优先选择带@autowired注解的bean创建，若有唯一的带参构造，也会入选）
      - 默认构造（如果所有后处理器和BeanDefiniation都没找到构造，采用默认构造，即使是私有构造方法）
   - 依赖注入 
      - AutowiredAnnotationBeanPostProcessor注解匹配 @Autowired及@Value注解的成员，封装为InjectionMetadata进行依赖注入
      - CommonAnnotationBeanPostProcessor注解匹配  @Resource注解的成员，封装为InjectionMetadata进行依赖注入
      - AUTOWIRE_BY_NAME(根据名字匹配)
      - AUTOWIRE_BY_TYPE(根据类型匹配)
      - applyPropertyValues(即xml中 <property name ref|value/>)（精确指定）
