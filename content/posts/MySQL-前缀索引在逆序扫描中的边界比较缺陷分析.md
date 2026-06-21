---
title: MySQL 前缀索引在逆序扫描中的边界比较缺陷分析
date: "2025-12-08"
tags: [数据库, MySQL]
description: "——基于 MySQL 8.0.35 及更早版本的执行引擎行为 适用版本：MySQL 8.0.0 ~ 8.0.35 修复版本：MySQL 8.0.36（Commit: a5f3f3d3a2b） 影响范围：使用前缀索引（Pr..."
published: true
---

# MySQL 前缀索引在逆序扫描中的边界比较缺陷分析

> **背景：** 项目数据量逐步增长后，数据库层成为性能与一致性问题最集中的地方，下面是当时的完整记录与思考。

**——基于 MySQL 8.0.35 及更早版本的执行引擎行为**

**适用版本**：MySQL 8.0.0 ~ 8.0.35
**修复版本**：MySQL 8.0.36（Commit: `a5f3f3d3a2b`）
**影响范围**：使用前缀索引（Prefix Index）且执行逆序索引扫描（Reverse Index Scan）的复合索引查询

------

## 一、问题背景

在 MySQL 8.0.35 及更早版本中，当满足以下条件时，可能出现**满足 WHERE 条件的行未被返回**的现象：

- 表使用 `utf8mb4` 字符集；
- 存在复合索引，其中包含前缀索引列（如 `col(N)`）；
- 查询条件覆盖该前缀列及其后续列；
- 执行计划使用逆序索引扫描（`ORDER BY ... DESC` 且索引可覆盖排序）；
- 存储引擎为 InnoDB，表为分区表（非必须，但显著提升触发概率）。

该问题表现为：

> **相同查询，正序（ASC）可返回结果，逆序（DESC）返回空集**，且无任何错误提示。

------

## 二、复现场景

### 1. 表结构与索引

```
CREATE TABLE ttb2 (
  c1 INT PRIMARY KEY,
  c2 VARCHAR(6),
  c3 VARCHAR(6),
  c4 VARCHAR(6),
  KEY idx (c3(3), c4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  PARTITION BY RANGE(c1) (
    PARTITION p0 VALUES LESS THAN (100),
    PARTITION p1 VALUES LESS THAN (200)
  );
```

### 2. 数据准备

```
INSERT INTO ttb2 VALUES
(1,   'xx', 'aaaxxx', 'aa'),
(2,   'xx', 'aaafff', NULL),
(110, 'yy', 'aaa',    'aa'),
(111, 'yy', 'aaammm', 'aa');
```

### 3. 多种查询场景测试

#### 场景 A：完整字段匹配 + 完整排序（原始场景）

```
SELECT * FROM ttb2 
WHERE c3 = 'aaa' AND c4 = 'aa'
ORDER BY c3 DESC, c4 DESC, c1 DESC;
```

- **结果**：Empty set

- 执行计划

  ```
  type: index
  key: idx
  Extra: Using where; Using index
  ```

#### 场景 B：仅匹配索引字段 + 逆序排序

```
SELECT c3, c4 FROM ttb2 
WHERE c3 = 'aaa' AND c4 = 'aa'
ORDER BY c3 DESC, c4 DESC;
```

- **结果**：Empty set
- **说明**：即使为覆盖索引，仍触发问题。

#### 场景 C：仅按主键逆序（最隐蔽）

```
SELECT * FROM ttb2 
WHERE c3 = 'aaa' AND c4 = 'aa'
ORDER BY c1 DESC;
```

- **结果**：Empty set
- **关键点**：`c1` 不在索引中，但优化器仍选择逆序索引扫描（因分区键为 `c1`，且从高分区向低分区扫描），导致进入问题路径。

#### 场景 D：正序扫描（对比）

```
SELECT * FROM ttb2 
WHERE c3 = 'aaa' AND c4 = 'aa'
ORDER BY c1 ASC;
```

- **结果**：返回 `c1=110` 的行
- **执行计划**：可能使用正序索引扫描或 `filesort`，但不进入 `cmp_max` 边界误判路径。

#### 场景 E：强制不走索引

```
SELECT * FROM ttb2 USE INDEX()
WHERE c3 = 'aaa' AND c4 = 'aa'
ORDER BY c1 DESC;
```

- **结果**： 可返回数据 

------

## 三、根本原理：`cmp_max` 在前缀比较中的边界缺陷

### 1. 逆序扫描的终止条件

在 `ReverseIndexRangeScanIterator` 中，扫描器从索引末尾向前推进，需判断当前记录是否仍在目标范围内。

对于等值条件 `c3 = 'aaa'`，扫描器维护一个“下界”判断：

> 若当前记录的 `c3(3)` < `'aaa'`，则已退出目标范围，终止扫描。

该比较由 `Field_varstring::cmp_max(uint32 prefix_len)` 执行。

------

### 2. `cmp_max` 的实现逻辑

`cmp_max` 的设计目标是：**比较两个字符串的前 `N` 个字符**，但其实际行为是：

> **按字节长度截断后进行 memcmp 比较**，**不保证字符边界对齐**。

其调用形式为：

```
int cmp = cmp_max(3);  // 比较前3个字符
```

但在内部，它等价于：

```
int cmp = memcmp(str1, str2, 3);  // 仅比较前3字节
```

------

### 3. 问题核心：`'aaa'` 与 `'aaaxxx'` 的比较

考虑两个值：

- `str1 = "aaa"`（长度3，3字节）
- `str2 = "aaaxxx"`（长度6，6字节）

在索引中，两者均存储为前3字节：`0x61 61 61`。

但在 `cmp_max` 的实现中，存在一个**边界处理缺陷**：

当比较 `"aaa"` 与 `"aaaxxx"` 时，`cmp_max` 会：

1. 截取 `str1` 前3字节 → `61 61 61`
2. 截取 `str2` 前3字节 → `61 61 61`
3. `memcmp` 返回 0 → 相等

**看似正确**。

但问题出现在**范围扫描的“下界”判断逻辑**中。在某些代码路径（如 `key_rec_cmp` 调用栈中），`cmp_max` 被用于判断：

> “目标字符串是否严格小于当前记录的前缀？”

由于 `cmp_max` 无法区分：

- `"aaa"` 是一个**完整字符串**
- `"aaaxxx"` 是一个**被截断的长字符串**

在某些优化分支中，系统可能错误推断：

> “`'aaa'` 作为完整字符串，其“前缀完整性”低于 `'aaaxxx'`，因此应排在后面。”

这种推断**并无规范依据**，属于实现层面的逻辑偏差。

------

### 4. 官方修复方案

MySQL 8.0.36 引入 `cmp_prefix_key_rec` 替代 `cmp_max` 的部分调用，其行为为：

> **先计算前 N 个字符在当前字符集下的总字节数，再进行完整比较**。

例如：

- 对 `utf8mb4`，前3个 ASCII 字符 = 3 字节；
- 比较时使用 `memcmp(str1, str2, 3)`，但确保 `str1` 和 `str2` 的长度计算基于字符而非字节。

这避免了因字符串长度差异导致的边界误判。

------

## 四、规避策略

| 策略                     | 说明                                                  |
| ------------------------ | ----------------------------------------------------- |
| **升级至 MySQL 8.0.36+** | 最彻底解决方案，已修复 `cmp_prefix_key_rec` 逻辑      |
| **避免前缀索引**         | 对短字符串字段（如 < 20 字符）使用完整索引            |
| **使用生成列**           | `ADD COLUMN c3_pre AS (LEFT(c3, 3)) STORED`，再建索引 |
| **避免逆序扫描**         | 使用游标分页（Cursor Pagination）替代 `OFFSET + DESC` |

------

## 五、结论

该问题本质是：

> **`Field_varstring::cmp_max` 在逆序索引扫描中，因按字节截断且未区分“完整字符串”与“截断字符串”，导致边界判断错误，使扫描器提前终止，遗漏本应返回的记录**。

其触发不依赖于 `ORDER BY` 是否包含前缀列，而取决于：

1. 是否使用逆序索引扫描；
2. 是否调用 `cmp_max` 进行前缀比较；
3. 是否存在长度不同的字符串共享相同前缀。

## 六、参考链接

https://bugs.mysql.com/bug.php?id=114783
