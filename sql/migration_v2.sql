-- 创建 checklist_changes 表（一个 checklist 项可有多个变更，每个变更有独立类型）
CREATE TABLE IF NOT EXISTS checklist_changes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  checklist_item_id INT NOT NULL COMMENT '所属 Checklist 项 ID',
  type VARCHAR(50) NOT NULL COMMENT '类型: config/sql/deploy/restart/other',
  description TEXT COMMENT '变更描述',
  code TEXT COMMENT '配置内容',
  code_language VARCHAR(50) COMMENT '配置语言: sql/yaml/json/shell/python/javascript/text',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Checklist 变更项表';

CREATE INDEX idx_changes_item_id ON checklist_changes(checklist_item_id);
CREATE INDEX idx_changes_type ON checklist_changes(type);

-- 迁移已有数据：将 checklist_items 中的 type/code/code_language/description 迁移为一条变更
INSERT INTO checklist_changes (checklist_item_id, type, description, code, code_language, sort_order)
SELECT id, type, description, code, code_language, 0
FROM checklist_items
WHERE code IS NOT NULL OR type IS NOT NULL;

-- 如果 checklist_items 的 description 已迁移到变更，可在 checklist_items 层面添加 item_level_description
-- 但为了兼容性，暂时保留 checklist_items.description 不动，用于展示该项的整体说明
