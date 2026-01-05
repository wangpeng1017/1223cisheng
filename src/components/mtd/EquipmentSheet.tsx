"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"

const API_BASE = "http://8.130.182.148:8001/api"

interface Equipment {
  id: number
  name: string
  manufacturer: string
  model: string
  specs?: Record<string, string>
  ppt_template_id?: number | null
  ppt_slide_index?: number
}

interface PPTTemplate {
  id: number
  name: string
  entity_type: string
  slide_count: number
}

interface EquipmentSheetProps {
  equipment?: Equipment | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onOpenTemplateManage: () => void
}

export function EquipmentSheet({
  equipment,
  open,
  onOpenChange,
  onSave,
  onOpenTemplateManage
}: EquipmentSheetProps) {
  const [templates, setTemplates] = useState<PPTTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    manufacturer: "",
    model: "",
    range: "",
    resolution: "",
    accuracy: "",
    ppt_template_id: null as number | null,
    ppt_slide_index: 1
  })

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        manufacturer: equipment.manufacturer || "",
        model: equipment.model || "",
        range: equipment.specs?.range || "",
        resolution: equipment.specs?.resolution || "",
        accuracy: equipment.specs?.accuracy || "",
        ppt_template_id: equipment.ppt_template_id || null,
        ppt_slide_index: equipment.ppt_slide_index || 1
      })
    } else {
      setFormData({
        name: "",
        manufacturer: "",
        model: "",
        range: "",
        resolution: "",
        accuracy: "",
        ppt_template_id: null,
        ppt_slide_index: 1
      })
    }
  }, [equipment, open])

  const fetchTemplates = async () => {
    const res = await fetch(`${API_BASE}/ppt/templates?entity_type=equipment`)
    if (res.ok) setTemplates(await res.json())
  }

  const handleSave = async () => {
    if (!formData.name) {
      alert("请填写设备名称")
      return
    }

    setLoading(true)
    try {
      const url = equipment
        ? `${API_BASE}/mtd/equipment/${equipment.id}`
        : `${API_BASE}/mtd/equipment`

      const method = equipment ? "PUT" : "POST"

      const payload = {
        name: formData.name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        specs: {
          range: formData.range,
          resolution: formData.resolution,
          accuracy: formData.accuracy
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        // 如果有模板绑定，单独处理
        if (formData.ppt_template_id) {
          const equipmentId = equipment?.id || (await res.json()).id
          await fetch(`${API_BASE}/ppt/templates/equipment/${equipmentId}/template`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              template_id: formData.ppt_template_id,
              slide_index: formData.ppt_slide_index
            })
          })
        }
        onSave()
        onOpenChange(false)
      } else {
        alert("保存失败")
      }
    } catch (e) {
      alert("保存失败: " + e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{equipment ? "编辑设备" : "添加设备"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <Label>设备名称 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="KEYENCE"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>制造商</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="KEYENCE Corp"
              />
            </div>
            <div>
              <Label>型号</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="IM7010"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>量程</Label>
              <Input
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                placeholder="0-100mm"
              />
            </div>
            <div>
              <Label>分辨率</Label>
              <Input
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="0.01mm"
              />
            </div>
            <div>
              <Label>精度</Label>
              <Input
                value={formData.accuracy}
                onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
                placeholder="±0.001mm"
              />
            </div>
          </div>

          <div>
            <Label>PPT 模板</Label>
            <div className="flex gap-2">
              <Select
                value={formData.ppt_template_id?.toString() || ""}
                onValueChange={(v) => setFormData({ ...formData, ppt_template_id: parseInt(v) })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择模板" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name} ({t.slide_count}页)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  onOpenChange(false)
                  onOpenTemplateManage()
                }}
                title="管理模板"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
