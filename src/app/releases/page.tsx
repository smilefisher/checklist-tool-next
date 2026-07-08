"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CustomSelect, CustomSelectItem } from '@/components/ui/custom-select'
import ConfirmDialog from '@/components/ConfirmDialog'
import { ReleaseStatus, ChecklistType, Priority } from '@/types'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = { draft: '未开始', in_progress: '执行中', completed: '已完成' }
const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  draft: 'secondary', in_progress: 'warning', completed: 'success',
}
const typeLabels: Record<string, string> = {
  config: '配置修改', sql: 'SQL 变更', deploy: '代码部署', restart: '服务重启', other: '其他',
}
const typeStyles: Record<string, string> = {
  config: 'bg-blue-50 text-blue-700 border-blue-200',
  sql: 'bg-violet-50 text-violet-700 border-violet-200',
  deploy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  restart: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
}
const typeVariants: Record<string, 'default' | 'destructive' | 'success' | 'warning' | 'secondary'> = {
  config: 'default', sql: 'destructive', deploy: 'success', restart: 'warning', other: 'secondary',
}
const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const priorityColors: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-slate-500' }

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function ReleasesPage() {
  const router = useRouter()
  const [releases, setReleases] = useState<any[]>([])
  const [checklistItems, setChecklistItems] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editListDialogOpen, setEditListDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', name: '', version: '', description: '', status: '' })
  const [poolItems, setPoolItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [poolFilterType, setPoolFilterType] = useState('')
  const [poolFilterStatus, setPoolFilterStatus] = useState('')
  const [form, setForm] = useState({ name: '', version: '', description: '', checklistItemIds: [] as string[] })
  const [createShowAll, setCreateShowAll] = useState(false)
  const [releaseStatusFilter, setReleaseStatusFilter] = useState('draft')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')

  const createFilteredItems = useMemo(() => {
    let filtered = createShowAll ? checklistItems : checklistItems.filter(item => item.isActive && item.referenceCount === 0)
    return filtered
  }, [checklistItems, createShowAll])

  const allCreateSelected = createFilteredItems.length > 0 && createFilteredItems.every(item => form.checklistItemIds.includes(item.id))
  const toggleCreateSelectAll = () => {
    if (allCreateSelected) {
      setForm({ ...form, checklistItemIds: form.checklistItemIds.filter(id => !createFilteredItems.some(f => f.id === id)) })
    } else {
      const toAdd = createFilteredItems.filter(f => !form.checklistItemIds.includes(f.id))
      setForm({ ...form, checklistItemIds: [...form.checklistItemIds, ...toAdd.map(f => f.id)] })
    }
  }

  const filteredReleases = useMemo(() => {
    return releases.filter(r => r.status === releaseStatusFilter)
  }, [releases, releaseStatusFilter])

  const loadReleases = useCallback(async () => {
    const res = await fetch('/api/releases')
    setReleases(await res.json())
  }, [])

  useEffect(() => { loadReleases() }, [loadReleases])

  const filteredPoolItems = useMemo(() => {
    let filtered = poolItems
    if (poolFilterStatus === 'pool') {
      filtered = filtered.filter(item => item.isActive && item.referenceCount === 0)
    } else if (poolFilterStatus === 'referenced') {
      filtered = filtered.filter(item => item.referenceCount > 0)
    } else if (poolFilterStatus === 'disabled') {
      filtered = filtered.filter(item => !item.isActive)
    }
    if (poolFilterType) filtered = filtered.filter(item => item.type === poolFilterType)
    return filtered
  }, [poolItems, poolFilterStatus, poolFilterType])

  const allPoolFilteredSelected = filteredPoolItems.length > 0 && filteredPoolItems.every(item => selectedItems.includes(item.id))
  const togglePoolSelectAll = () => {
    if (allPoolFilteredSelected) {
      setSelectedItems(selectedItems.filter(id => !filteredPoolItems.some(f => f.id === id)))
    } else {
      const toAdd = filteredPoolItems.filter(f => !selectedItems.includes(f.id))
      setSelectedItems([...selectedItems, ...toAdd.map(f => f.id)])
    }
  }

  const showCreateDialog = async () => {
    const res = await fetch('/api/checklist')
    setChecklistItems(await res.json())
    setForm({ name: '', version: '', description: '', checklistItemIds: [] })
    setCreateShowAll(false)
    setDialogOpen(true)
  }

  const createRelease = async () => {
    if (!form.name) { toast.warning('请输入任务名称'); return }
    try {
      const res = await fetch('/api/releases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const release = await res.json()
      toast.success('创建成功')
      setDialogOpen(false)
      loadReleases()
      router.push(`/releases/${release.id}`)
    } catch { toast.error('创建失败') }
  }

  const deleteRelease = async () => {
    try {
      await fetch(`/api/releases/${deleteTargetId}`, { method: 'DELETE' })
      toast.success('删除成功')
      loadReleases()
      setDeleteTargetId('')
    } catch { toast.error('删除失败') }
  }

  const showDeleteConfirm = (id: string) => {
    setDeleteTargetId(id)
    setConfirmOpen(true)
  }

  const showEditDialog = (row: any) => {
    setEditForm({ id: row.id, name: row.name, version: row.version || '', description: row.description || '', status: row.status })
    setEditDialogOpen(true)
  }

  const saveEdit = async () => {
    if (!editForm.name) { toast.warning('请输入任务名称'); return }
    try {
      await fetch(`/api/releases/${editForm.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, version: editForm.version, description: editForm.description, status: editForm.status })
      })
      toast.success('保存成功')
      setEditDialogOpen(false)
      loadReleases()
    } catch { toast.error('保存失败') }
  }

  const showEditListDialog = async () => {
    const res = await fetch('/api/checklist')
    setPoolItems(await res.json())
    const releaseRes = await fetch(`/api/releases/${editForm.id}`)
    const releaseData = await releaseRes.json()
    setSelectedItems((releaseData.items || []).map((i: any) => i.checklistItemId))
    setEditListDialogOpen(true)
  }

  const saveChecklistList = async () => {
    try {
      await fetch(`/api/releases/${editForm.id}/items`, { method: 'DELETE' })
      if (selectedItems.length > 0) {
        await fetch(`/api/releases/${editForm.id}/items`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistItemIds: selectedItems })
        })
      }
      toast.success('清单更新成功')
      setEditListDialogOpen(false)
    } catch { toast.error('更新失败') }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-6">
          <div className="flex gap-8 border-b border-gray-200 flex-1">
            <span className="pb-3 text-xl font-bold cursor-pointer text-gray-300 hover:text-gray-500" onClick={() => router.push('/')}>检查清单</span>
            <span className="pb-3 text-xl font-bold cursor-pointer border-b-2 border-blue-500 text-blue-600">检查任务</span>
          </div>
          <div className="flex gap-3 ml-6 pb-1">
            <Button onClick={showCreateDialog}>新建任务</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态:</span>
              <CustomSelect value={releaseStatusFilter} onValueChange={setReleaseStatusFilter} className="w-[120px]">
                    <CustomSelectItem value="draft">未开始</CustomSelectItem>
                    <CustomSelectItem value="in_progress">执行中</CustomSelectItem>
                    <CustomSelectItem value="completed">已完成</CustomSelectItem>
              </CustomSelect>
            </div>
            <div className="flex-1" />
            <span className="text-sm text-gray-500">{filteredReleases.length} 条记录</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>任务名称</TableHead>
                <TableHead className="w-[120px]">版本</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[150px]">创建时间</TableHead>
                <TableHead className="w-[200px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReleases.map(row => (
                <TableRow key={row.id}>
                  <TableCell><span className="text-xs text-gray-400 font-mono">{row.id}</span></TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{row.name}</div>
                    {row.description && <div className="text-sm text-gray-500 truncate">{row.description}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{row.version || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[row.status] || 'secondary'}>{statusLabels[row.status] || row.status}</Badge>
                  </TableCell>
                  <TableCell><span className="text-gray-500 text-sm">{formatDate(row.createdAt)}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/releases/${row.id}`)}>查看</Button>
                      <Button variant="outline" size="sm" onClick={() => showEditDialog(row)}>编辑</Button>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => showDeleteConfirm(row.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {releases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                    <p>暂无发布单</p>
                    <p className="text-sm mt-1">点击&ldquo;新建任务&rdquo;开始</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[700px]">
            <DialogHeader><DialogTitle>编辑任务信息</DialogTitle></DialogHeader>
            <div className="px-4 pt-1 pb-0">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-sm mb-1.5 block">任务名称</Label>
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="输入任务名称" />
                </div>
                <div style={{ width: 150 }}>
                  <Label className="text-sm mb-1.5 block">版本号</Label>
                  <Input value={editForm.version} onChange={e => setEditForm({ ...editForm, version: e.target.value })} placeholder="v1.0.0" />
                </div>
                <div style={{ width: 130 }}>
                  <Label className="text-sm mb-1.5 block">状态</Label>
                  <CustomSelect value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                <CustomSelectItem value="draft">未开始</CustomSelectItem>
                <CustomSelectItem value="in_progress">执行中</CustomSelectItem>
                <CustomSelectItem value="completed">已完成</CustomSelectItem>
                  </CustomSelect>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-sm mb-1.5 block">描述</Label>
                <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="输入描述（可选）" rows={2} />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={showEditListDialog}>配置检查项</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
                <Button onClick={saveEdit}>保存</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit list dialog */}
        <Dialog open={editListDialogOpen} onOpenChange={setEditListDialogOpen}>
          <DialogContent className="max-w-[800px]">
            <DialogHeader><DialogTitle>配置检查项</DialogTitle></DialogHeader>
            <div className="flex gap-4 mb-4">
              <CustomSelect value={poolFilterStatus} onValueChange={setPoolFilterStatus} placeholder="按状态筛选" className="w-[130px]">
                <CustomSelectItem value="">全部状态</CustomSelectItem>
                <CustomSelectItem value="pool">可用</CustomSelectItem>
                <CustomSelectItem value="referenced">已引用</CustomSelectItem>
                <CustomSelectItem value="disabled">已停用</CustomSelectItem>
              </CustomSelect>
              <CustomSelect value={poolFilterType} onValueChange={setPoolFilterType} placeholder="按类型筛选" className="w-[130px]">
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
                      <Checkbox checked={allPoolFilteredSelected} onCheckedChange={togglePoolSelectAll} />
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

        {/* Create dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[800px]">
            <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
            <div className="px-1">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="text-sm text-slate-600 mb-2 block">任务名称 <span className="text-red-400">*</span></Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="输入任务名称" />
                </div>
                <div style={{ width: 160 }}>
                  <Label className="text-sm text-slate-600 mb-2 block">版本号</Label>
                  <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="v1.0.0" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm text-slate-600 mb-2 block">描述</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="输入描述（可选）" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-slate-600">选择 Checklist</Label>
                    <span className="text-xs text-slate-400">{form.checklistItemIds.length} 项已选中</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => setCreateShowAll(false)}
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium transition-colors",
                          !createShowAll ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >空闲</button>
                      <button
                        onClick={() => setCreateShowAll(true)}
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium transition-colors",
                          createShowAll ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >全部</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={allCreateSelected} onCheckedChange={toggleCreateSelectAll} />
                      <span className="text-xs text-slate-500 cursor-pointer" onClick={toggleCreateSelectAll}>全选</span>
                    </div>
                  </div>
                </div>
                <div className="max-h-[260px] overflow-auto border border-slate-200 rounded-lg">
                  {createFilteredItems.map(item => (
                    <label key={item.id} className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
                      form.checklistItemIds.includes(item.id) && "bg-blue-50/60"
                    )}>
                      <Checkbox
                        checked={form.checklistItemIds.includes(item.id)}
                        onCheckedChange={checked => {
                          if (checked) setForm({ ...form, checklistItemIds: [...form.checklistItemIds, item.id] })
                          else setForm({ ...form, checklistItemIds: form.checklistItemIds.filter(id => id !== item.id) })
                        }}
                      />
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-sm font-medium">{item.title}</span>
                        <div className="flex flex-wrap gap-1">
                          {item.changes?.length > 0
                            ? item.changes.map((c: any) => (
                                <span key={c.id || c.sortOrder} className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                  typeStyles[c.type] || typeStyles.other
                                )}>{typeLabels[c.type] || c.type}</span>
                              ))
                            : <span className="text-xs text-slate-400">-</span>
                          }
                        </div>
                      </div>
                    </label>
                  ))}
                  {createFilteredItems.length === 0 && (
                    <p className="text-center py-12 text-slate-400 text-sm">没有匹配的 Checklist 项</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={createRelease} disabled={!form.name}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="确认删除"
          description="确定要删除这个任务吗？删除后可在数据库中恢复。"
          onConfirm={deleteRelease}
          confirmText="删除"
        />
      </div>
    </div>
  )
}
