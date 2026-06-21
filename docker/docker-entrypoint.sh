#!/bin/bash
set -e

echo "🚀 启动Tiny Blog容器..."

# 权限修复函数
fix_permissions() {
    echo "🔧 检查和修复权限..."
    
    # 获取用户 ID 和组 ID（支持环境变量或默认值）
    LOCAL_USER_ID=${USER_ID:-1001}
    LOCAL_GROUP_ID=${GROUP_ID:-1001}
    
    echo "  - 使用用户 ID: $LOCAL_USER_ID"
    echo "  - 使用组 ID: $LOCAL_GROUP_ID"
    
    # 更新用户和组 ID（如果与当前不同）
    if [ "$(id -u nextjs)" != "$LOCAL_USER_ID" ] || [ "$(id -g nextjs)" != "$LOCAL_GROUP_ID" ]; then
        echo "  - 更新用户权限..."
        # 删除现有用户和组
        deluser nextjs 2>/dev/null || true
        delgroup nodejs 2>/dev/null || true
        
        # 重新创建用户和组
        addgroup --system --gid $LOCAL_GROUP_ID nodejs
        adduser --system --uid $LOCAL_USER_ID --ingroup nodejs --shell /bin/bash nextjs
    fi
    
    # 权限已正确时跳过耗时的递归 chown/find
    permissions_ok=true
    for dir in "/app/content" "/app/config"; do
        if [ -d "$dir" ]; then
            owner=$(stat -c '%U:%G' "$dir" 2>/dev/null || echo "")
            if [ "$owner" != "nextjs:nodejs" ]; then
                permissions_ok=false
                break
            fi
        fi
    done

    if [ "$permissions_ok" = "true" ]; then
        echo "✅ 权限已正确，跳过修复"
        return
    fi

    # 确保关键目录存在并设置正确权限
    for dir in "/app/content" "/app/config"; do
        if [ -d "$dir" ]; then
            echo "  - 修复 $dir 权限..."
            chown -R nextjs:nodejs "$dir"
            # 设置适当的权限：目录 755，文件 644
            find "$dir" -type d -exec chmod 755 {} \;
            find "$dir" -type f -exec chmod 644 {} \;
        fi
    done
    
    echo "✅ 权限修复完成"
}

# 生成随机八位字符串的函数
generate_random_string() {
    # 使用 /dev/urandom 和 tr 生成8位随机字符串
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c8 2>/dev/null || echo "$(date +%N | cut -c1-8)"
}

# 检查目录权限
check_directory_permissions() {
    local dir=$1
    local required_user="nextjs"
    
    if [ -d "$dir" ]; then
        local owner=$(stat -c '%U' "$dir" 2>/dev/null || stat -f '%Su' "$dir" 2>/dev/null || echo "unknown")
        if [ "$owner" != "$required_user" ] && [ "$owner" != "unknown" ]; then
            echo "⚠️  目录 $dir 权限不匹配 (当前: $owner, 需要: $required_user)"
            return 1
        fi
    fi
    return 0
}

# 安全的文件写入函数
safe_write_file() {
    local file_path=$1
    local content=$2
    
    # 确保目录存在
    mkdir -p "$(dirname "$file_path")"
    
    # 写入文件
    echo "$content" > "$file_path"
    
    # 设置正确的所有者和权限
    chown nextjs:nodejs "$file_path"
    chmod 644 "$file_path"
}

# 初始化目录结构
init_directories() {
    echo "📁 初始化目录结构..."
    
    # 如果使用绑定挂载，确保数据目录结构存在
    # 检查是否为绑定挂载（目录存在但为空或权限不正确）
    local data_root=""
    
    # 尝试检测数据根目录（从挂载点向上查找）
    if [ -d "/app/content" ] && [ ! -d "/app/content/posts" ]; then
        # content 目录存在但没有子目录，可能是新的挂载点
        echo "  - 检测到新的内容挂载点，初始化子目录..."
    fi
    
    # 确保所有必要目录存在
    mkdir -p /app/content/posts
    mkdir -p /app/content/pages  
    mkdir -p /app/content/images
    mkdir -p /app/config
    
    echo "✅ 目录结构初始化完成"
}

# 初始化内容和配置
init_content() {
    echo "📝 检查内容和配置..."
    
    # 复制默认图片（如果存在且目标不存在）
    # 从构建阶段的 public/images 复制到 content/images 作为初始封面
    if [ -f "/app/public/images/hello-world.webp" ] && [ ! -f "/app/content/images/hello-world.webp" ]; then
        echo "🖼️ 复制默认封面图片..."
        cp /app/public/images/hello-world.webp /app/content/images/hello-world.webp
        chown nextjs:nodejs /app/content/images/hello-world.webp
        chmod 644 /app/content/images/hello-world.webp
    fi
    
    # 如果 posts 目录为空，创建示例文章
    if [ ! "$(ls -A /app/content/posts 2>/dev/null)" ]; then
        echo "✍️ 创建示例文章..."
        safe_write_file "/app/content/posts/hello-world.md" "---
title: \"Hello World\"
date: \"2024-01-01\"
tags: [\"博客\", \"欢迎\"]
description: \"欢迎来到我的博客！\"
cover: \"/api/images/hello-world.webp\"
published: true
---

# Hello World! 🎉

欢迎来到我的博客！这是使用 Next.js 14 构建的现代化博客系统。

## 特性

- ✨ 简洁优雅的设计
- 🚀 快速的页面加载
- 📱 完美的移动端体验
- 🌙 深色模式支持
- ⚡ ISR 增量静态再生
- 🏷️ 智能标签系统

## 开始写作

要添加新文章，只需在 \`content/posts/\` 目录下创建 Markdown 文件，格式如下：

\`\`\`markdown
---
title: \"文章标题\"
date: \"2024-01-01\"
tags: [\"标签1\", \"标签2\"]
description: \"文章描述\"
published: true
---

# 文章内容

这里写你的文章内容...
\`\`\`

## 技术栈

- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **Docker** - 容器化部署

开始你的写作之旅吧！ 🚀"
    fi
    
    # 如果 pages 目录为空，创建关于页面
    if [ ! "$(ls -A /app/content/pages 2>/dev/null)" ]; then
        echo "📄 创建关于页面..."
        
        safe_write_file "/app/content/pages/about-me.md" "# 关于我 👋

你好！欢迎来到我的个人博客。

## 简介

我是一名开发者，热爱技术和分享。这个博客是我记录学习和思考的地方。

## 兴趣领域

- 💻 Web 开发
- 🎯 技术架构  
- 📚 持续学习
- ✍️ 技术写作

## 技能栈

- **前端**: React, Next.js, TypeScript, Tailwind CSS
- **后端**: Node.js, Python
- **数据库**: PostgreSQL, MongoDB
- **工具**: Docker, Git, VS Code

## 联系方式

如果你想和我交流，欢迎通过页面底部的联系方式找到我！"
        
        safe_write_file "/app/content/pages/about-blog.md" "# 关于这个博客 📖

这是一个使用现代技术栈构建的个人博客系统。

## 设计理念

- **简洁至上**: 专注内容，去除不必要的装饰
- **阅读体验**: 优化排版和配色，提供舒适的阅读环境
- **响应式**: 在任何设备上都能提供良好的体验
- **性能优先**: 快速加载，流畅交互

## 技术特性

### 🏗️ 现代架构
- Next.js 14 App Router
- TypeScript 严格模式
- Tailwind CSS 原子化样式

### ⚡ 性能优化
- ISR (增量静态再生)
- 图片懒加载优化
- 代码分割和预取

### 🌙 用户体验
- 深色/浅色模式切换
- 移动端友好设计
- 快速搜索和筛选

### 🏷️ 内容管理
- Markdown 写作支持
- 智能标签系统
- 自动生成摘要和阅读时间

## 部署方式

博客支持 Docker 一键部署，具有良好的可扩展性和维护性。

---

感谢你的访问！希望你在这里找到有价值的内容。 ❤️"
    fi
    
    echo "✅ 内容目录初始化完成"
}

# 初始化配置
init_config() {
    echo "⚙️ 检查配置目录..."
    
    mkdir -p /app/config
    
    # 如果挂载的配置文件不存在，从构建时的配置复制
    if [ ! -f "/app/config/site.config.json" ]; then
        if [ -f "/app/config/site.config.json.backup" ]; then
            echo "📝 从备份恢复JSON配置文件..."
            cp /app/config/site.config.json.backup /app/config/site.config.json
            chown nextjs:nodejs /app/config/site.config.json
            chmod 644 /app/config/site.config.json
        else
            echo "📝 从构建时JSON配置复制到挂载目录..."
            # 优先从构建时的原始配置复制
            if [ -f "/app/config.original/site.config.json" ]; then
                cp /app/config.original/site.config.json /app/config/site.config.json
            else
                echo "📄 创建默认JSON配置文件..."
                # 生成随机的 secureEntrance 值
                RANDOM_SECURE_ENTRANCE=$(generate_random_string)
                safe_write_file "/app/config/site.config.json" '{
  "title": "Tiny Blog",
  "description": "😜Yes, I broke it. No, I didn'\''t mean to. Yes, I learned something.",
  "introduction": "\"Do not go gentle into that good night. Old age should burn and rave at close of day. Rage, rage against the dying of the light.\"",
  "author": {
    "name": "Unknown",
    "email": "blog@example.com",
    "github": "github-username"
  },
  "url": "https://your-blog.com",
  "social": {
    "github": "https://github.com/Tiny-Blog",
    "twitter": "https://twitter.com/username",
    "email": "mailto:someone@gmail.com"
  },
  "theme": {
    "primaryColor": "#3b82f6"
  },
  "nav": [
    { "name": "Home", "href": "/" },
    { "name": "Posts", "href": "/posts" },
    { "name": "Tags", "href": "/tags" },
    { "name": "About", "href": "/about" }
  ],
  "postsPerPage": 6,
  "excerptLength": 200,
  "secureEntrance": "'$RANDOM_SECURE_ENTRANCE'"
}'
            fi
            chown nextjs:nodejs /app/config/site.config.json
            chmod 644 /app/config/site.config.json
        fi
    else
        echo "✅ JSON配置文件已存在，跳过初始化"
    fi
    
    echo "✅ 配置初始化完成"
}

# 执行权限修复和初始化
fix_permissions
init_directories
init_content
init_config

echo "🎉 初始化完成，启动应用..."

if [ "$1" = "node" ] && [ "$2" = "server.js" ]; then
    exec su-exec nextjs /app/start-with-prewarm.sh
fi

# 使用 su-exec 以正确的用户身份启动应用
exec su-exec nextjs "$@"