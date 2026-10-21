import mysql from 'mysql2/promise'

// 连接配置优先读环境变量，未设置时回退到原来的线上库，保证现有部署行为不变
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '192.168.1.61',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'checklist',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
  queueLimit: 0
})

export default pool
