"use client"

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CustomSelect, CustomSelectItem } from '@/components/ui/custom-select'
import CodeEditor from '@/components/CodeEditor'
import { ReleaseStatus, ChecklistType, Priority } from '@/types'
import type { ReleaseChecklistItem } from '@/types'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = { draft: '未开始', in_progress: '执行中', completed: '已完成' }
const statusVariants: Record<string, 'secondary' | 'success' | 'warning'> = {
  draft: 'secondary', in_progress: 'warning', completed: 'success',
}
const typeLabels: Record<string, string> = {
  config: '配置修改', sql: 'SQL 变更', deploy: '代码部署', restart: '服务重启', other: '其他',
}
const typeVariants: Record<string, 'default' | 'destructive' | 'success' | 'warning' | 'secondary'> = {
  config: 'default', sql: 'destructive', deploy: 'success', restart: 'warning', other: 'secondary',
}
const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const priorityColors: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-slate-500' }
const priorityVariants: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive', medium: 'warning', low: 'secondary',
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ReleaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const releaseId = params.id as string

  const [release, setRelease] = useState<any>(null)
  const [items, setItems] = useState<ReleaseChecklistItem[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editListDialogOpen, setEditListDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [infoForm, setInfoForm] = useState({ name: '', version: '', description: '' })
  const [poolItems, setPoolItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('pool')
  const [editForm, setEditForm] = useState({
    id: '', checklistItemId: '', title: '', priority: 'medium' as Priority,
    description: '', changes: [] as any[],
  })

  const totalCount = items.length
  const checkedCount = items.filter(item => item.isChecked).length
  const progressPct = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100)
  const allItemsChecked = totalCount > 0 && checkedCount === totalCount

  const loadRelease = useCallback(async () => {
    try {
      const res = await fetch(`/api/releases/${releaseId}`)
      const data = await res.json()
      setRelease(data)
      setItems(data.items || [])
    } catch {
      toast.error('加载失败')
      router.push('/releases')
    }
  }, [releaseId, router])

  useEffect(() => { loadRelease() }, [loadRelease])

  const filteredPoolItems = useMemo(() => {
    let filtered = poolItems
    if (filterStatus === 'pool') {
      filtered = filtered.filter(item => item.isActive && item.referenceCount === 0)
    } else if (filterStatus === 'referenced') {
      filtered = filtered.filter(item => item.referenceCount > 0)
    } else if (filterStatus === 'disabled') {
      filtered = filtered.filter(item => !item.isActive)
    }
    if (filterType) filtered = filtered.filter(item => item.type === filterType)
    return filtered
  }, [poolItems, filterStatus, filterType])

  const allFilteredSelected = filteredPoolItems.length > 0 && filteredPoolItems.every(item => selectedItems.includes(item.id))
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedItems(selectedItems.filter(id => !filteredPoolItems.some(f => f.id === id)))
    } else {
      const toAdd = filteredPoolItems.filter(f => !selectedItems.includes(f.id))
      setSelectedItems([...selectedItems, ...toAdd.map(f => f.id)])
    }
  }

  const showEditDialog = async () => {
    const res = await fetch('/api/checklist')
    setPoolItems(await res.json())
    setSelectedItems(items.map(i => i.checklistItemId))
    setEditListDialogOpen(true)
  }

  const saveChecklistList = async () => {
    try {
      await fetch(`/api/releases/${releaseId}/items`, { method: 'DELETE' })
      if (selectedItems.length > 0) {
        await fetch(`/api/releases/${releaseId}/items`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistItemIds: selectedItems })
        })
      }
      toast.success('清单更新成功')
      setEditListDialogOpen(false)
      loadRelease()
    } catch { toast.error('更新失败') }
  }

  const editChecklistItem = (item: ReleaseChecklistItem) => {
    const ci = item.checklistItem
    setEditForm({
      id: item.checklistItemId,
      checklistItemId: item.checklistItemId,
      title: ci?.title || '',
      priority: ci?.priority || Priority.MEDIUM,
      description: ci?.description || '',
      changes: (ci?.changes || []).map((c: any) => ({ ...c })),
    })
    setEditDialogOpen(true)
  }

  const saveChecklistItem = async () => {
    try {
      await fetch(`/api/checklist/${editForm.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title, priority: editForm.priority,
          description: editForm.description, changes: editForm.changes,
        })
      })
      toast.success('保存成功')
      setEditDialogOpen(false)
      loadRelease()
    } catch { toast.error('保存失败') }
  }

  const showInfoDialog = () => {
    setInfoForm({ name: release?.name || '', version: release?.version || '', description: release?.description || '' })
    setInfoDialogOpen(true)
  }

  const saveInfo = async () => {
    if (!infoForm.name) { toast.warning('请输入任务名称'); return }
    try {
      await fetch(`/api/releases/${releaseId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(infoForm)
      })
      toast.success('保存成功')
      setInfoDialogOpen(false)
      loadRelease()
    } catch { toast.error('保存失败') }
  }

  const toggleCheck = async (item: ReleaseChecklistItem) => {
    try {
      await fetch(`/api/releases/${releaseId}/items/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: !item.isChecked, note: item.note })
      })
      loadRelease()
    } catch { toast.error('操作失败') }
  }

  const updateNote = async (item: ReleaseChecklistItem) => {
    try {
      await fetch(`/api/releases/${releaseId}/items/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: item.isChecked, note: item.note })
      })
    } catch { toast.error('保存备注失败') }
  }

  const toggleAll = async () => {
    const allChecked = items.every(item => item.isChecked)
    await Promise.all(items.map(item =>
      fetch(`/api/releases/${releaseId}/items/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: !allChecked, note: item.note })
      })
    ))
    loadRelease()
  }

  const updateStatus = async (status: string) => {
    try {
      await fetch(`/api/releases/${releaseId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      toast.success('状态更新成功')
      loadRelease()
    } catch { toast.error('状态更新失败') }
  }

  const copyCode = async (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'; textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus(); textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      toast.success('复制成功')
    } catch { toast.error('复制失败') }
  }

  if (!release) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{release.name}</h1>
                <Badge variant={statusVariants[release.status] || 'secondary'}>{statusLabels[release.status] || release.status}</Badge>
                <Button variant="ghost" size="sm" onClick={showInfoDialog} className="text-gray-400 hover:text-gray-600">编辑</Button>
              </div>
              <div className="flex items-center gap-4 text-gray-500 text-sm">
                <span>版本: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{release.version}</span></span>
                <span>创建时间: {formatDate(release.createdAt)}</span>
              </div>
              {release.description && <p className="mt-3 text-gray-600">{release.description}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/releases')}>返回</Button>
              <Button onClick={showEditDialog}>配置检查项</Button>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">完成进度: <strong>{checkedCount}/{totalCount}</strong></span>
              <div className="flex gap-2">
                {release.status === ReleaseStatus.DRAFT && (
                  <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => updateStatus(ReleaseStatus.IN_PROGRESS)}>开始检查</Button>
                )}
                {release.status === ReleaseStatus.IN_PROGRESS && (
                  <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus(ReleaseStatus.COMPLETED)} disabled={!allItemsChecked}>
                    完成检查
                  </Button>
                )}
              </div>
            </div>
            <Progress
              value={progressPct}
              variant={allItemsChecked ? 'success' : progressPct > 50 ? 'warning' : 'default'}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">检查步骤</h2>
            {items.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleAll}>全部反选</Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p>暂无检查项</p></div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "border border-gray-200 rounded-lg p-4",
                    item.isChecked && "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={item.isChecked}
                      onCheckedChange={() => toggleCheck(item)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("font-medium text-gray-900 flex-1", item.isChecked && "line-through text-gray-400")}>
                          {index + 1}. {item.checklistItem?.title}
                        </span>
                        {(item.checklistItem?.changes || []).length > 0 && item.checklistItem!.changes!.map((c: any) => (
                          <Badge key={c.id || c.sortOrder} variant={typeVariants[c.type] || 'secondary'}>
                            {typeLabels[c.type] || c.type}
                          </Badge>
                        ))}
                        <Badge variant={priorityVariants[item.checklistItem?.priority || ''] || 'secondary'}>
                          {priorityLabels[item.checklistItem?.priority || ''] || '低'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => editChecklistItem(item)}>编辑</Button>
                      </div>
                      {item.checklistItem?.description && (
                        <p className="text-gray-500 text-sm mb-3">{item.checklistItem?.description}</p>
                      )}

                      {(item.checklistItem?.changes || []).map((c: any, ci: number) => (
                        <div key={c.id || ci}>
                          {c.description && (
                            <p className="text-gray-400 text-xs mb-1 mt-2">{c.description}</p>
                          )}
                          {c.code && (
                            <div className="mb-3 rounded overflow-hidden border border-gray-200">
                              <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5">
                                <span className="text-xs text-gray-400 font-mono uppercase">{c.codeLanguage || typeLabels[c.type] || c.type}</span>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-6 px-2 text-xs" onClick={() => copyCode(c.code)}>复制</Button>
                              </div>
                              <div className="bg-gray-900 p-3">
                                <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all">{c.code}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <Textarea
                        value={item.note}
                        onChange={e => {
                          const newItems = items.map(i => i.id === item.id ? { ...i, note: e.target.value } : i)
                          setItems(newItems)
                        }}
                        onBlur={() => updateNote(item)}
                        rows={2}
                        placeholder="添加执行备注..."
                      />

                      {item.checkedAt && (
                        <div className="text-xs text-green-600 mt-2">已完成于 {formatDate(item.checkedAt)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit item dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>编辑检查项</DialogTitle></DialogHeader>
            <div className="p-4">
              <div className="mb-3">
                <Label className="text-sm mb-1.5 block">标题</Label>
                <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="mb-3">
                <Label className="text-sm mb-1.5 block">描述</Label>
                <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">操作步骤</Label>
                  <Button variant="outline" size="sm" onClick={() => setEditForm({ ...editForm, changes: [...editForm.changes, { id: '', checklistItemId: '', type: 'config', description: '', code: '', codeLanguage: '', sortOrder: editForm.changes.length, createdAt: '' }] })}>+ 添加步骤</Button>
                </div>
                {editForm.changes.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">暂无步骤</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {editForm.changes.map((c, ci) => (
                      <div key={ci} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-2 mb-2">
                          <CustomSelect value={c.type} onValueChange={v => { const nc = [...editForm.changes]; nc[ci] = { ...nc[ci], type: v }; setEditForm({ ...editForm, changes: nc }) }} className="w-[110px]">
                            <CustomSelectItem value="config">配置修改</CustomSelectItem>
                            <CustomSelectItem value="sql">SQL 变更</CustomSelectItem>
                            <CustomSelectItem value="deploy">代码部署</CustomSelectItem>
                            <CustomSelectItem value="restart">服务重启</CustomSelectItem>
                            <CustomSelectItem value="other">其他</CustomSelectItem>
                          </CustomSelect>
                          <CustomSelect value={c.codeLanguage || ''} onValueChange={v => { const nc = [...editForm.changes]; nc[ci] = { ...nc[ci], codeLanguage: v }; setEditForm({ ...editForm, changes: nc }) }} placeholder="配置类型" className="w-[120px]">
                            <CustomSelectItem value="">无代码</CustomSelectItem>
                            <CustomSelectItem value="sql">SQL</CustomSelectItem>
                            <CustomSelectItem value="yaml">YAML</CustomSelectItem>
                            <CustomSelectItem value="json">JSON</CustomSelectItem>
                            <CustomSelectItem value="shell">Shell</CustomSelectItem>
                            <CustomSelectItem value="python">Python</CustomSelectItem>
                            <CustomSelectItem value="javascript">JavaScript</CustomSelectItem>
                            <CustomSelectItem value="text">其他</CustomSelectItem>
                          </CustomSelect>
                          <Input value={c.description} onChange={e => { const nc = [...editForm.changes]; nc[ci] = { ...nc[ci], description: e.target.value }; setEditForm({ ...editForm, changes: nc }) }} placeholder="步骤描述（可选）" className="flex-1" />
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-9 px-1" onClick={() => setEditForm({ ...editForm, changes: editForm.changes.filter((_, i) => i !== ci) })}>删除</Button>
                        </div>
                        {c.codeLanguage && (
                          <CodeEditor
                            value={c.code || ''}
                            onChange={v => { const nc = [...editForm.changes]; nc[ci] = { ...nc[ci], code: v }; setEditForm({ ...editForm, changes: nc }) }}
                            language={c.codeLanguage}
                            placeholder="粘贴配置内容..."
                            highlights={c.highlights || {}}
                            onHighlightsChange={h => { const nc = [...editForm.changes]; nc[ci] = { ...nc[ci], highlights: h }; setEditForm({ ...editForm, changes: nc }) }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button onClick={saveChecklistItem}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit list dialog */}
        <Dialog open={editListDialogOpen} onOpenChange={setEditListDialogOpen}>
          <DialogContent className="max-w-[800px]">
            <DialogHeader><DialogTitle>配置检查项</DialogTitle></DialogHeader>
            <div className="flex gap-4 mb-4">
              <CustomSelect value={filterStatus} onValueChange={setFilterStatus} placeholder="按状态筛选" className="w-[130px]">
                <CustomSelectItem value="">全部状态</CustomSelectItem>
                <CustomSelectItem value="pool">可用</CustomSelectItem>
                <CustomSelectItem value="referenced">已引用</CustomSelectItem>
                <CustomSelectItem value="disabled">已停用</CustomSelectItem>
              </CustomSelect>
              <CustomSelect value={filterType} onValueChange={setFilterType} placeholder="按类型筛选" className="w-[130px]">
                <CustomSelectItem value="">全部类型</CustomSelectItem>
                <CustomSelectItem value="config">配置修改</CustomSelectItem>
                <CustomSelectItem value="sql">SQL 变更</CustomSelectItem>
                <CustomSelectItem value="deploy">代码部署</CustomSelectItem>
                <CustomSelectItem value="restart">服务重启</CustomSelectItem>
                <CustomSelectItem value="other">其他</CustomSelectItem>
              </CustomSelect>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox checked={allFilteredSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-[100px]">类型</TableHead>
                    <TableHead className="w-[80px]">优先级</TableHead>
                    <TableHead>描述</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPoolItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={checked => {
                            if (checked) setSelectedItems([...selectedItems, item.id])
                            else setSelectedItems(selectedItems.filter(id => id !== item.id))
                          }}
                        />
                      </TableCell>
                      <TableCell><span className="font-medium text-gray-900">{item.title}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.changes?.length > 0
                            ? item.changes.map((c: any) => (
                                <Badge key={c.id || c.sortOrder} variant={typeVariants[c.type] || 'secondary'}>{typeLabels[c.type] || c.type}</Badge>
                              ))
                            : <span className="text-xs text-slate-400">-</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell><span className={cn(priorityColors[item.priority])}>{priorityLabels[item.priority]}</span></TableCell>
                      <TableCell><span className="text-gray-500 text-sm truncate">{item.description || '-'}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditListDialogOpen(false)}>取消</Button>
              <Button onClick={saveChecklistList}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit info dialog */}
        <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
          <DialogContent className="max-w-[500px]">
            <DialogHeader><DialogTitle>编辑任务信息</DialogTitle></DialogHeader>
            <div className="px-4 pt-1 pb-0">
              <div className="mb-3">
                <Label className="text-sm mb-1.5 block">任务名称</Label>
                <Input value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} placeholder="输入任务名称" />
              </div>
              <div className="mb-3">
                <Label className="text-sm mb-1.5 block">版本号</Label>
                <Input value={infoForm.version} onChange={e => setInfoForm({ ...infoForm, version: e.target.value })} placeholder="v1.0.0" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">描述</Label>
                <Textarea value={infoForm.description} onChange={e => setInfoForm({ ...infoForm, description: e.target.value })} rows={3} placeholder="输入描述（可选）" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>取消</Button>
              <Button onClick={saveInfo}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
