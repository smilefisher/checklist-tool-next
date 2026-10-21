-- Checklist Tool 数据库结构（与当前代码一致的版本）
-- 用法：先建库，再导入本文件
--   mysql -h 127.0.0.1 -P 3307 -u root -p -e "CREATE DATABASE IF NOT EXISTS checklist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
--   mysql -h 127.0.0.1 -P 3307 -u root -p checklist < sql/schema.sql
-- Docker Compose 启动时会自动执行本文件（见 docker-compose.yml）。

-- Checklist 池表
CREATE TABLE IF NOT EXISTS checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  title VARCHAR(255) NOT NULL COMMENT '标题',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' COMMENT '优先级: high(高), medium(中), low(低)',
  description TEXT COMMENT '整体描述',
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已删除（软删除）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_checklist_items_is_active (is_active),
  KEY idx_checklist_items_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Checklist 池表';

-- Checklist 变更项表（一个 checklist 可有多个变更，各自有独立的类型和代码）
CREATE TABLE IF NOT EXISTS checklist_changes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  checklist_item_id INT NOT NULL COMMENT '所属 Checklist 项 ID',
  type VARCHAR(50) NOT NULL DEFAULT 'other' COMMENT '类型: config/sql/deploy/restart/other',
  description TEXT COMMENT '变更描述',
  code TEXT COMMENT '配置内容',
  code_language VARCHAR(50) COMMENT '配置语言: sql/yaml/json/shell/python/javascript/text',
  highlights TEXT COMMENT '代码高亮区间，JSON 字符串',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_changes_item_id (checklist_item_id),
  KEY idx_changes_type (type),
  CONSTRAINT fk_changes_item FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Checklist 变更项表';

-- 发布清单表
CREATE TABLE IF NOT EXISTS releases (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  name VARCHAR(255) NOT NULL COMMENT '发布名称',
  version VARCHAR(50) NOT NULL COMMENT '版本号',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT '状态: draft(草稿), in_progress(进行中), completed(已完成)',
  description TEXT COMMENT '描述',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已删除（软删除）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_releases_status (status),
  KEY idx_releases_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发布清单表';

-- 发布清单中的 Checklist 关联表
CREATE TABLE IF NOT EXISTS release_items (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  release_id INT NOT NULL COMMENT '发布清单 ID',
  checklist_item_id INT NULL COMMENT 'Checklist 项 ID',
  is_checked BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已完成',
  checked_at DATETIME NULL COMMENT '完成时间',
  note TEXT COMMENT '执行备注',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  KEY idx_release_items_release_id (release_id),
  KEY idx_release_items_checklist_item_id (checklist_item_id),
  CONSTRAINT fk_release_items_release FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  CONSTRAINT fk_release_items_item FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发布清单中的 Checklist 关联表';
