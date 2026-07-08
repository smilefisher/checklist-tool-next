import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: '192.168.1.61',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'checklist',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool
