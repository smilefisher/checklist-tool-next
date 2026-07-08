export enum ChecklistType {
  CONFIG = 'config',
  SQL = 'sql',
  DEPLOY = 'deploy',
  RESTART = 'restart',
  OTHER = 'other'
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ReleaseStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface ChecklistChange {
  id: string
  checklistItemId: string
  type: ChecklistType
  description: string
  code?: string
  codeLanguage?: string
  sortOrder: number
  createdAt: string
  highlights?: Record<number, string>
}

export interface ChecklistItem {
  id: string
  title: string
  priority: Priority
  description: string
  isActive: boolean
  createdAt: string
  referenceCount?: number
  changes?: ChecklistChange[]
}

export interface Release {
  id: string
  name: string
  version: string
  status: ReleaseStatus
  description: string
  createdAt: string
}

export interface ReleaseChecklistItem {
  id: string
  releaseId: string
  checklistItemId: string
  checklistItem?: ChecklistItem
  isChecked: boolean
  checkedAt?: string
  note: string
  sortOrder: number
}
