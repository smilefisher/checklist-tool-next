#!/bin/bash
set -e

IMAGE_NAME="checklist-tool"

cd "$(dirname "$0")"

# 确保当前用户有 docker 权限
if ! docker ps &>/dev/null; then
    if groups | grep -q docker; then
        DOCKER="docker"
    else
        DOCKER="sudo docker"
    fi
else
    DOCKER="docker"
fi

echo "==> 构建 Docker 镜像（多阶段构建：安装依赖 → 编译 → 打包运行）..."
$DOCKER build -f Dockerfile -t ${IMAGE_NAME} .

echo "==> 导出镜像..."
rm -f checklist-tool.tar.gz
$DOCKER save ${IMAGE_NAME} | gzip > checklist-tool.tar.gz

echo ""
echo "✅ 构建完成: checklist-tool.tar.gz ($(du -h checklist-tool.tar.gz | cut -f1))"
echo "   运行 ./deploy.sh 上传并启动"
