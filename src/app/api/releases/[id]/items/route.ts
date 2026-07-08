import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseId } = await params
  const body = await request.json()

  if (body.checklistItemIds && body.checklistItemIds.length > 0) {
    for (let i = 0; i < body.checklistItemIds.length; i++) {
      await pool.query(
        `INSERT INTO release_items (release_id, checklist_item_id, is_checked, note, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [releaseId, body.checklistItemIds[i], false, '', i]
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseId } = await params
  await pool.query('DELETE FROM release_items WHERE release_id = ?', [releaseId])
  return NextResponse.json({ success: true })
}
