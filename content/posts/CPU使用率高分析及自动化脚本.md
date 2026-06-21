---
title: CPU 使用率高的分析方法与自动化脚本
date: "2025-04-01"
tags: [Linux, 运维, 系统管理]
description: 运维日常里用得到的 Linux 操作记录。
published: true
---

# CPU 使用率高的分析方法与自动化脚本

> **背景：** 生产环境中我们维护着上百台 Linux 服务器，日常运维里这些场景出现得很频繁，下面是当时的完整记录与思考。

## 手动分析

### 1.top 命令获取到使用率最高的进程

```
top -o %CPU
```

![image-20250808144607217](media/image-20250808144607217.png)

### 2.获取该PID下使用率最高的线程

```
top -H -p 1437734
```

![image-20250808144818481](media/image-20250808144818481.png)

### 3.转换PID为十六进制

```
 printf '%xn' 1437747
```

![image-20250808145013346](media/image-20250808145013346.png)

### 4.jstack获取线程的堆栈快照

```
jstack 1437734 > 1437734.txt
```

### 5.查看jstack 堆栈信息分析

```
cat 1437734.txt |grep 15f033 -C 50
```

![image-20250808150346388](media/image-20250808150346388.png)

### 6.根据堆栈信息进行个性化分析

如该图中，堆栈信息显示为VM Thread占用高。怀疑方向有

| 🔁 偏向锁撤销过多 | 添加 `-XX:-UseBiasedLocking`                                 |
| ---------------- | ------------------------------------------------------------ |
| 🗑️ GC 频繁        | 优化堆大小、选择合适 GC（如 G1）、减少对象分配               |
| 📊 APM 代理太重   | 降低采样率、关闭不必要的监控模块                             |
| 🧵 Safepoint 太多 | 分析 `PrintSafepointStatistics`，避免 `System.gc()` 频繁调用 |
| 🛠️ 频繁诊断操作   | 避免频繁执行 `jstack`、`jmap`                                |

### 7.优先分析GC （通过AI分析）

```
jstat -gc 1437734 1000
```

![image-20250808150716965](media/image-20250808150716965.png)

#### 一、`jstat` 输出解读（关键字段）

| 字段         | 含义                    |
| ------------ | ----------------------- |
| **S0C/S1C**  | Survivor 区容量（KB）   |
| **S0U/S1U**  | Survivor 区使用量（KB） |
| **EC/EU**    | Eden 区容量 / 使用量    |
| **OC/OU**    | Old 区容量 / 使用量     |
| **MC/MU**    | Metaspace 容量 / 使用量 |
| **YGC/YGCT** | Young GC 次数 / 总耗时  |
| **FGC/FGCT** | Full GC 次数 / 总耗时   |
| **GCT**      | GC 总耗时（YGC + FGCT） |

------

#### 二、关键观察点

#### ✅ 1. **Old 区几乎 100% 满：**

```
OC: 699072.0 KB ≈ 682.7 MB
OU: 699071.9 ~ 699072.0 KB → 使用率 ≈ **100%**
```

👉 **Old 区已满，几乎无法容纳更多对象晋升。**

#### ✅ 2. **Full GC 非常频繁且耗时极长：**

- `FGC` 从 `4753` → `4756`，在短时间内增加了 3 次。
- `FGCT` 从 `10111.893` → `10118.215` 秒，即 **6 秒内发生了 3 次 Full GC，平均每次 2 秒左右**。
- 当前 `FGCT ≈ 10,118 秒 ≈ 2.8 小时`，说明这个进程已经累计执行了 **近 3 小时的 Full GC 时间**！

> ⚠️ **这是极其严重的 GC 问题！**

#### ✅ 3. **Young GC 正常？**

- `YGC: 823`, `YGCT: 16.812` 秒 → 平均每次 Young GC 仅 `20ms` 左右，频率也不高。
- 表面看 Young GC 不是问题。

#### ✅ 4. **Eden 和 Survivor 区状态**

- `EU = 279616.0` → Eden 已满，每次 Young GC 后对象几乎都尝试晋升。

- ```
  S1U ≈ 34943.9
  ```

  → Survivor 几乎也满了，说明：

  - 对象年龄增长很快
  - 大量对象在一次 GC 后就达到晋升阈值（`MaxTenuringThreshold`，默认 15）
  - 或者直接被动态晋升（空间担保失败）

####  三、与 `VM Thread` 高 CPU 的关系

你之前怀疑 `VM Thread`（nid=0x15f033）CPU 高，现在可以明确：

> ✅ **`VM Thread` 高 CPU 的根本原因是：频繁的 Full GC（CMS）需要它协调执行“Stop-The-World”操作。**

CMS GC 中 `VM Thread` 的职责：

- 暂停所有应用线程（Safepoint）
- 执行初始标记（Initial Mark）
- 执行重新标记（Remark）
- 执行清理（Sweep）
- 类卸载、回收元空间等

👉 每次 Full GC 都会唤醒 `VM Thread` 执行这些操作，而你每 **2 秒就一次 Full GC**，导致 `VM Thread` 持续忙碌，CPU 占用自然极高。

------

#### 📌 四、为什么 Old 区会这么满？

可能原因：

| 原因               | 说明                                                        |
| ------------------ | ----------------------------------------------------------- |
| 🐞 **内存泄漏**     | 某些对象被长期持有（如静态集合、缓存未清理、监听器未注销）  |
| 📈 **对象晋升过快** | Young 区太小或对象太大，导致对象很快进入 Old 区             |
| 🔁 **分配过快**     | 应用创建对象速度远大于 GC 回收能力                          |
| 🧱 **堆设置不合理** | Old 区太小，或整体堆太小                                    |
| 📡 **APM 代理开销** | PowerAPM 可能创建大量监控对象（如 trace、metric、日志缓冲） |

### 8.使用jmap生成hprof文件

```
jmap -dump:format=b,file=heap.hprof <pid>
```

### 9.使用jdk自带的jhat分析hprof文件

```
jhat -J-Xmx512M *.hprof
```

![image-20250808161730577](media/image-20250808161730577.png)

![image-20250808162643626](media/image-20250808162643626.png)

访问IP:7000

![image-20250808162713817](media/image-20250808162713817.png)

拖到最下面，点击查看byte等平台信息，不包含byte等平台信息

和堆的直方图

![image-20250808162807569](media/image-20250808162807569.png)

首先发现最大的占用是stracktraceElement

![image-20250808163503881](media/image-20250808163503881.png)

![image-20250808164441492](media/image-20250808164441492.png)

点击stracktraceElement ，拉到下方点击具体持有实例点击进去查看

![image-20250808164415101](media/image-20250808164415101.png)

这个 `StackTraceElement` 表示：

> 在 `RetryAndFollowUpInterceptor.java` 第 88 行的 `intercept()` 方法中，有一个异常被抛出或记录。

------

🔥问题定位： 应用在频繁调用 OkHttp，且请求失败或被重试 

1. `RetryAndFollowUpInterceptor` 是OkHttp 客户端的一个核心拦截器，负责：

- 失败重试（Retry）
- 重定向处理（Follow Redirect）

- 当网络请求失败（如超时、连接拒绝、5xx 错误）时，它会尝试重试。

最终定位原因：该服务调用了很多外部接口进行数据汇总展示，该环境大部分接口不通，导致频繁失败重试带来的cpu增长。

## 自动分析

 脚本：查找 CPU 使用率最高的 Java 线程及其堆栈 

```
#!/bin/bash

# +--------------------------------------------------+
# | 脚本：查找 CPU 使用率最高的 Java 线程及其堆栈     |
# | 输出：PID, TID, jstack 堆栈前后20行到日志文件      |
# +--------------------------------------------------+

set -euo pipefail

# 获取当前时间戳用于日志文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="high_cpu_thread_${TIMESTAMP}.log"

# 临时文件使用 PID 命名，避免混淆
PID_FILE=""
JSTACK_FILE=""
TOP_FILE=""

# 清理临时文件函数
cleanup() {
    [ -n "${TOP_FILE:-}" ] && rm -f "$TOP_FILE"
    [ -n "${JSTACK_FILE:-}" ] && rm -f "$JSTACK_FILE"
    [ -n "${PID_FILE:-}" ] && rm -f "$PID_FILE"
}
#trap cleanup EXIT

# 日志函数
log() {
    echo "[$(date)] $*" | tee -a "$LOG_FILE"
}

log "开始分析高 CPU 使用率的 Java 线程..."

# 1. 找出 CPU 使用率最高的 Java 进程的 PID
log "步骤1: 查找 CPU 使用率最高的 Java 进程..."

PID=$(ps -eo pid,ppid,cmd,%cpu --sort=-%cpu | grep java | grep -v grep | head -n1 | awk '{print $1}')

if [ -z "$PID" ]; then
    log "错误: 未找到正在运行的 Java 进程。"
    exit 1
fi

log "找到 Java 进程 PID: $PID"

# 定义临时文件路径（使用 PID 命名，清晰可查）
TOP_FILE="/tmp/top_threads.${PID}"
JSTACK_FILE="/tmp/jstack_dump.${PID}"
PID_FILE="/tmp/pidfile.${PID}"

# 2. 使用 top -H 找出该进程中 CPU 使用率最高的线程 TID
# 2. 使用 top -H 找出该进程中 CPU 使用率最高的线程 TID
log "步骤2: 查找该进程中 CPU 使用率最高的线程..."

log "调试: top 输出将保存到 $TOP_FILE"

# 使用 timeout 防止 top 卡死
if ! timeout 3 top -H -b -n 1 -p "$PID" > "$TOP_FILE" 2>&1; then
    log "错误: top 命令执行超时或失败。"
    log "top 错误输出预览:"
    cat "$TOP_FILE" | head -n 20 | tee -a "$LOG_FILE"
    exit 1
fi

if [ ! -s "$TOP_FILE" ]; then
    log "错误: top 输出为空。"
    exit 1
fi

log "top 输出已生成，大小: $(wc -c < "$TOP_FILE") 字节"

# 调试：预览 top 输出
log "调试: top 输出前15行预览:"
head -n 15 "$TOP_FILE" | tee -a "$LOG_FILE"

# === 关键修复：只提取 PID 行之后的非空行 ===
THREAD_LINES=$(awk '
/^ *PID / { 
    header_found = 1; 
    next 
}
header_found && NF > 0 { 
    print 
}
' "$TOP_FILE")

if [ -z "$THREAD_LINES" ]; then
    log "错误: 无法提取任何线程行（可能未找到 PID 标题行）。"
    cat "$TOP_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

log "调试: 提取到 $(echo "$THREAD_LINES" | wc -l) 个线程"

# 使用 awk 找出 %CPU 最高的线程（跳过非数字行）
TID_LINE=$(echo "$THREAD_LINES" | \
    awk '
    $9 ~ /^[0-9.]+$/ && $9+0 > max_cpu {
        max_cpu = $9+0;
        max_line = $0;
    }
    END { print max_line }
    ')

if [ -z "$TID_LINE" ]; then
    log "错误: 无法选出 CPU 最高的线程（TID_LINE 为空）。"
    log "调试: 提取的线程数据预览:"
    echo "$THREAD_LINES" | head -n 20 | tee -a "$LOG_FILE"
    exit 1
fi

log "调试: 选中的线程行: $TID_LINE"

# 提取 TID 和 CPU_USAGE
TID=$(echo "$TID_LINE" | awk '{print $1}')
CPU_USAGE=$(echo "$TID_LINE" | awk '{print $9}')

# 验证 TID 是否为数字
if ! [[ "$TID" =~ ^[0-9]+$ ]]; then
    log "错误: 解析出的 TID 不合法: $TID"
    log "完整行: $TID_LINE"
    exit 1
fi

log "找到最高 CPU 线程 TID: $TID, CPU 使用率: ${CPU_USAGE}%"

# 3. 将 TID 转换为 16 进制（jstack 中线程名显示为 hex）
TID_HEX=$(printf "%x" "$TID")
log "TID 的 16 进制表示: 0x$TID_HEX"

# 4. 使用 jstack 获取该 Java 进程的线程快照
log "步骤3: 执行 jstack 获取线程堆栈..."
log "调试: jstack 输出将保存到 $JSTACK_FILE"

if ! jstack "$PID" > "$JSTACK_FILE" 2>&1; then
    log "警告: jstack 执行失败，可能无权限或 JDK 未安装。"
    log "jstack 错误输出:"
    cat "$JSTACK_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# 5. 在 jstack 输出中查找包含 nid=0x<TID_HEX> 的线程栈
log "步骤4: 在 jstack 中查找线程堆栈（nid=0x$TID_HEX）..."

JSTACK_LINES=$(wc -l < "$JSTACK_FILE")
TARGET_LINE_NUM=$(grep -n "nid=0x$TID_HEX" "$JSTACK_FILE" | head -n1 | cut -d: -f1)

if [ -z "$TARGET_LINE_NUM" ]; then
    log "警告: 未在 jstack 输出中找到 TID 0x$TID_HEX 对应的线程。"
    log "建议手动运行: jstack $PID | grep -A 20 -B 20 'nid=0x$TID_HEX'"
    log "jstack 前 50 行预览:"
    head -n 50 "$JSTACK_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# 计算提取范围（前后各 20 行）
START_LINE=$((TARGET_LINE_NUM - 20))
END_LINE=$((TARGET_LINE_NUM + 20))

if [ $START_LINE -lt 1 ]; then START_LINE=1; fi
if [ $END_LINE -gt $JSTACK_LINES ]; then END_LINE=$JSTACK_LINES; fi

log "提取 jstack 中第 $START_LINE 到 $END_LINE 行（目标行: $TARGET_LINE_NUM）..."

# 6. 输出最终报告
{
    echo "==========================================="
    echo "高 CPU 使用率 Java 线程分析报告"
    echo "生成时间: $(date)"
    echo "==========================================="
    echo "Java 进程 PID: $PID"
    echo "高 CPU 线程 TID (10进制): $TID"
    echo "TID (16进制): 0x$TID_HEX"
    echo "CPU 使用率: ${CPU_USAGE}%"
    echo ""
    echo "jstack 中对应线程堆栈（前后 20 行）:"
    echo "-------------------------------------------"
    sed -n "${START_LINE},${END_LINE}p" "$JSTACK_FILE"
    echo "-------------------------------------------"
    echo "分析完成。"
} >> "$LOG_FILE"

log "✅ 分析完成！详细信息已保存到: $LOG_FILE"

# 输出日志尾部预览
echo ""
echo "日志文件预览（尾部 50 行）："
tail -n 50 "$LOG_FILE"
```
