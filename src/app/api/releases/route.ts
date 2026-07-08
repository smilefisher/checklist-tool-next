import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const [rows] = await pool.query('SELECT * FROM releases WHERE is_deleted = 0 ORDER BY created_at DESC')
  const result = (rows as any[]).map(r => ({
    id: r.id,
    name: r.name,
    version: r.version,
    status: r.status,
    description: r.description,
    createdAt: r.created_at
  }))
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const [result]: any = await pool.query(
    `INSERT INTO releases (name, version, status, description, created_at) VALUES (?, ?, ?, ?, ?)`,
    [body.name, body.version, 'draft', body.description || '', new Date()]
  )

  const id = result.insertId

  if (body.checklistItemIds && body.checklistItemIds.length > 0) {
    for (let i = 0; i < body.checklistItemIds.length; i++) {
      await pool.query(
        `INSERT INTO release_items (release_id, checklist_item_id, is_checked, note, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [id, body.checklistItemIds[i], false, '', i]
      )
    }
  }

  return NextResponse.json({
    id,
    name: body.name,
    version: body.version,
    status: 'draft',
    description: body.description || '',
    createdAt: new Date().toISOString()
  })
}
