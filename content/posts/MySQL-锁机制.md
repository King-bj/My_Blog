---
title: MySQL 锁机制完整笔记
date: "2025-04-20"
tags: [MySQL, 故障排查]
description: "MySQL 三级锁机制完整梳理：全局锁（备份）、表锁（MDL/意向锁）、行级锁（Record/Gap/Next-Key Lock），含间隙锁防幻读原理与临键锁边界分析。"
published: true
---

# MySQL 锁机制完整笔记

---

## 一、全局锁

**用途：** 全量备份时，保证所有表数据的一致性快照。

```sql
-- 加全局读锁（其他客户端只读，不可写）
FLUSH TABLES WITH READ LOCK;

-- 备份完成后解锁
UNLOCK TABLES;
```

**问题：** 全局锁代价很重，备份期间所有写操作被阻塞。

**推荐替代方案（InnoDB）：** 使用 `--single-transaction` 参数开启一致性事务快照，无需加全局锁：

```shell
mysqldump --single-transaction -u root -p your_db > backup.sql
```

---

## 二、表级锁（InnoDB）

### 1. 表锁

```sql
LOCK TABLES table_name READ;   -- 共享锁：其他客户端可读，不可写
LOCK TABLES table_name WRITE;  -- 排他锁：其他客户端不可读写
UNLOCK TABLES;
```

### 2. 元数据锁（MDL，隐式）

**目的：** 防止 DML（增删改查）和 DDL（修改表结构）并发冲突。

- 执行 `BEGIN` 后进行查询，自动加 MDL 共享锁，**无法修改表结构**，直到 `COMMIT` 后才释放
- DDL 操作需要 MDL 排他锁，会等待所有持有 MDL 共享锁的事务结束

> 生产中执行 `ALTER TABLE` 卡住，通常是有长事务持有 MDL 共享锁。检查方法：
> ```sql
> SELECT * FROM information_schema.INNODB_TRX;
> ```

### 3. 意向锁（IS / IX）

**目的：** 在行锁和表锁之间快速判断兼容性，避免逐行检查。

- `IS`（意向共享锁）：事务要加行级共享锁前，先在表级加 IS
- `IX`（意向排他锁）：事务要加行级排他锁前，先在表级加 IX
- IS 兼容表级共享锁；IX 不兼容表级排他锁

---

## 三、行级锁（InnoDB，基于索引）

行级锁都是加在**索引**上的，不存在索引时降级为表锁。

### 1. Record Lock（行锁）

在 RC 和 RR 隔离级别下，锁住具体的行记录，防止其他事务 UPDATE/DELETE 该行。

### 2. Gap Lock（间隙锁）

**仅在 RR 隔离级别下存在。**

锁住索引间的间隙（不含端点），防止其他事务在这个间隙 INSERT，从而**防止幻读**。

示例（id 索引：1, 4, 8, 12）：

```sql
-- 对 id = 9 加锁（9 不存在）
SELECT * FROM t WHERE id = 9 FOR UPDATE;
```

由于 9 不存在，落在 (8, 12) 间隙，加 Gap Lock。id 9、10、11 均无法被插入，但 8 和 12 可以修改。

### 3. Next-Key Lock（临键锁）

`Gap Lock + Record Lock` 的组合，锁住一个左开右闭区间 `(a, b]`。

RR 下范围查询默认使用临键锁：

```sql
-- 对 id >= 8 加锁
SELECT * FROM t WHERE id >= 8 FOR UPDATE;
```

- id = 8 上加 Record Lock
- (8, 12] 上加 Next-Key Lock
- (12, +∞) 上加 Next-Key Lock

> **临键锁优化为行锁的条件：** 等值查询命中唯一索引时，Next-Key Lock 退化为 Record Lock（因为唯一索引保证不会有新的相同值插入，间隙锁没有意义）。

---

## 四、死锁与排查

**常见死锁场景：** 两个事务分别持有对方需要的行锁，互相等待。

```sql
-- 查看最近一次死锁信息
SHOW ENGINE INNODB STATUS\G;

-- 查看当前锁等待
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

**预防：**
1. 保持一致的加锁顺序
2. 缩短事务持锁时间
3. 避免大事务，尽量按主键顺序操作
