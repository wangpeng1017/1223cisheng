"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Trash2, FileText, Check } from "lucide-react"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  filename: string
  size: number
  createdAt: Date
  url: string
  thumbnailUrl?: string
}

interface TemplateSelectorProps {
  selectedTemplate?: string
  onTemplateChange: (templateId: string) => void
  disabled?: boolean
}

export function TemplateSelector({ selectedTemplate, onTemplateChange, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/ppt/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)

        // 如果没有选中模板且第一个不是"default"，则默认选中第一个
        if (!selectedTemplate && data.length > 0) {
          onTemplateChange(data[0].id)
        }
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      toast.error('加载模板失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 上传模板
  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.pptx')) {
      toast.error('只支持PPTX格式文件')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ppt/templates', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('模板上传成功')
        loadTemplates() // 重新加载模板列表
      } else {
        toast.error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传模板失败:', error)
      toast.error('上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  // 删除模板
  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('确定要删除这个模板吗？')) {
      return
    }

    try {
      const res = await fetch(`/api/ppt/templates?id=${encodeURIComponent(templateId)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('模板删除成功')
        // 如果删除的是当前选中的模板，则选中第一个
        if (selectedTemplate === templateId) {
          const remaining = templates.filter(t => t.id !== templateId)
          if (remaining.length > 0) {
            onTemplateChange(remaining[0].id)
          }
        }
        loadTemplates()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      console.error('删除模板失败:', error)
      toast.error('删除失败')
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label>选择模板</Label>
        <div className="flex items-center justify-center py-8 border rounded-lg bg-slate-50">
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>选择模板</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Upload className="h-4 w-4" />
          {isUploading ? '上传中...' : '上传模板'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
          }}
        />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-slate-50">
          <FileText className="h-12 w-12 mx-auto text-slate-400 mb-3" />
          <p className="text-sm text-slate-500 mb-2">暂无模板</p>
          <p className="text-xs text-slate-400">上传PPTX文件作为模板</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => !disabled && onTemplateChange(template.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedTemplate === template.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span className="flex-1 text-sm font-medium truncate">
                      {template.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                    onClick={(e) => handleDelete(template.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {(template.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Check className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-emerald-700">
            已选择: <span className="font-medium">{templates.find(t => t.id === selectedTemplate)?.name}</span>
          </span>
        </div>
      )}
    </div>
  )
}
