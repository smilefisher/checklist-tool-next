import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  await pool.query(
    `UPDATE checklist_items SET title = ?, priority = ?, description = ?, is_active = ? WHERE id = ?`,
    [body.title, body.priority, body.description || '', body.isActive ?? true, id]
  )

  if (body.changes !== undefined) {
    await pool.query('DELETE FROM checklist_changes WHERE checklist_item_id = ?', [id])
    if (body.changes && body.changes.length > 0) {
      for (let i = 0; i < body.changes.length; i++) {
        const ch = body.changes[i]
        await pool.query(
          `INSERT INTO checklist_changes (checklist_item_id, type, description, code, code_language, highlights, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, ch.type, ch.description || '', ch.code || '', ch.codeLanguage || '', ch.highlights ? JSON.stringify(ch.highlights) : null, i]
        )
      }
    }
  }

  const [rows] = await pool.query('SELECT * FROM checklist_items WHERE id = ?', [id])
  const item = (rows as any)[0]

  if (!item) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  const [changes] = await pool.query(
    'SELECT * FROM checklist_changes WHERE checklist_item_id = ? ORDER BY sort_order', [id]
  )

  return NextResponse.json({
    id: item.id,
    title: item.title,
    priority: item.priority,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    changes: (changes as any[]).map(ch => ({
      id: ch.id,
      checklistItemId: ch.checklist_item_id,
      type: ch.type,
      description: ch.description,
      code: ch.code,
      codeLanguage: ch.code_language,
      sortOrder: ch.sort_order,
      createdAt: ch.created_at,
      highlights: ch.highlights ? JSON.parse(ch.highlights) : {},
    }))
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await pool.query('UPDATE checklist_items SET is_deleted = 1 WHERE id = ?', [id])
  return NextResponse.json({ success: true })
}
