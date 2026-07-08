"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CustomSelect, CustomSelectItem } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'

const typeStyles: Record<string, string> = {
  config: 'bg-blue-50 text-blue-700 border-blue-200',
  sql: 'bg-violet-50 text-violet-700 border-violet-200',
  deploy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  restart: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
}
const typeLabels: Record<string, string> = {
  config: '配置修改', sql: 'SQL 变更', deploy: '代码部署', restart: '服务重启', other: '其他',
}
const priorityDotColors: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-slate-400',
}
const priorityLabels: Record<string, string> = {
  high: '高', medium: '中', low: '低',
}

export default function NewReleasePage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [filterType, setFilterType] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', version: '', description: '' })

  useEffect(() => {
    fetch('/api/checklist').then(r => r.json()).then(setItems)
  }, [])

  const allItems = useMemo(() => {
    let filtered = showAll ? items : items.filter(item => item.isActive && item.referenceCount === 0)
    if (filterType) filtered = filtered.filter(item => item.type === filterType)
    return filtered
  }, [items, showAll, filterType])

  const canSubmit = form.name && form.version && selectedItems.length > 0

  const allFilteredSelected = allItems.length > 0 && allItems.every(item => selectedItems.some(s => s.id === item.id))
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedItems(selectedItems.filter(s => !allItems.some(f => f.id === s.id)))
    } else {
      const toAdd = allItems.filter(f => !selectedItems.some(s => s.id === f.id))
      setSelectedItems([...selectedItems, ...toAdd])
    }
  }

  const createRelease = async () => {
    if (!canSubmit) { toast.warning('请填写完整信息并选择至少一个 Checklist 项'); return }
    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, version: form.version, description: form.description,
          checklistItemIds: selectedItems.map(item => item.id)
        })
      })
      const release = await res.json()
      toast.success('发布单创建成功')
      router.push(`/releases/${release.id}`)
    } catch { toast.error('创建失败') }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">新建任务</h1>
            <p className="text-slate-500 text-sm mt-1">填写任务信息并选择需要执行的检查项</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <h2 className="text-base font-semibold text-slate-700 mb-6">基本信息</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">任务名称 <span className="text-red-400">*</span></Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="输入任务名称" className="h-10" />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">版本号</Label>
              <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="v1.0.0" className="h-10" />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">描述</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="输入描述（可选）" className="h-10" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-semibold text-slate-700">选择 Checklist 项</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {selectedItems.length} 项已选中
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setShowAll(false)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    !showAll ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"
                  )}
                >空闲</button>
                <button
                  onClick={() => setShowAll(true)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    showAll ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"
                  )}
                >全部</button>
              </div>
              <CustomSelect value={filterType} onValueChange={setFilterType} placeholder="所有类型" className="w-[120px]">
                <CustomSelectItem value="">所有类型</CustomSelectItem>
                <CustomSelectItem value="config">配置修改</CustomSelectItem>
                <CustomSelectItem value="sql">SQL 变更</CustomSelectItem>
                <CustomSelectItem value="deploy">代码部署</CustomSelectItem>
                <CustomSelectItem value="restart">服务重启</CustomSelectItem>
                <CustomSelectItem value="other">其他</CustomSelectItem>
              </CustomSelect>
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg">没有可用的检查项</p>
              <p className="text-sm mt-2">请先在检查清单中添加项，或切换到"全部"查看所有项</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] pl-6">
                      <Checkbox checked={allFilteredSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-[50px] text-xs text-slate-400 font-mono">ID</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-[110px]">类型</TableHead>
                    <TableHead className="w-[90px]">优先级</TableHead>
                    <TableHead className="pr-6">描述</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.map(item => (
                    <TableRow key={item.id} className={cn(selectedItems.some(s => s.id === item.id) && "bg-blue-50/60")}>
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={selectedItems.some(s => s.id === item.id)}
                          onCheckedChange={checked => {
                            if (checked) setSelectedItems([...selectedItems, item])
                            else setSelectedItems(selectedItems.filter(s => s.id !== item.id))
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-400 font-mono">{item.id}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-slate-800">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.changes?.length > 0
                            ? item.changes.map((c: any) => (
                                <span key={c.id || c.sortOrder} className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                  typeStyles[c.type] || typeStyles.other
                                )}>
                                  {typeLabels[c.type] || c.type}
                                </span>
                              ))
                            : <span className="text-xs text-slate-400">-</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={cn("w-2 h-2 rounded-full", priorityDotColors[item.priority])} />
                          <span className={cn(
                            item.priority === 'high' ? 'text-red-600' : item.priority === 'medium' ? 'text-amber-600' : 'text-slate-500'
                          )}>{priorityLabels[item.priority]}</span>
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <span className="text-sm text-slate-500 line-clamp-2">{item.description || '-'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button variant="outline" onClick={() => router.push('/releases')} className="px-6">取消</Button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {selectedItems.length > 0 && <span>已选择 {selectedItems.length} 项</span>}
              <Button onClick={createRelease} disabled={!canSubmit} className="px-8" size="lg">
                创建任务
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
