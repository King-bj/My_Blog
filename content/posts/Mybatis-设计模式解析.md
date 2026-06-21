---
title: MyBatis 中的设计模式解析
date: "2025-11-20"
tags: [源码分析, Java, 原理]
description: Builder模式的定义是”将⼀个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。”，它属于创建类模式，⼀般来说，如果⼀个对象的构建⽐较复杂，超出了构造函数所能包含的范围，就可以使⽤⼯⼚模式和Buil...
published: true
---

# MyBatis 中的设计模式解析

> **背景：** 排查生产问题时，仅靠官方文档常常无法定位根因，需要深入到框架源码里看实现，下面是当时的完整记录与思考。

### 构建者模式
Builder模式的定义是”将⼀个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。”，它属于创建类模式，⼀般来说，如果⼀个对象的构建⽐较复杂，超出了构造函数所能包含的范围，就可以使⽤⼯⼚模式和Builder模式，相对于⼯⼚模式会产出⼀个完整的产品，Builder应⽤于更加复杂的对象的构建，甚⾄只会构建产品的⼀个部分，直⽩来说，就是**使⽤多个简单的对象⼀步⼀步构建成⼀个复杂的对象**。
Mybatis的初始化⼯作⾮常复杂，不是只⽤⼀个构造函数就能搞定的。所以使⽤了建造者模式，使用了大量的Builder，进⾏分层构造，核⼼对象Configuration使⽤了XmlConfigBuilder来进⾏构造。在Mybatis环境的初始化过程中，SqlSessionFactoryBuilder会调⽤XMLConfigBuilder读取所有的 MybatisMapConfig.xml 和所有的 *Mapper.xml ⽂件，构建 Mybatis 运⾏的核⼼对象 Configuration 对 象，然后将该Configuration对象作为参数构建⼀个SqlSessionFactory对象。
### 简单工厂模式
**构建继承相同父类的对象，比如联想电脑和惠普电脑都继承电脑，创建工厂对象根据传递的参数，创建不同的对象返回，返回对象都是父类对象。调用者可以调用相同的方法，达到不同的效果**
Mybatis中执⾏Sql语句、获取Mappers、管理事务的核⼼接⼝SqlSession的创建过程使⽤到了⼯⼚模 式。 有⼀个 SqlSessionFactory 来负责 SqlSession 的创建。可以看到，该Factory的openSession ()⽅法重载了很多个，分别⽀持autoCommit、Executor、Transaction等参数的输⼊，来构建核⼼的SqlSession对象。 在DefaultSqlSessionFactory的默认⼯⼚实现⾥，有⼀个⽅法可以看出⼯⼚怎么产出⼀个产品
### 代理模式
能够使得在**不修改源目标的前提下，额外扩展源目标的功能。即通过访问源目标的代理类，再由代理类去访问源目标**。这样一来，要扩展功能，就无需修改源目标的代码了。只需要在代理类上增加就可以了
静态代理就是手动增加代理类，对每个需要代理的对象都增加一个代理类实现扩展功能。
动态代理就是无需声明式的创建java代理类，而是在运行过程中生成"虚拟"的代理类，被ClassLoader加载。从而避免了静态代理那样需要声明大量的代理类。
代理模式可以认为是Mybatis的核⼼使⽤的模式，正是由于这个模式，我们只需要编写Mapper.java接⼝，不需要实现，由Mybati s后台帮我们完成具体SQL的执⾏。 
当我们使⽤Configuration的getMapper⽅法时，会调⽤mapperRegistry.getMapper⽅法，⽽该⽅法⼜ 会调⽤ mapperProxyFactory.newInstance(sqlSession)来⽣成⼀个具体的代理
```java
public class MapperProxyFactory<T> {
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethod> methodCache = new
        ConcurrentHashMap<Method, MapperMethod>();
    public MapperProxyFactory(Class<T> mapperInterface) {
        this.mapperInterface = mapperInterface;
    }
    public Class<T> getMapperInterface() {
        return mapperInterface;
    }
    public Map<Method, MapperMethod> getMethodCache() {
        return methodCache;
        @SuppressWarnings("unchecked")
        protected T newInstance(MapperProxy<T> mapperProxy) {
            return (T)
                Proxy.newProxyInstance(mapperInterface.getClassLoader(), new
                                       Class[] { mapperInterface },
                                       mapperProxy);
        }
        public T newInstance(SqlSession sqlSession) {
            final MapperProxy<T> mapperProxy = new MapperProxy<T>(sqlSession,
                                                                  mapperInterface, methodCache);
            return newInstance(mapperProxy);
        }
 }
```
在这⾥，先通过T newInstance(SqlSession sqlSession)⽅法会得到⼀个MapperProxy对象，然后调⽤T newInstance(MapperProxy mapperProxy)⽣成代理对象然后返回。⽽查看MapperProxy的代码，可以看到如下内容：
```java
public class MapperProxy<T> implements InvocationHandler, Serializable {
 @Override
 public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
     try {
         if (Object.class.equals(method.getDeclaringClass())) {
             return method.invoke(this, args);
         } else if (isDefaultMethod(method)) {
             return invokeDefaultMethod(proxy, method, args);
         }
     } catch (Throwable t) {
         throw ExceptionUtil.unwrapThrowable(t);
     }
 }

```
⾮常典型的，该MapperProxy类实现了InvocationHandler接⼝，并且实现了该接⼝的invoke⽅法。通过这种⽅式，我们只需要编写Mapper.java接⼝类，当真正执⾏⼀个Mapper接⼝的时候，就会转发给 MapperProxy.invoke⽅法，⽽该⽅法则会调⽤后续的 
sqlSession.cud>executor.execute>prepareStatement 等⼀系列⽅法，完成 SQL 的执⾏和返回
#### JDK动态代理
核心是`java.lang.reflect.Proxy`和 `java.lang.reflect.InvocationHandler` 实现只需要创建代理类继承InvocationHandler，在代理类中通过`Proxy.newProxylnstance`实现获取代理类对象，并实现invoke方法，在invoke方法中增加增强方法即可
#### Cglib动态代理
Cglib是一个开源项目，它的底层是字节码处理框架ASM，Cglib提供了比jdk更为强大的动态代理。主要相比jdk动态代理的优势有：

- jdk动态代理只能基于接口，代理生成的对象只能赋值给接口变量，而Cglib就不存在这个问题，Cglib是通过生成子类来实现的，代理对象既可以赋值给实现类，又可以赋值给接口。
- Cglib速度比jdk动态代理更快，性能更好
