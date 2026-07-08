-- Checklist Tool 数据库表设计 v2

CREATE DATABASE IF NOT EXISTS checklist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE checklist;

-- Checklist 池表
CREATE TABLE IF NOT EXISTS checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  title VARCHAR(255) NOT NULL COMMENT '标题',
  priority VARCHAR(50) NOT NULL COMMENT '优先级: high(高), medium(中), low(低)',
  description TEXT COMMENT '整体描述',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Checklist 池表';

-- Checklist 变更项表（一个 checklist 可有多个变更，各自有独立的类型和代码）
CREATE TABLE IF NOT EXISTS checklist_changes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  checklist_item_id INT NOT NULL COMMENT '所属 Checklist 项 ID',
  type VARCHAR(50) NOT NULL COMMENT '类型: config/sql/deploy/restart/other',
  description TEXT COMMENT '变更描述',
  code TEXT COMMENT '配置内容',
  code_language VARCHAR(50) COMMENT '配置语言',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Checklist 变更项表';

-- 发布清单表
CREATE TABLE IF NOT EXISTS releases (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  name VARCHAR(255) NOT NULL COMMENT '发布名称',
  version VARCHAR(50) NOT NULL COMMENT '版本号',
  status VARCHAR(50) NOT NULL COMMENT '状态: draft(草稿), in_progress(进行中), completed(已完成)',
  description TEXT COMMENT '描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发布清单表';

-- 发布清单中的 Checklist 关联表
CREATE TABLE IF NOT EXISTS release_items (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  release_id INT NOT NULL COMMENT '发布清单 ID',
  checklist_item_id INT COMMENT 'Checklist 项 ID',
  is_checked BOOLEAN DEFAULT FALSE COMMENT '是否已完成',
  checked_at DATETIME COMMENT '完成时间',
  note TEXT COMMENT '执行备注',
  sort_order INT DEFAULT 0 COMMENT '排序',
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发布清单中的 Checklist 关联表';

-- 索引
CREATE INDEX idx_changes_item_id ON checklist_changes(checklist_item_id);
CREATE INDEX idx_changes_type ON checklist_changes(type);
CREATE INDEX idx_release_items_release_id ON release_items(release_id);
CREATE INDEX idx_release_items_checklist_item_id ON release_items(checklist_item_id);
CREATE INDEX idx_releases_status ON releases(status);
CREATE INDEX idx_checklist_items_is_active ON checklist_items(is_active);
