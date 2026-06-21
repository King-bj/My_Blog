---
title: Spring Boot 启动加载的 12 个关键步骤
date: "2026-03-24"
tags: [Java, Spring]
description: 加载步骤12个 ApplicationContext 只是外部容器，核心的工作还是BeanFactory ApplicationContext refresh 12个步骤 1是准备工作 2-6创建和准备 BeanFact...
published: true
---

# Spring Boot 启动加载的 12 个关键步骤

> **背景：** Spring / Java 是项目的主技术栈，多数线上事故最终都要落到 JVM 与 Spring 容器层面，下面是当时的完整记录与思考。

加载步骤12个

ApplicationContext 只是外部容器，核心的工作还是BeanFactory

ApplicationContext refresh 12个步骤

1是准备工作

2-6创建和准备 BeanFactory

7-12 准备ApplicationContext特有功能

11 创建单例对象

1. prepareRefresh 准备工作
2. obtainFreshBeanFactory 创建或获取BeanFactory
3. prepareBeanFactory 准备BeanFactory
4. postProcessBeanFactory 子类扩展BeanFactory
5. invokeBeanFactoryPostProcessors 后处理器扩展BeanFactory
6. registerBeanPostProcessors 准备Bean后处理器
7. initMessageSource -为ApplicationContext提供国际化功能
8. initApplicationEventMulticaster 为ApplicationContext 提供事件发布器
9. onRefresh 留给子类扩展
10. registerListeners 为ApplicationContext准备监听器
11. finishBeanFactoryInitialization （初始化单例Bean，执行Bean后处理器扩展)
12. finishRefresh （准备生命周期管理器，发布ContextRefreshed事件）

## 分解

### prepareRefresh

创建和准备了Evironment对象 -》键值信息

包括

- systemProperties (java键值 如分隔符 )
- systemEnvironment（操作系统键值 如JAVA_HOME）
- 自定义PropertySource 自定义键值如application.properties文件

作用之一就是为后续@Value值注入时提供键值

### obtainFreshBeanFactory

- BeanFactory是用来负责bean的创建 依赖注入和初始化
- BeanFactory 和 ApplicationContext 继承了BeanFactory，ApplicationContext有一部分功能是BeanFactory实现的，所以实际使用中他们是组合关系
- BeanDefinition (存储了所有的bean的特征 如单例多例 依赖关系 初始销毁方法登)
- BeanDefinitiond的来源有很多，比如xml 配置类 组件扫描 也可以是编程添加

### prepareBeanFactory

- 准备成员变量
- beanExpressionResolver 解析spring el表达式 如${}
- propertyEditorRegistrars 注释类型转换器 并应用ApplicationContext提供的Environment完成 ${}解析
- resolvableDeendencies 特殊的bean对象注入 （如beanFactory 以及ApplicationContext)
- beanPostProcessors 在bean创建时对bean进行扩展

### postProcessBeanFactory

- 空的实现留给子类扩展（模板方法设计模式）
- 一般web环境的ApplicationContext都要利用它注册新的Scope，完善Web下的BeanFactory

### invokeBeanFactoryPostProcessors

- 后处理器，充当beanFactory的扩展点，可以用来补充或修改BeanDefinition
- ConfigurationClassPostProcesser  用来解析[@Configuration ](/Configuration ) [@Bean ](/Bean ) [@Import ](/Import ) [@PropertySource ](/PropertySource ) 等 
- PropertySorucesPlaceHolderConfigurer 替换BeanDefinition 中的 ${}

### registerBeanPostProcessors

- 注册bean后处理器 包括自己实现的继承了registerBeanPostProcessors以及 [@Autowired ](/Autowired ) @resources，[@aspect ](/aspect ) aop 等 
- AutowiredAnnotationBeanPostProcessor 解析[@AutoWired ](/AutoWired ) [@Value ](/Value ) 
- CommonAnnotationBeanPostProcessor 解析[@Resource ](/Resource ) [@PostConstruct ](/PostConstruct ) [@PreDestroy ](/PreDestroy ) 
- AnnotationAwareAspectJAutoProxyCreator 为符合切点的目标bean 自动创建代理
- 只是注册了响应的bean后处理器，真正发挥作用是在bean创建的时候

### initMessageSource

- 赋值MessageSource
- 实现国际化
- 容器中如果有messageSource的bean，就把它作为国际化实现，如果没有，就不支持国际化

### initApplicationEventMulticaster

- 事件广播器 用来发布事件给监听器
- 从容器中找名为applicationEventMulticaster的bean作为事件广播器，若没有，会新建默认的事件广播器
- 可以调用ApplicationContet.publishEvent(事件对象)来发布事件

### onRefresh

- 空实现，留给子类扩展（模板方法）
- spring boot就是扩展了这个方法准备Webserver准备web容器

### registerListeners

- 用来接收事件
- 一部分监听器是事先编程添加，另一部分来自容器中的bean ，还有一部分来自于@EventListener的解析
- 实现ApplicationListener接口，重写其中的onApplicationEvent(E e)方法 即可实现事件处理

### finishBeanFactoryInitialization

- conversionService 转换机制，作为对propertyEditor的补充
- embeddedValueResolvers 用来解析@value中的${} 借用了Environment的功能
- singletonObjects 单例池 缓存所有的单例对象。对象的创建分三个部分，每部分都有一些bean后处理器参与

### finishRefresh

- lifecycleProcessor 生命周期处理器 用来控制容器内需要生命周期管理的bean
- 如果容器中有lifecycleProcessor的bean就使用它，否则创建默认的生命周期管理器
- 调用context 的start 可以触发所有实现LifeCycle 接口bean的start
- 调用context 的stop可以触发所有实现LifeCycle 接口bean的stop
