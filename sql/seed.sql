-- 初始化示例数据

USE checklist;

-- 插入示例 Checklist
INSERT INTO checklist_items (id, title, type, priority, description, code, code_language, is_active, created_at) VALUES
('cl-001', '数据库配置变更', 'config', 'high', '修改应用配置文件中的数据库连接信息', 'db:
  host: ${DB_HOST}
  port: ${DB_PORT}
  database: ${DB_NAME}
  username: ${DB_USER}
  password: ${DB_PASSWORD}', 'yaml', TRUE, NOW()),

('cl-002', 'Redis 配置更新', 'config', 'medium', '更新 Redis 缓存配置', 'redis:
  host: ${REDIS_HOST}
  port: ${REDIS_PORT}
  password: ${REDIS_PASSWORD}
  db: 0', 'yaml', TRUE, NOW()),

('cl-003', '创建用户表', 'sql', 'high', '在发布环境中创建用户表结构', '-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX idx_users_username ON users(username);', 'sql', TRUE, NOW()),

('cl-004', '数据迁移脚本', 'sql', 'high', '迁移历史数据到新表结构', '-- 迁移用户数据
INSERT INTO users_new (id, username, email)
SELECT id, name, email FROM users_old WHERE status = 1;', 'sql', TRUE, NOW()),

('cl-005', '前端资源部署', 'deploy', 'high', '部署前端静态资源到 CDN', '#!/bin/bash
npm run build
aws s3 sync dist/ s3://your-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"', 'shell', TRUE, NOW()),

('cl-006', '后端服务部署', 'deploy', 'high', '部署后端服务到 Kubernetes', 'kubectl apply -f deployment.yaml
kubectl set image deployment/app app=your-image:tag
kubectl rollout status deployment/app', 'shell', TRUE, NOW()),

('cl-007', '重启 API 服务', 'restart', 'medium', '重启 API 服务以加载新配置', 'kubectl rollout restart deployment/api
kubectl wait --for=condition=ready pod -l app=api --timeout=60s', 'shell', TRUE, NOW()),

('cl-008', '清理缓存', 'other', 'low', '清理应用缓存', 'redis-cli FLUSHDB
rm -rf /var/cache/app/*', 'shell', TRUE, NOW()),

('cl-009', '环境变量配置', 'config', 'high', '配置生产环境环境变量', 'APP_ENV=production
LOG_LEVEL=info
ENABLE_CACHE=true
MAX_CONNECTIONS=100', 'shell', TRUE, NOW()),

('cl-010', '健康检查验证', 'other', 'medium', '验证服务健康状态', 'curl -f http://localhost:8080/health || exit 1
curl -f http://localhost:8080/api/ping || exit 1', 'shell', TRUE, NOW());

-- 插入示例发布清单
INSERT INTO releases (id, name, version, status, description, created_at) VALUES
('rel-001', '用户模块 v2.0 发布', 'v2.0.0', 'draft', '包含用户表结构变更和新的用户模块功能', NOW()),

('rel-002', '缓存优化版本', 'v1.5.0', 'in_progress', 'Redis 缓存配置优化和缓存清理策略更新', NOW());
