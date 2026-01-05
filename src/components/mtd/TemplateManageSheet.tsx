"use client"

import { useState } from "react"
import { Drawer, Button } from "antd"
import { PPTTemplateUpload } from "@/components/ppt-template-upload"
import type { PPTTemplate } from "@/components/ppt-template-upload"

interface TemplateManageSheetProps {
  entityType: "equipment" | "fixture"
  itemId?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateSelected: (templateId: number, slideIndex: number) => void
}

export function TemplateManageSheet({
  entityType,
  itemId,
  open,
  onOpenChange,
  onTemplateSelected
}: TemplateManageSheetProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  const handleSelectTemplate = (templateId: number, slideIndex: number) => {
    setSelectedTemplate(templateId)
    onTemplateSelected(templateId, slideIndex)
    onOpenChange(false)
  }

  return (
    <Drawer
      title={`${entityType === "equipment" ? "设备" : "夹具"}模板管理`}
      open={open}
      onClose={() => onOpenChange(false)}
      width={480}
      footer={
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      }
    >
      <PPTTemplateUpload
        entityType={entityType}
        onSelect={handleSelectTemplate}
        selectedTemplateId={selectedTemplate || undefined}
      />
    </Drawer>
  )
}
