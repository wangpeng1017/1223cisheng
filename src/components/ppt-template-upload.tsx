"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Trash2, Eye, Check } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://8.130.182.148:8001/api"

export interface PPTTemplate {
  id: number
  name: string
  entity_type: string
  file_path: string
  slide_count: number
  thumbnail_path: string
  placeholders: Array<{ key: string; default: string }>
  created_at: string
}

interface PPTTemplateUploadProps {
  entityType: "equipment" | "fixture"
  onSelect?: (templateId: number, slideIndex: number) => void
  selectedTemplateId?: number
  selectedSlideIndex?: number
}

export function PPTTemplateUpload({
  entityType,
  onSelect,
  selectedTemplateId,
  selectedSlideIndex = 1
}: PPTTemplateUploadProps) {
  const [templates, setTemplates] = useState<PPTTemplate[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PPTTemplate | null>(null)
  const [slides, setSlides] = useState<Array<{ index: number; text_preview: string; placeholders: string[] }>>([])

  useEffect(() => {
    fetchTemplates()
  }, [entityType])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/ppt/templates?entity_type=${entityType}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (e) {
      console.error("获取模板失败:", e)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    if (templateName) {
      formData.append("name", templateName)
    }
    formData.append("entity_type", entityType)

    try {
      const res = await fetch(`${API_BASE}/ppt/templates/upload`, {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const newTemplate = await res.json()
        setTemplates([...templates, newTemplate])
        setSelectedFile(null)
        setTemplateName("")
        alert("模板上传成功！")
      } else {
        const err = await res.json()
        alert(`上传失败: ${err.detail || "未知错误"}`)
      }
    } catch (e) {
      console.error("上传失败:", e)
      alert("上传失败，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此模板？")) return

    try {
      const res = await fetch(`${API_BASE}/ppt/templates/${id}`, { method: "DELETE" })
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id))
      }
    } catch (e) {
      console.error("删除失败:", e)
    }
  }

  const handlePreview = async (template: PPTTemplate) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)

    try {
      const res = await fetch(`${API_BASE}/ppt/templates/${template.id}/slides`)
      if (res.ok) {
        const data = await res.json()
        setSlides(data.slides || [])
      }
    } catch (e) {
      console.error("获取页面信息失败:", e)
    }
  }

  const handleSelectTemplate = (templateId: number, slideIndex: number) => {
    onSelect?.(templateId, slideIndex)
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            上传 PPT 模板
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept=".pptx,.ppt"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            disabled={uploading}
          />
          <Input
            placeholder="模板名称（可选，默认使用文件名）"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={uploading}
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
            size="sm"
          >
            {uploading ? "上传中..." : "上传模板"}
          </Button>
          <p className="text-xs text-muted-foreground">
            支持 .pptx 格式，上传后将自动解析占位符（格式：[名称]）
          </p>
        </CardContent>
      </Card>

      {/* 模板列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {entityType === "equipment" ? "设备" : "夹具"}模板库
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无模板</p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedTemplateId === template.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.slide_count} 页 · {template.placeholders.length} 个占位符
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(template)}
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    {onSelect && (
                      <Button
                        variant={selectedTemplateId === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectTemplate(template.id, 1)}
                      >
                        {selectedTemplateId === template.id ? <Check className="w-4 h-4 mr-1" /> : null}
                        选择
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模板预览 - {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {slides.map((slide) => (
              <Card key={slide.index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">第 {slide.index} 页</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {slide.text_preview || "无文本内容"}
                  </p>
                  {slide.placeholders.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {slide.placeholders.map((ph, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          [{ph}]
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
