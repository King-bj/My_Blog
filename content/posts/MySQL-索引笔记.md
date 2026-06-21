---
title: MySQL 索引核心笔记
date: "2025-12-26"
tags: [数据库, MySQL]
description: 查看表中索引：show index from table 多列排序需要用组合索引 多列排序遵循最左前缀原则 多列排序升降序需要一致 模糊查询需要遵循字符串最左前缀原则（字符串必须是精确字符） 组合索引需要遵循最左前缀原则...
published: true
---

# MySQL 索引核心笔记

> **背景：** 项目数据量逐步增长后，数据库层成为性能与一致性问题最集中的地方，下面是当时的完整记录与思考。

查看表中索引：show index from table
多列排序需要用组合索引
多列排序遵循最左前缀原则
多列排序升降序需要一致
模糊查询需要遵循字符串最左前缀原则（字符串必须是精确字符）
组合索引需要遵循最左前缀原则
函数用在列上索引失效，用在值上索引有效
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445605149-448953a5-70c5-4ee9-b5c8-7fae77f912fd.png#clientId=u443a1f46-9959-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=72&id=u6d23a86a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=143&originWidth=894&originalType=binary&ratio=1&rotation=0&showTitle=false&size=70704&status=done&style=none&taskId=ue61f55bb-583c-4710-af19-258d84cf480&title=&width=447)
隐式转换会导致索引失效
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445620483-d4b9f195-2a72-425e-afeb-62dcf7a90a9f.png#clientId=u443a1f46-9959-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=77&id=u32954f58&margin=%5Bobject%20Object%5D&name=image.png&originHeight=154&originWidth=813&originalType=binary&ratio=1&rotation=0&showTitle=false&size=70893&status=done&style=none&taskId=u24ffe8e4-2b78-4575-96a5-b846dfe9e43&title=&width=406.5)
组合索引建立顺序的字段都得出现，不出现的话会导致后续条件失效
索引条件下推：extra列出现 index condiction说明利用了索引条件下推
![image.png](https://cdn.nlark.com/yuque/0/2022/png/21870099/1653445628018-45704534-bb32-4336-a4af-3b6743328a22.png#clientId=u443a1f46-9959-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=87&id=udadb0fe2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=174&originWidth=1017&originalType=binary&ratio=1&rotation=0&showTitle=false&size=119675&status=done&style=none&taskId=ua720d43f-cf08-4340-82b5-793f2073260&title=&width=508.5)

二级索引覆盖：Extra出现Using index 说明出现索引覆盖
查询结果字段都包含在二级索引里，不需要再调用主键索引去二次查询，效率更高
表连接需要在连接字段上给建立索引
索引是否真正利用了还是要看索引计划，不一定判断就正确
