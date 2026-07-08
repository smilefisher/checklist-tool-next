import mysql from 'mysql2/promise'

async function migrate() {
  const pool = mysql.createPool({
    host: '192.168.1.61', port: 3306, user: 'root', password: '123456', database: 'checklist',
    multipleStatements: true,
  })

  // 软删除列
  await pool.query("ALTER TABLE checklist_items ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER is_active").catch(() => console.log('  checklist_items.is_deleted 已存在'))
  await pool.query("ALTER TABLE releases ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER status").catch(() => console.log('  releases.is_deleted 已存在'))

  // 确保已有数据 is_deleted = 0
  await pool.query("UPDATE checklist_items SET is_deleted = FALSE WHERE is_deleted IS NULL")
  await pool.query("UPDATE releases SET is_deleted = FALSE WHERE is_deleted IS NULL")

  console.log('✓ 软删除列已添加')
  await pool.end()
}

migrate().catch(err => { console.error('失败:', err.message); process.exit(1) })
