function parseHighlights(raw: string | null): HighlightSpan[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    // Old format: {"1": "red", "2": "green"} → convert to array
    const spans: HighlightSpan[] = []
    for (const [line, color] of Object.entries(parsed)) {
      spans.push({ startLine: Number(line), startCol: 1, endLine: Number(line), endCol: Number.MAX_SAFE_INTEGER, color: color as string })
    }
    return spans
  } catch { return [] }
}

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { HighlightSpan } from '@/types'

export async function GET() {
  const [items] = await pool.query(`
    SELECT ci.*,
           COUNT(ri.id) AS reference_count
    FROM checklist_items ci
    LEFT JOIN release_items ri ON ci.id = ri.checklist_item_id
    WHERE ci.is_deleted = 0
    GROUP BY ci.id
    ORDER BY ci.id
  `)

  const [changes] = await pool.query(`
    SELECT * FROM checklist_changes ORDER BY checklist_item_id, sort_order
  `)

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
      highlights: parseHighlights(ch.highlights),
    })
    changesByItem.set(ch.checklist_item_id, list)
  }

  const result = (items as any[]).map(item => ({
    id: item.id,
    title: item.title,
    priority: item.priority,
    description: item.description,
    isActive: Boolean(item.is_active),
    createdAt: item.created_at,
    referenceCount: Number(item.reference_count),
    changes: changesByItem.get(item.id) || [],
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const [result]: any = await pool.query(
    `INSERT INTO checklist_items (title, priority, description, is_active, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [body.title, body.priority, body.description || '', body.isActive ?? true, new Date()]
  )

  const id = result.insertId

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

  return NextResponse.json({ id })
}
