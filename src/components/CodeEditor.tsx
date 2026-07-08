"use client"

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import hljs from 'highlight.js'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  placeholder?: string
  highlights?: Record<number, string>
  onHighlightsChange?: (highlights: Record<number, string>) => void
}

const langMap: Record<string, string> = {
  shell: 'bash',
  text: 'plaintext',
}

const HIGHLIGHT_COLORS = [
  { key: 'none', bg: 'transparent', label: '清除' },
  { key: 'yellow', bg: 'rgba(251, 191, 36, 0.2)', label: '黄' },
  { key: 'red', bg: 'rgba(239, 68, 68, 0.2)', label: '红' },
  { key: 'green', bg: 'rgba(34, 197, 94, 0.2)', label: '绿' },
  { key: 'blue', bg: 'rgba(59, 130, 246, 0.2)', label: '蓝' },
]

export default function CodeEditor({
  value, onChange, language, placeholder,
  highlights = {}, onHighlightsChange,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [highlighted, setHighlighted] = useState('')

  const highlight = useCallback((code: string) => {
    if (!code) return ''
    const lang = langMap[language || ''] || language || 'plaintext'
    try {
      const validLang = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language: validLang }).value
    } catch {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
  }, [language])

  useEffect(() => {
    setHighlighted(highlight(value))
  }, [value, highlight])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(160, textareaRef.current.scrollHeight) + 'px'
    }
  }, [value])

  const lineCount = useMemo(() => (value || '').split('\n').length, [value])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleScroll = () => {
    if (textareaRef.current) {
      if (preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop
        preRef.current.scrollLeft = textareaRef.current.scrollLeft
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  const toggleHighlight = (lineNumber: number) => {
    const current = highlights[lineNumber]
    const keys = HIGHLIGHT_COLORS.map(c => c.key)
    const currentIdx = keys.indexOf(current || 'none')
    const nextIdx = (currentIdx + 1) % keys.length
    const nextKey = keys[nextIdx]

    const newHighlights = { ...highlights }
    if (nextKey === 'none') {
      delete newHighlights[lineNumber]
    } else {
      newHighlights[lineNumber] = nextKey
    }
    onHighlightsChange?.(newHighlights)
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-[#334155] font-mono">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-[#0f172a] border-b border-[#1e293b]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400"></span>
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
        </div>
        <span className="text-xs font-medium text-slate-400 ml-2 uppercase tracking-wide">
          {language || 'text'}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-500">点击行号切换标记颜色</span>
      </div>
      <div className="flex bg-[#0f172a] overflow-hidden">
        <div
          ref={gutterRef}
          className="overflow-hidden flex-shrink-0 border-r border-[#1e293b] select-none"
        >
          <div style={{ paddingTop: 14 }}>
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => {
            const lineNum = i + 1
            const colorKey = highlights[lineNum]
            const colorDef = HIGHLIGHT_COLORS.find(c => c.key === colorKey)
            return (
              <div
                key={i}
                onClick={() => toggleHighlight(lineNum)}
                className="flex items-center justify-end cursor-pointer transition-colors"
                style={{
                  height: '20.8px',
                  paddingRight: 8,
                  minWidth: 48,
                  lineHeight: '20.8px',
                  backgroundColor: colorDef?.bg || 'transparent',
                }}
              >
                <span className={colorKey ? 'text-xs text-slate-200' : 'text-[10px] text-slate-600'}>
                  {lineNum}
                </span>
              </div>
            )
          })}
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <pre
            ref={preRef}
            className="absolute top-0 left-0 w-full h-full m-0 p-3.5 bg-transparent text-[13px] leading-[1.6] whitespace-pre-wrap break-all overflow-auto pointer-events-none text-[#e2e8f0]"
            aria-hidden="true"
          >
            <code
              dangerouslySetInnerHTML={{ __html: highlighted }}
              className="bg-transparent"
            />
          </pre>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '粘贴配置内容...'}
            spellCheck={false}
            autoComplete="off"
            className="relative block w-full min-h-[160px] p-3.5 bg-transparent border-none outline-none resize-none text-[13px] leading-[1.6] text-transparent caret-[#e2e8f0] whitespace-pre-wrap break-all overflow-hidden placeholder:text-[#475569]"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
      {Object.keys(highlights).length > 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0a0f1a] border-t border-[#1e293b]">
          <span className="text-[10px] text-slate-500">标记：</span>
          {HIGHLIGHT_COLORS.filter(c => c.key !== 'none').map(c => (
            <button
              key={c.key}
              onClick={() => {
                const newH = { ...highlights }
                Object.keys(newH).forEach(k => { delete newH[Number(k)] })
                onHighlightsChange?.(newH)
              }}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
            >
              <span className="w-3 h-3 rounded" style={{ backgroundColor: c.bg, border: '1px solid rgba(255,255,255,0.15)' }} />
              {Object.values(highlights).filter(v => v === c.key).length}
            </button>
          ))}
          {Object.keys(highlights).length > 0 && (
            <button
              onClick={() => onHighlightsChange?.({})}
              className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto"
            >清除全部</button>
          )}
        </div>
      )}
      <style>{`
        .hljs { color: #abb2bf; }
        .hljs-keyword { color: #c678dd; }
        .hljs-string { color: #98c379; }
        .hljs-comment { color: #5c6370; font-style: italic; }
        .hljs-number { color: #d19a66; }
        .hljs-built_in { color: #61afef; }
        .hljs-function { color: #61afef; }
        .hljs-title { color: #61afef; }
        .hljs-title.class_ { color: #e5c07b; }
        .hljs-title.function_ { color: #61afef; }
        .hljs-attr { color: #d19a66; }
        .hljs-attribute { color: #e06c75; }
        .hljs-variable { color: #e06c75; }
        .hljs-variable.language_ { color: #e06c75; }
        .hljs-variable.constant_ { color: #d19a66; }
        .hljs-operator { color: #56b6c2; }
        .hljs-punctuation { color: #abb2bf; }
        .hljs-tag { color: #e06c75; }
        .hljs-name { color: #e06c75; }
        .hljs-selector-class { color: #e5c07b; }
        .hljs-selector-tag { color: #e06c75; }
        .hljs-literal { color: #d19a66; }
        .hljs-type { color: #e5c07b; }
        .hljs-symbol { color: #56b6c2; }
        .hljs-meta { color: #61afef; }
        .hljs-meta.string { color: #98c379; }
        .hljs-subst { color: #abb2bf; }
        .hljs-section { color: #e06c75; font-weight: bold; }
        .hljs-bullet { color: #e5c07b; }
        .hljs-link { color: #61afef; text-decoration: underline; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
        .hljs-addition { color: #98c379; background: rgba(152,195,121,0.1); }
        .hljs-deletion { color: #e06c75; background: rgba(224,108,117,0.1); }
        .hljs-params { color: #abb2bf; }
        .hljs-property { color: #e06c75; }
        .hljs-regexp { color: #56b6c2; }
      `}</style>
    </div>
  )
}
