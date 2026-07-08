"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CustomSelect, CustomSelectItem } from '@/components/ui/custom-select'
import CodeEditor from '@/components/CodeEditor'
import ConfirmDialog from '@/components/ConfirmDialog'
import { ChecklistType, Priority } from '@/types'
import type { ChecklistChange } from '@/types'
import { cn } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  config: '配置修改', sql: 'SQL 变更', deploy: '代码部署', restart: '服务重启', other: '其他',
}
const typeVariants: Record<string, 'default' | 'destructive' | 'success' | 'warning' | 'secondary'> = {
  config: 'default', sql: 'destructive', deploy: 'success', restart: 'warning', other: 'secondary',
}
const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const priorityColors: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-slate-500' }

export default function ChecklistPoolPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('pool')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [form, setForm] = useState({
    id: '', title: '', priority: Priority.MEDIUM, description: '', isActive: true,
    changes: [] as ChecklistChange[],
  })

  const loadItems = useCallback(async () => {
    const res = await fetch('/api/checklist')
    setItems(await res.json())
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const filteredItems = useMemo(() => {
    let result = items
    if (filterType) {
      result = result.filter(item =>
        item.changes?.some((c: ChecklistChange) => c.type === filterType)
      )
    }
    if (filterStatus === 'pool') result = result.filter(item => item.isActive && item.referenceCount === 0)
    else if (filterStatus === 'referenced') result = result.filter(item => item.referenceCount > 0)
    else if (filterStatus === 'disabled') result = result.filter(item => !item.isActive)
    return result
  }, [items, filterType, filterStatus])

  const showAddDialog = () => {
    setIsEditing(false)
    setForm({ id: '', title: '', priority: Priority.MEDIUM, description: '', isActive: true, changes: [] })
    setDialogOpen(true)
  }

  const editItem = (item: any) => {
    setIsEditing(true)
    setForm({
      id: item.id, title: item.title, priority: item.priority,
      description: item.description, isActive: item.isActive,
      changes: item.changes?.map((c: any) => ({ ...c })) || [],
    })
    setDialogOpen(true)
  }

  const addChange = () => {
    setForm({
      ...form,
      changes: [...form.changes, {
        id: '', checklistItemId: '', type: ChecklistType.CONFIG, description: '',
        code: '', codeLanguage: '', sortOrder: form.changes.length, createdAt: '',
      }],
    })
  }

  const removeChange = (index: number) => {
    setForm({ ...form, changes: form.changes.filter((_, i) => i !== index) })
  }

  const updateChange = (index: number, field: string, value: any) => {
    const newChanges = [...form.changes]
    newChanges[index] = { ...newChanges[index], [field]: value }
    setForm({ ...form, changes: newChanges })
  }

  const saveItem = async () => {
    if (!form.title) { toast.warning('请输入标题'); return }
    try {
      if (isEditing) {
        await fetch(`/api/checklist/${form.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('更新成功')
      } else {
        await fetch('/api/checklist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('添加成功')
      }
      setDialogOpen(false)
      loadItems()
    } catch { toast.error('操作失败') }
  }

  const deleteItem = async () => {
    try {
      await fetch(`/api/checklist/${deleteTargetId}`, { method: 'DELETE' })
      toast.success('删除成功')
      loadItems()
      setDeleteTargetId('')
    } catch { toast.error('删除失败') }
  }

  const showDeleteConfirm = (id: string) => {
    setDeleteTargetId(id)
    setConfirmOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-end mb-6">
          <div className="flex gap-8 border-b border-gray-200 flex-1">
            <span className="pb-3 text-xl font-bold cursor-pointer border-b-2 border-blue-500 text-blue-600">Checklist 池</span>
            <span className="pb-3 text-xl font-bold cursor-pointer text-gray-300 hover:text-gray-500" onClick={() => router.push('/releases')}>发布单列表</span>
          </div>
          <div className="flex gap-3 ml-6 pb-1">
            <Button onClick={showAddDialog}>添加 Checklist</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">类型:</span>
              <CustomSelect value={filterType} onValueChange={setFilterType} placeholder="全部类型" className="w-[130px]">
                <CustomSelectItem value="">全部类型</CustomSelectItem>
                <CustomSelectItem value="config">配置修改</CustomSelectItem>
                <CustomSelectItem value="sql">SQL 变更</CustomSelectItem>
                <CustomSelectItem value="deploy">代码部署</CustomSelectItem>
                <CustomSelectItem value="restart">服务重启</CustomSelectItem>
                <CustomSelectItem value="other">其他</CustomSelectItem>
              </CustomSelect>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态:</span>
              <CustomSelect value={filterStatus} onValueChange={setFilterStatus} placeholder="全部状态" className="w-[130px]">
                <CustomSelectItem value="all">全部状态</CustomSelectItem>
                <CustomSelectItem value="pool">池中可用</CustomSelectItem>
                <CustomSelectItem value="referenced">仅被引用</CustomSelectItem>
                <CustomSelectItem value="disabled">已禁用</CustomSelectItem>
              </CustomSelect>
            </div>
            <div className="flex-1" />
            <span className="text-sm text-gray-500">{filteredItems.length} 条记录</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>标题</TableHead>
                <TableHead className="w-[180px]">变更类型</TableHead>
                <TableHead className="w-[100px]">优先级</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell><span className="text-xs text-gray-400 font-mono">{item.id}</span></TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.description && <div className="text-sm text-gray-500 truncate">{item.description}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.changes?.length > 0
                        ? item.changes.map((c: ChecklistChange) => (
                            <Badge key={c.id || c.sortOrder} variant={typeVariants[c.type] || 'secondary'} className="text-xs">
                              {typeLabels[c.type] || c.type}
                            </Badge>
                          ))
                        : <span className="text-xs text-slate-400">无变更</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-medium whitespace-nowrap", priorityColors[item.priority])}>
                      {priorityLabels[item.priority] || item.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.isActive && item.referenceCount === 0
                      ? <Badge variant="success">池中可用</Badge>
                      : item.referenceCount > 0
                      ? <Badge variant="warning">被引用</Badge>
                      : <Badge variant="secondary">已禁用</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => editItem(item)}>编辑</Button>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => showDeleteConfirm(item.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit / Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? '编辑 Checklist' : '添加 Checklist'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-sm mb-1.5 block">标题</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="输入标题" />
                </div>
                <div style={{ width: 90 }}>
                  <Label className="text-sm mb-1.5 block">优先级</Label>
                  <CustomSelect value={form.priority} onValueChange={v => setForm({ ...form, priority: v as Priority })}>
                    <CustomSelectItem value="high">高</CustomSelectItem>
                    <CustomSelectItem value="medium">中</CustomSelectItem>
                    <CustomSelectItem value="low">低</CustomSelectItem>
                  </CustomSelect>
                </div>
                <div style={{ width: 60 }} className="flex items-end pb-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">启用</Label>
                    <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">整体描述</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="输入描述信息（可选）" />
              </div>

              {/* Changes */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">变更项列表</Label>
                  <Button variant="outline" size="sm" onClick={addChange}>+ 添加变更</Button>
                </div>
                {form.changes.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    暂无变更项，点击"+ 添加变更"开始添加
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {form.changes.map((ch, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-slate-600">变更 #{index + 1}</span>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-auto py-0 px-1" onClick={() => removeChange(index)}>删除</Button>
                        </div>
                        <div className="flex gap-3 mb-3">
                          <div style={{ width: 120 }}>
                            <Label className="text-xs mb-1 block text-slate-500">类型</Label>
                            <CustomSelect value={ch.type} onValueChange={v => updateChange(index, 'type', v)}>
                              <CustomSelectItem value="config">配置修改</CustomSelectItem>
                              <CustomSelectItem value="sql">SQL 变更</CustomSelectItem>
                              <CustomSelectItem value="deploy">代码部署</CustomSelectItem>
                              <CustomSelectItem value="restart">服务重启</CustomSelectItem>
                              <CustomSelectItem value="other">其他</CustomSelectItem>
                            </CustomSelect>
                          </div>
                          <div style={{ width: 130 }}>
                            <Label className="text-xs mb-1 block text-slate-500">配置类型</Label>
                            <CustomSelect value={ch.codeLanguage || ''} onValueChange={v => updateChange(index, 'codeLanguage', v)} placeholder="无代码">
                              <CustomSelectItem value="">无代码</CustomSelectItem>
                              <CustomSelectItem value="sql">SQL</CustomSelectItem>
                              <CustomSelectItem value="yaml">YAML</CustomSelectItem>
                              <CustomSelectItem value="json">JSON</CustomSelectItem>
                              <CustomSelectItem value="shell">Shell</CustomSelectItem>
                              <CustomSelectItem value="python">Python</CustomSelectItem>
                              <CustomSelectItem value="javascript">JavaScript</CustomSelectItem>
                              <CustomSelectItem value="text">其他</CustomSelectItem>
                            </CustomSelect>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs mb-1 block text-slate-500">变更描述</Label>
                            <Input value={ch.description} onChange={e => updateChange(index, 'description', e.target.value)} placeholder="变更描述（可选）" />
                          </div>
                        </div>
                        {ch.codeLanguage && (
                          <div>
                            <Label className="text-xs mb-1 block text-slate-500">配置内容</Label>
                            <CodeEditor
                              value={ch.code || ''}
                              onChange={v => updateChange(index, 'code', v)}
                              language={ch.codeLanguage}
                              placeholder="粘贴配置内容..."
                              highlights={ch.highlights || {}}
                              onHighlightsChange={h => updateChange(index, 'highlights', h)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={saveItem}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="确认删除"
          description="确定要删除这个 Checklist 吗？删除后可在数据库中恢复。"
          onConfirm={deleteItem}
          confirmText="删除"
        />
      </div>
    </div>
  )
}
