#!/bin/bash
set -e

node server.js &
SERVER_PID=$!

prewarm() {
    for _ in $(seq 1 30); do
        if wget -q -O /dev/null http://127.0.0.1:3000/api/config 2>/dev/null; then
            echo "🔥 预热 API 缓存..."
            wget -q -O /dev/null http://127.0.0.1:3000/api/config &
            wget -q -O /dev/null http://127.0.0.1:3000/api/posts &
            return 0
        fi
        sleep 1
    done
    echo "⚠️ 预热超时，服务将继续运行"
}

prewarm &

wait $SERVER_PID
