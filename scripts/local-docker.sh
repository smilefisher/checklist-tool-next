#!/bin/bash
# 本地 Docker 运行辅助脚本（MySQL 8 + 应用容器）
#   ./scripts/local-docker.sh up       构建并启动整套（默认）
#   ./scripts/local-docker.sh dev      只启动 MySQL，供本机 pnpm dev 使用
#   ./scripts/local-docker.sh down     停止并移除容器（保留数据库数据）
#   ./scripts/local-docker.sh reset    停止并删除数据库数据卷（数据会丢）
#   ./scripts/local-docker.sh logs     跟踪应用日志（可加服务名：logs mysql）
#   ./scripts/local-docker.sh mysql    进入 MySQL 命令行
#   ./scripts/local-docker.sh ps       查看容器状态
set -euo pipefail

cd "$(dirname "$0")/.."

# 自动判断是否需要 sudo（当前用户不在 docker 组时需要）
if docker ps &>/dev/null; then
  DOCKER="docker"
elif groups | grep -qw docker; then
  DOCKER="docker"
else
  DOCKER="sudo docker"
fi
COMPOSE="$DOCKER compose -f docker-compose.yml"

APP_PORT="${APP_PORT:-4399}"
MYSQL_HOST_PORT="${MYSQL_HOST_PORT:-3307}"
DB_NAME="${DB_NAME:-checklist}"
DB_PASSWORD="${DB_PASSWORD:-123456}"

wait_mysql() {
  local cid status
  cid=$($COMPOSE ps -q mysql)
  if [ -z "$cid" ]; then
    echo "mysql 容器没有启动，查看日志：$COMPOSE logs mysql" >&2
    exit 1
  fi
  printf '等待 MySQL 就绪'
  for _ in $(seq 1 60); do
    status=$($DOCKER inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid" 2>/dev/null || echo missing)
    if [ "$status" = "healthy" ]; then
      echo " ✓"
      return 0
    fi
    printf '.'
    sleep 2
  done
  echo
  echo "MySQL 未在 120s 内就绪：$COMPOSE logs mysql" >&2
  exit 1
}

usage() {
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
}

cmd="${1:-up}"
shift || true

case "$cmd" in
  up)
    echo "==> 构建并启动 MySQL + 应用..."
    $COMPOSE up -d --build
    wait_mysql
    echo ""
    echo "应用:  http://localhost:${APP_PORT}"
    echo "MySQL: 127.0.0.1:${MYSQL_HOST_PORT}  (user=root password=${DB_PASSWORD} db=${DB_NAME})"
    echo "日志:  ./scripts/local-docker.sh logs"
    ;;
  dev)
    echo "==> 只启动 MySQL..."
    $COMPOSE up -d mysql
    wait_mysql
    echo ""
    echo "MySQL 已就绪，接着在另一个终端执行："
    echo "  DB_HOST=127.0.0.1 DB_PORT=${MYSQL_HOST_PORT} DB_USER=root DB_PASSWORD=${DB_PASSWORD} DB_NAME=${DB_NAME} pnpm dev"
    ;;
  down)
    $COMPOSE down
    ;;
  reset)
    read -r -p "这会删除本地 MySQL 数据卷（数据不可恢复），输入 yes 确认: " ans
    if [ "$ans" != "yes" ]; then
      echo "已取消"
      exit 1
    fi
    $COMPOSE down -v
    echo "已删除容器和数据卷，下次 up 会重新初始化 schema/seed"
    ;;
  logs)
    [ "$#" -eq 0 ] && set -- app
    $COMPOSE logs -f --tail=100 "$@"
    ;;
  mysql)
    $COMPOSE exec mysql mysql -uroot -p"${DB_PASSWORD}" "${DB_NAME}"
    ;;
  ps | status)
    $COMPOSE ps
    ;;
  help | -h | --help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
