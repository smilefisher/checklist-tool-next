import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { HighlightSpan } from '@/types'

function parseHighlights(raw: string | null): HighlightSpan[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    const spans: HighlightSpan[] = []
    for (const [line, color] of Object.entries(parsed)) {
      spans.push({ startLine: Number(line), startCol: 1, endLine: Number(line), endCol: Number.MAX_SAFE_INTEGER, color: color as string })
    }
    return spans
  } catch { return [] }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: releaseId, itemId } = await params
  const body = await request.json()

  const updates: string[] = []
  const values: any[] = []

  if (body.isChecked !== undefined) {
    updates.push('is_checked = ?')
    values.push(body.isChecked)
    if (body.isChecked) {
      updates.push('checked_at = ?')
      values.push(new Date())
    }
  }

  if (body.note !== undefined) {
    updates.push('note = ?')
    values.push(body.note)
  }

  if (updates.length > 0) {
    values.push(itemId)
    values.push(releaseId)
    await pool.query(`UPDATE release_items SET ${updates.join(', ')} WHERE id = ? AND release_id = ?`, values)
  }

  const [rows] = await pool.query(
    `SELECT ri.*, ci.title, ci.priority, ci.description, ci.is_active
     FROM release_items ri
     LEFT JOIN checklist_items ci ON ri.checklist_item_id = ci.id
     WHERE ri.id = ? AND ri.release_id = ?`,
    [itemId, releaseId]
  )

  const item = (rows as any[])[0]

  if (!item) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  const [changes] = await pool.query(
    'SELECT * FROM checklist_changes WHERE checklist_item_id = ? ORDER BY sort_order',
    [item.checklist_item_id]
  )

  return NextResponse.json({
    id: item.id,
    releaseId: item.release_id,
    checklistItemId: item.checklist_item_id,
    isChecked: item.is_checked,
    checkedAt: item.checked_at,
    note: item.note,
    sortOrder: item.sort_order,
    checklistItem: item.title ? {
      id: item.checklist_item_id,
      title: item.title,
      priority: item.priority,
      description: item.description,
      isActive: item.is_active,
      changes: (changes as any[]).map(ch => ({
        id: ch.id,
        checklistItemId: ch.checklist_item_id,
        type: ch.type,
        description: ch.description,
        code: ch.code,
        codeLanguage: ch.code_language,
        sortOrder: ch.sort_order,
        createdAt: ch.created_at,
        highlights: parseHighlights(ch.highlights),
      }))
    } : null
  })
}
