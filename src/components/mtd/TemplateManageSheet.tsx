"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { PPTTemplateUpload } from "@/components/ppt-template-upload"
import type { PPTTemplate } from "@/components/ppt-template-upload"

const API_BASE = "http://8.130.182.148:8001/api"

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{entityType === "equipment" ? "设备" : "夹具"}模板管理</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <PPTTemplateUpload
            entityType={entityType}
            onSelect={handleSelectTemplate}
            selectedTemplateId={selectedTemplate || undefined}
          />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
