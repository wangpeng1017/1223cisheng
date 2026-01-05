"use client"

import { useState, useEffect } from "react"
import { Button, Card, Input, Modal, Upload, message } from "antd"
import { UploadOutlined, FileTextOutlined, DeleteOutlined, EyeOutlined, CheckOutlined, DownloadOutlined } from "@ant-design/icons"

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")

  useEffect(() => {
    fetchTemplates()
  }, [entityType])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(API_BASE + "/ppt/templates?entity_type=" + entityType)
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
      const res = await fetch(API_BASE + "/ppt/templates/upload", {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const newTemplate = await res.json()
        setTemplates([...templates, newTemplate])
        setSelectedFile(null)
        setTemplateName("")
        message.success("模板上传成功！")
      } else {
        const err = await res.json()
        message.error("上传失败: " + (err.detail || "未知错误"))
      }
    } catch (e) {
      console.error("上传失败:", e)
      message.error("上传失败，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定删除此模板？",
      onOk: async () => {
        try {
          const res = await fetch(API_BASE + "/ppt/templates/" + id, { method: "DELETE" })
          if (res.ok) {
            setTemplates(templates.filter(t => t.id !== id))
            message.success("删除成功")
          }
        } catch (e) {
          console.error("删除失败:", e)
          message.error("删除失败")
        }
      }
    })
  }

  const handlePreview = async (template: PPTTemplate) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
    setThumbnailUrl(API_BASE + "/ppt/templates/" + template.id + "/thumbnail?t=" + Date.now())

    try {
      const res = await fetch(API_BASE + "/ppt/templates/" + template.id + "/slides")
      if (res.ok) {
        const data = await res.json()
        setSlides(data.slides || [])
      }
    } catch (e) {
      console.error("获取页面信息失败:", e)
    }
  }

  const handleDownloadTemplate = async (template: PPTTemplate) => {
    try {
      const res = await fetch(API_BASE + "/ppt/templates/" + template.id + "/download", {
        method: "GET"
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = template.name + ".pptx"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (e) {
      console.error("下载失败:", e)
      message.error("下载失败，请重试")
    }
  }

  const handleSelectTemplate = (templateId: number, slideIndex: number) => {
    onSelect?.(templateId, slideIndex)
  }

  return (
    <div className="space-y-4">
      <Card
        title={
          <span className="flex items-center gap-2 text-sm">
            <UploadOutlined />
            上传 PPT 模板
          </span>
        }
        size="small"
      >
        <div className="space-y-3">
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
            type="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            block
            size="small"
          >
            {uploading ? "上传中..." : "上传模板"}
          </Button>
          <p className="text-xs text-gray-500">
            支持 .pptx 格式，上传后将自动解析占位符（格式：[名称]）
          </p>
        </div>
      </Card>

      <Card
        title={
          <span className="flex items-center gap-2 text-sm">
            <FileTextOutlined />
            {entityType === "equipment" ? "设备" : "夹具"}模板库
          </span>
        }
        size="small"
      >
        {templates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无模板</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`relative group rounded-lg border transition-all ${selectedTemplateId === template.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <div
                  className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => handlePreview(template)}
                >
                  <FileTextOutlined className="text-2xl text-gray-400" />
                </div>

                <div className="p-2">
                  <p className="text-xs font-medium truncate">{template.name}</p>
                  <p className="text-xs text-gray-500">
                    {template.slide_count} 页
                  </p>
                </div>

                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(template)}
                    title="预览"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadTemplate(template)}
                    title="下载编辑"
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(template.id)}
                    title="删除"
                  />
                </div>

                {onSelect && (
                  <Button
                    type={selectedTemplateId === template.id ? "primary" : "default"}
                    size="small"
                    block
                    className="mt-1"
                    onClick={() => handleSelectTemplate(template.id, 1)}
                    icon={selectedTemplateId === template.id ? <CheckOutlined /> : null}
                  >
                    选择
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={`模板预览 - ${previewTemplate?.name}`}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewTemplate && handleDownloadTemplate(previewTemplate)}
          >
            下载编辑
          </Button>,
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>
        ]}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {thumbnailUrl && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">模板预览图</p>
              <img
                src={thumbnailUrl}
                alt="Template preview"
                className="w-full h-auto rounded border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2394a3b8'%3E预览图生成中...%3C/text%3E%3C/svg%3E"
                }}
              />
            </div>
          )}

          {slides.map((slide) => (
            <Card key={slide.index} size="small" title={`第 ${slide.index} 页`}>
              <p className="text-sm text-gray-500 mb-2">
                {slide.text_preview || "无文本内容"}
              </p>
              {slide.placeholders.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {slide.placeholders.map((ph, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded"
                    >
                      [{ph}]
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  )
}
