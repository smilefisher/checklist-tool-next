-- 本地/Demo 示例数据（可选）
-- Docker Compose 首次初始化时会自动执行；不需要示例数据可删除 docker-compose.yml 里对应挂载。
-- 注意：依赖 sql/schema.sql 先执行。

-- 强制按 utf8mb4 解析本文件，避免中文乱码
SET NAMES utf8mb4;

INSERT INTO checklist_items (id, title, priority, description, is_active, is_deleted) VALUES
(1, '数据库配置变更', 'high', '修改应用配置文件中的数据库连接信息', TRUE, FALSE),
(2, '创建用户表', 'medium', '在发布环境创建用户表结构', TRUE, FALSE),
(3, '服务重启', 'low', '发布完成后重启应用服务并观察日志', TRUE, FALSE);

INSERT INTO checklist_changes (checklist_item_id, type, description, code, code_language, sort_order) VALUES
(1, 'config', '修改 db.yaml 中的连接信息', 'db:\n  host: 127.0.0.1\n  port: 3306\n  database: checklist\n  username: root\n  password: ******', 'yaml', 0),
(1, 'deploy', '确认配置中心已同步', 'curl -s http://config.internal/api/reload', 'shell', 1),
(2, 'sql', '建表语句', 'CREATE TABLE IF NOT EXISTS users (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(64) NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);', 'sql', 0),
(3, 'restart', '滚动重启', 'kubectl rollout restart deploy/checklist-tool', 'shell', 0);

INSERT INTO releases (id, name, version, status, description, is_deleted) VALUES
(1, '示例发布单', 'v1.0.0', 'draft', '本地环境示例数据，可直接删除', FALSE);

INSERT INTO release_items (release_id, checklist_item_id, is_checked, checked_at, note, sort_order) VALUES
(1, 1, FALSE, NULL, '', 0),
(1, 2, TRUE, NOW(), '已在测试环境验证', 1);
