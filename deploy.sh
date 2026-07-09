#!/bin/bash
set -e

SERVER_USER="docoi"
SERVER_HOST="192.168.1.61"
IMAGE_NAME="checklist-tool"
CONTAINER_NAME="checklist-tool"
PORT="4399"
TAR_FILE="checklist-tool.tar.gz"

cd "$(dirname "$0")"

if [ ! -f "$TAR_FILE" ]; then
    echo "错误: 找不到 $TAR_FILE，请先运行 ./build.sh"
    exit 1
fi

echo "==> 上传镜像到 ${SERVER_USER}@${SERVER_HOST}..."
scp "$TAR_FILE" "${SERVER_USER}@${SERVER_HOST}:/tmp/"

echo ""
echo "==> 加载并启动容器..."
ssh "${SERVER_USER}@${SERVER_HOST}" << DEPLOY
set -e
echo "  加载镜像..."
sudo docker load -i /tmp/${TAR_FILE}
rm -f /tmp/${TAR_FILE}

echo "  停止旧容器..."
sudo docker stop ${CONTAINER_NAME} 2>/dev/null || true
sudo docker rm ${CONTAINER_NAME} 2>/dev/null || true

echo "  启动新容器..."
sudo docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${PORT}:4399 \
  ${IMAGE_NAME}

echo ""
echo "✅ 部署完成! http://${SERVER_HOST}:${PORT}"
echo ""
sudo docker ps --filter "name=${CONTAINER_NAME}"
DEPLOY

echo ""
echo "✅ 全部完成"
