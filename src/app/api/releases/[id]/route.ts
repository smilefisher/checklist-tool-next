import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [releaseRows] = await pool.query('SELECT * FROM releases WHERE id = ?', [id])
  const releases = releaseRows as any[]

  if (releases.length === 0) {
    return NextResponse.json({ message: 'Release not found' }, { status: 404 })
  }

  const release = releases[0]

  const [itemRows] = await pool.query(
    `SELECT ri.*, ci.title, ci.priority, ci.description, ci.is_active
     FROM release_items ri
     LEFT JOIN checklist_items ci ON ri.checklist_item_id = ci.id
     WHERE ri.release_id = ?
     ORDER BY ri.sort_order`,
    [id]
  )

  const itemIds = (itemRows as any[]).map(i => i.checklist_item_id).filter(Boolean)
  const [changes] = itemIds.length > 0
    ? await pool.query(
        `SELECT * FROM checklist_changes WHERE checklist_item_id IN (?) ORDER BY checklist_item_id, sort_order`,
        [itemIds]
      )
    : [[]] as any

  const changesByItem = new Map<number, any[]>()
  for (const ch of changes as any[]) {
    const list = changesByItem.get(ch.checklist_item_id) || []
    list.push({
      id: ch.id,
      checklistItemId: ch.checklist_item_id,
      type: ch.type,
      description: ch.description,
      code: ch.code,
      codeLanguage: ch.code_language,
      sortOrder: ch.sort_order,
      createdAt: ch.created_at,
      highlights: ch.highlights ? JSON.parse(ch.highlights) : {},
    })
    changesByItem.set(ch.checklist_item_id, list)
  }

  const items = (itemRows as any[]).map(item => ({
    id: item.id,
    releaseId: item.release_id,
    checklistItemId: item.checklist_item_id,
    isChecked: Boolean(item.is_checked),
    checkedAt: item.checked_at,
    note: item.note,
    sortOrder: item.sort_order,
    checklistItem: item.title ? {
      id: item.checklist_item_id,
      title: item.title,
      priority: item.priority,
      description: item.description,
      isActive: item.is_active,
      changes: changesByItem.get(item.checklist_item_id) || [],
    } : null
  }))

  return NextResponse.json({
    id: release.id,
    name: release.name,
    version: release.version,
    status: release.status,
    description: release.description,
    createdAt: release.created_at,
    items
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if (body.status) {
    await pool.query('UPDATE releases SET status = ? WHERE id = ?', [body.status, id])
  }

  if (body.name !== undefined || body.version !== undefined || body.description !== undefined) {
    const updates: string[] = []
    const values: any[] = []

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
    if (body.version !== undefined) { updates.push('version = ?'); values.push(body.version) }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description) }

    if (updates.length > 0) {
      values.push(id)
      await pool.query(`UPDATE releases SET ${updates.join(', ')} WHERE id = ?`, values)
    }
  }

  const [rows] = await pool.query('SELECT * FROM releases WHERE id = ?', [id])
  const release = (rows as any[])[0]

  return NextResponse.json({
    id: release.id,
    name: release.name,
    version: release.version,
    status: release.status,
    description: release.description,
    createdAt: release.created_at
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await pool.query('UPDATE releases SET is_deleted = 1 WHERE id = ?', [id])
  return NextResponse.json({ success: true })
}
