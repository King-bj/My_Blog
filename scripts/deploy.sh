#!/bin/bash

# TinyBlog 一键部署脚本
# 作者: TinyBlog
# 功能: 自动化 Docker 容器部署

set -e  # 遇到错误立即退出

echo "======================================"
echo "   TinyBlog 一键部署脚本"
echo "======================================"
echo ""

# 生成随机八位字符串的函数
generate_random_string() {
    # 使用多种方法生成随机字符串，确保跨平台兼容性
    if command -v openssl &> /dev/null; then
        # 使用 openssl 生成随机字符，然后转换为字母数字
        openssl rand -base64 12 | tr -d '/+' | cut -c1-8 2>/dev/null
    elif [[ -e /dev/urandom ]]; then
        # 使用 /dev/urandom
        tr -dc 'A-Za-z0-9' </dev/urandom | head -c8 2>/dev/null
    else
        # 回退方案：使用时间戳和随机数组合
        local chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        local result=''
        for i in {1..8}; do
            local pos=$(( (RANDOM * ${#chars}) / 32768 ))
            result="${result}${chars:$pos:1}"
        done
        echo "$result"
    fi
}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 环境
check_docker() {
    log_info "检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        echo "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未启动，请启动 Docker 服务"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查 Docker Compose 环境
check_docker_compose() {
    log_info "检查 Docker Compose 环境..."
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        echo "安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_success "Docker Compose 环境检查通过 (使用: $COMPOSE_CMD)"
}

# 收集用户输入
collect_user_input() {
    log_info "请输入博客配置信息:"
    echo ""
    
    # 博客标题
    read -p "博客标题 (Blog Title): " BLOG_TITLE
    while [[ -z "$BLOG_TITLE" ]]; do
        log_warning "博客标题不能为空，请重新输入"
        read -p "博客标题 (Blog Title): " BLOG_TITLE
    done
    
    # GitHub URL
    read -p "GitHub URL (可选, 例: https://github.com/username): " GITHUB_URL
    
    # Email
    read -p "Email (可选, 例: your@email.com): " EMAIL
    
    # Twitter URL
    read -p "Twitter URL (可选, 例: https://twitter.com/username): " TWITTER_URL
    
    # 安全入口码
    echo ""
    log_info "安全入口码设置 (用于管理后台等安全功能)"
    read -p "安全入口码 (8位字符串，留空自动生成): " SECURE_ENTRANCE
    if [[ -z "$SECURE_ENTRANCE" ]]; then
        SECURE_ENTRANCE=$(generate_random_string)
        log_info "自动生成的安全入口码: $SECURE_ENTRANCE"
    elif [[ ${#SECURE_ENTRANCE} -ne 8 ]]; then
        log_warning "建议使用8位字符串，当前长度: ${#SECURE_ENTRANCE}"
        read -p "是否使用自动生成的8位码? (y/N): " USE_AUTO
        if [[ "$USE_AUTO" =~ ^[Yy]$ ]]; then
            SECURE_ENTRANCE=$(generate_random_string)
            log_info "自动生成的安全入口码: $SECURE_ENTRANCE"
        fi
    fi
    
    # 数据目录
    read -p "博客数据存储目录 (默认: ./blog-data): " DATA_PATH
    if [[ -z "$DATA_PATH" ]]; then
        DATA_PATH="./blog-data"
    fi
    
    # 端口
    read -p "服务端口 (默认: 3131): " BLOG_PORT
    if [[ -z "$BLOG_PORT" ]]; then
        BLOG_PORT="3131"
    fi
    
    echo ""
    log_info "配置信息确认:"
    echo "  博客标题: $BLOG_TITLE"
    echo "  GitHub URL: ${GITHUB_URL:-未设置}"
    echo "  Email: ${EMAIL:-未设置}"
    echo "  Twitter URL: ${TWITTER_URL:-未设置}"
    echo "  安全入口码: $SECURE_ENTRANCE"
    echo "  数据目录: $DATA_PATH"
    echo "  服务端口: $BLOG_PORT"
    echo ""
    
    read -p "确认以上配置? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
}

# 创建 .env 文件
create_env_file() {
    log_info "创建 .env 配置文件..."
    
    # 固定使用 1001 作为用户和组 ID
    USER_ID=1001
    GROUP_ID=1001
    
    # 生成随机密钥
    REVALIDATE_SECRET=$(openssl rand -hex 32 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
    
    cat > .env << EOF
# Docker 部署环境变量配置
# 由 TinyBlog 一键部署脚本自动生成

# 用户权限配置
USER_ID=$USER_ID
GROUP_ID=$GROUP_ID

# 博客基础配置
BLOG_PORT=$BLOG_PORT
DATA_PATH=$DATA_PATH

# 重新验证密钥
REVALIDATE_SECRET=$REVALIDATE_SECRET

# 社交媒体链接
GITHUB_URL=$GITHUB_URL
EMAIL=$EMAIL
TWITTER_URL=$TWITTER_URL

# 站点 URL (生产环境请修改)
SITE_URL=http://localhost:$BLOG_PORT
EOF
    
    log_success ".env 文件创建完成"
}

# 创建 docker-compose.yml 文件
create_docker_compose() {
    log_info "创建 docker-compose.yml 文件..."
    
    cat > docker-compose.yml << 'EOF'
services:
  blog:
    build:
      context: .
      dockerfile: docker/Dockerfile
      args:
        # 使用宿主机当前用户的 UID/GID（Linux 系统）
        # macOS/Windows 可以使用默认值 1001
        USER_ID: ${USER_ID:-1001}
        GROUP_ID: ${GROUP_ID:-1001}
    image: tiny-blog:local
    container_name: tiny-blog
    ports:
      - "${BLOG_PORT:-3131}:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - REVALIDATE_SECRET=${REVALIDATE_SECRET}
      - USER_ID=${USER_ID:-1001}
      - GROUP_ID=${GROUP_ID:-1001}
      # 生产环境配置
      - SITE_URL=${SITE_URL}
      - GITHUB_URL=${GITHUB_URL:-}
      - EMAIL=${EMAIL:-}
      - TWITTER_URL=${TWITTER_URL:-}
    volumes:
      # 使用单一数据目录，在其下创建 content, config 子目录
      # images 存储在 content/images 中，通过 /api/images API 访问
      - ${DATA_PATH:-./blog-data}/content:/app/content
      - ${DATA_PATH:-./blog-data}/config:/app/config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - blog-network
    # 生产环境资源限制
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  blog-network:
    driver: bridge
EOF
    
    log_success "docker-compose.yml 文件创建完成"
}

# 创建数据目录结构
create_data_directories() {
    log_info "创建数据目录结构..."
    
    mkdir -p "$DATA_PATH"/{content/{posts,pages,images},config}
    
    # 如果源项目中有内容，复制示例内容
    if [[ -d "content" ]]; then
        log_info "复制示例内容到数据目录..."
        cp -r content/* "$DATA_PATH/content/" 2>/dev/null || true
    fi
    
    if [[ -d "config" ]]; then
        log_info "复制配置文件到数据目录..."
        cp -r config/* "$DATA_PATH/config/" 2>/dev/null || true
    fi
    
    # 设置目录权限（固定使用 1001:1001）
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        chown -R 1001:1001 "$DATA_PATH" 2>/dev/null || true
    fi
    
    log_success "数据目录结构创建完成: $DATA_PATH"
}

# 启动 Docker 服务
start_docker_service() {
    log_info "启动 Docker 服务..."

    # 停止可能存在的旧容器
    $COMPOSE_CMD down 2>/dev/null || true

    # 使用本地代码构建镜像（不拉取远程镜像）
    log_info "使用本地代码构建 Docker 镜像..."
    $COMPOSE_CMD build --pull=false

    # 启动服务
    $COMPOSE_CMD up -d

    log_success "Docker 服务启动完成"
}

# 等待服务启动
wait_for_service() {
    log_info "等待服务启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$BLOG_PORT" > /dev/null 2>&1; then
            log_success "服务启动成功! 🎉"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "服务启动超时，请检查日志"
            echo "查看日志命令: $COMPOSE_CMD logs -f"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# 更新配置文件
update_blog_config() {
    log_info "更新博客配置..."
    
    local config_file="$DATA_PATH/config/site.config.json"
    
    if [[ -f "$config_file" ]]; then
        # 使用 jq 更新 JSON 文件，如果没有 jq 则使用 sed
        if command -v jq &> /dev/null; then
            # 创建临时文件
            local temp_file=$(mktemp)
            jq --arg title "$BLOG_TITLE" \
               --arg secureEntrance "$SECURE_ENTRANCE" \
               '.title = $title | .secureEntrance = $secureEntrance' \
               "$config_file" > "$temp_file"
            mv "$temp_file" "$config_file"
        else
            # 使用 sed 替换 (简单方式，假设字段在第一层)
            sed -i.bak "s/\"title\":\s*\"[^\"]*\"/\"title\": \"$BLOG_TITLE\"/" "$config_file"
            sed -i.bak "s/\"secureEntrance\":\s*\"[^\"]*\"/\"secureEntrance\": \"$SECURE_ENTRANCE\"/" "$config_file"
            rm -f "$config_file.bak"
        fi
        
        log_success "配置已更新:"
        log_success "  博客标题: $BLOG_TITLE"
        log_success "  安全入口码: $SECURE_ENTRANCE"
        
        # 触发配置重载
        if curl -f -s -X POST "http://localhost:$BLOG_PORT/api/config/reload" \
           -H "Authorization: Bearer $REVALIDATE_SECRET" \
           -H "Content-Type: application/json" > /dev/null 2>&1; then
            log_success "配置已重新加载"
        else
            log_warning "配置重载失败，请稍后手动刷新页面"
        fi
    else
        log_warning "配置文件不存在，请手动创建: $config_file"
    fi
}

# 显示部署结果
show_deployment_result() {
    echo ""
    echo "======================================"
    echo "   🎉 部署完成!"
    echo "======================================"
    echo ""
    echo "📋 服务信息:"
    echo "  • 博客地址: http://localhost:$BLOG_PORT"
    echo "  • 数据目录: $DATA_PATH"
    echo "  • 容器名称: tiny-blog"
    echo ""
    echo "🔐 安全信息:"
    echo "  • 安全入口码: $SECURE_ENTRANCE"
    echo "  • 重载密钥: $REVALIDATE_SECRET"
    echo ""
    echo "🛠 常用命令:"
    echo "  • 查看状态: $COMPOSE_CMD ps"
    echo "  • 查看日志: $COMPOSE_CMD logs -f"
    echo "  • 停止服务: $COMPOSE_CMD down"
    echo "  • 重启服务: $COMPOSE_CMD restart"
    echo ""
    echo "📝 内容管理:"
    echo "  • 文章目录: $DATA_PATH/content/posts/"
    echo "  • 页面目录: $DATA_PATH/content/pages/"
    echo "  • 图片目录: $DATA_PATH/content/images/"
    echo "  • 配置文件: $DATA_PATH/config/site.config.json"
    echo ""
    echo "💡 提示: 编辑 Markdown 文件后，刷新浏览器即可看到更新!"
    echo "🔑 请妥善保存安全入口码，它将用于管理后台等安全功能!"
    echo ""
}

# 主函数
main() {
    # 检查环境
    check_docker
    check_docker_compose
    
    # 收集用户输入
    collect_user_input
    
    # 创建配置文件
    create_env_file
    create_docker_compose
    
    # 创建数据目录
    create_data_directories
    
    # 启动服务
    start_docker_service
    
    # 等待服务启动
    wait_for_service
    
    # 更新博客配置
    update_blog_config
    
    # 显示结果
    show_deployment_result
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi