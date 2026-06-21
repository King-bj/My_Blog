---
title: Spring Bean 的完整生命周期
date: "2023-06-25"
tags: [Java]
description: "Spring Bean 从 doGetBean 开始的完整生命周期：三级缓存机制、四种 Scope、依赖注入流程，以及 BeanPostProcessor 在初始化前后的扩展点。"
published: true
---

# Spring Bean 的完整生命周期

> **背景：** Spring / Java 是项目的主技术栈，下面梳理了 Spring 容器加载 Bean 的完整流程。

## 核心入口：doGetBean

Bean 的创建从 `AbstractBeanFactory.doGetBean()` 开始。

> **常见误区：** Spring 单例 Bean 默认是**立即实例化（eager init）**，在容器 `refresh()` 阶段就完成创建。只有标注了 `@Lazy` 或 `<bean lazy-init="true">` 的 Bean 才在第一次使用时才实例化。

---

## 阶段一：处理名称，检查缓存

- 别名解析为实际名称
- 若要获取 FactoryBean 本身而非其产品，需要加 `&` 前缀
- 三级缓存查找顺序：
  - **一级缓存** `singletonObjects`：单例成品对象
  - **二级缓存** `earlySingletonObjects`：半成品（已实例化但未初始化），解决**有代理时**的循环依赖
  - **三级缓存** `singletonFactories`：ObjectFactory，解决普通 Bean 的循环依赖

---

## 阶段二：处理父子容器

- 父子容器可以有重名 Bean
- 优先从子容器查找，找不到再到父容器

---

## 阶段三：dependsOn

`@DependsOn` / `depends-on` 用于控制无显式依赖的 Bean 创建顺序（如 `A dependsOn B` 则先实例化 B）。

---

## 阶段四：按 Scope 创建 Bean

| Scope | 创建时机 | 销毁时机 | 备注 |
|-------|---------|---------|------|
| `singleton` | 容器 `refresh()` | 容器 `close()` | 缓存在 `singletonObjects` |
| `prototype` | 每次请求 | 手动调用 `destroyBean()` | 不缓存 |
| `request` | 首次使用 | HTTP 请求结束 | 需 Web 环境 |
| `session` | 首次使用 | Session 失效 | 需 Web 环境 |

---

## 创建 Bean 的内部流程

### 1. 实例化（Instantiation）

`AutowiredAnnotationBeanPostProcessor` 选择构造器优先级：
1. 带 `@Autowired` 注解的构造器
2. 唯一的带参构造器
3. 默认无参构造器（包括 `private`）

### 2. 依赖注入（Population）

- `AutowiredAnnotationBeanPostProcessor`：处理 `@Autowired` / `@Value`
- `CommonAnnotationBeanPostProcessor`：处理 `@Resource`
- `AUTOWIRE_BY_NAME` / `AUTOWIRE_BY_TYPE`：XML 配置自动注入
- `applyPropertyValues`：XML `<property>` 精确注入

### 3. 初始化（Initialization）

1. `Aware` 接口回调（`BeanNameAware`、`ApplicationContextAware` 等）
2. `BeanPostProcessor.postProcessBeforeInitialization()`
3. `InitializingBean.afterPropertiesSet()` / `@PostConstruct`
4. 自定义 `init-method`
5. `BeanPostProcessor.postProcessAfterInitialization()`（AOP 代理在此生成）

### 4. 销毁（Destruction）

容器关闭时：`@PreDestroy` → `DisposableBean.destroy()` → 自定义 `destroy-method`
