"use client"

import React, { useRef, useCallback, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { HighlightSpan } from '@/types'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  placeholder?: string
  highlights?: HighlightSpan[]
  onHighlightsChange?: (highlights: HighlightSpan[]) => void
}

const langMap: Record<string, string> = { shell: 'shell', text: 'plaintext' }

const HIGHLIGHT_BG: Record<string, string> = {
  yellow: 'rgba(251,191,36,0.25)',
  red: 'rgba(239,68,68,0.25)',
  green: 'rgba(34,197,94,0.25)',
  blue: 'rgba(59,130,246,0.25)',
}

const COLORS = ['yellow', 'red', 'green', 'blue'] as const
const LABELS: Record<string, string> = { yellow: '黄色', red: '红色', green: '绿色', blue: '蓝色' }

export default function CodeEditor({
  value, onChange, language, highlights = [], onHighlightsChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])
  const monacoLang = langMap[language || ''] || language || 'plaintext'

  const updateHighlights = useCallback((spans: HighlightSpan[]) => {
    const instance = editorRef.current
    if (!instance) return
    if (!Array.isArray(spans)) return

    const decs: editor.IModelDeltaDecoration[] = []
    const classSet = new Set<string>()

    for (const s of spans) {
      const bg = HIGHLIGHT_BG[s.color]
      if (!bg) continue
      const cls = `hl-${s.startLine}-${s.startCol}-${s.endLine}-${s.endCol}`
      classSet.add(`${cls}{background:${bg};border-radius:2px}`)

      decs.push({
        range: {
          startLineNumber: s.startLine, startColumn: s.startCol,
          endLineNumber: s.endLine, endColumn: s.endCol,
        },
        options: { inlineClassName: cls },
      })
    }

    let styleEl = document.getElementById('monaco-hl-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'monaco-hl-style'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = Array.from(classSet).join('\n')

    decorationsRef.current = instance.deltaDecorations(decorationsRef.current, decs)
  }, [])

  const handleMount: OnMount = useCallback((instance, monaco) => {
    editorRef.current = instance

    // Add right-click actions for each color
    COLORS.forEach((color, i) => {
      instance.addAction({
        id: `mark-${color}`,
        label: `标记${LABELS[color]}`,
        contextMenuGroupId: 'highlight',
        contextMenuOrder: i + 1,
        run: () => {
          if (!onHighlightsChange) return
          const sel = instance.getSelection()
          if (!sel || sel.isEmpty()) return
          const span: HighlightSpan = {
            startLine: sel.startLineNumber, startCol: sel.startColumn,
            endLine: sel.endLineNumber, endCol: sel.endColumn,
            color,
          }
          onHighlightsChange([...highlights, span])
        },
      })
    })

    instance.addAction({
      id: 'clear-marks',
      label: '清除所有标记',
      contextMenuGroupId: 'highlight',
      contextMenuOrder: 9,
      run: () => onHighlightsChange?.([]),
    })

    updateHighlights(highlights)
  }, [])

  useEffect(() => { updateHighlights(highlights) }, [highlights, updateHighlights])

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-medium text-slate-400 ml-2 uppercase tracking-wide">{monacoLang}</span>
      </div>
      <Editor
        height="200px"
        language={monacoLang}
        value={value}
        onChange={v => onChange(v || '')}
        onMount={handleMount}
        loading={<div className="bg-[#1e1e1e] h-[200px] flex items-center justify-center text-slate-500 text-sm">加载编辑器...</div>}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
          tabSize: 2,
          insertSpaces: true,
          autoIndent: 'full',
          wordWrap: 'on',
          automaticLayout: true,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          renderLineHighlight: 'none',
          padding: { top: 8 },
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
        theme="vs-dark"
      />
      {highlights.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900 border-t border-slate-700">
          <span className="text-[10px] text-slate-500">标记：</span>
          {COLORS.map(c => {
            const count = highlights.filter(h => h.color === c).length
            return count > 0 ? (
              <span key={c} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: HIGHLIGHT_BG[c], border: '1px solid rgba(255,255,255,0.2)' }} />
                {count}
              </span>
            ) : null
          })}
          <button onClick={() => onHighlightsChange?.([])} className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto">清除全部</button>
        </div>
      )}
    </div>
  )
}
