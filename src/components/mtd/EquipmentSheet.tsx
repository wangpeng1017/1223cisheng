"use client"

import { useState, useEffect } from "react"
import { Drawer, Button, Input, Select } from "antd"
import { FileTextOutlined } from "@ant-design/icons"

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
    <Drawer
      title={equipment ? "编辑设备" : "添加设备"}
      open={open}
      onClose={() => onOpenChange(false)}
      width={480}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>保存</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-sm font-medium">设备名称 *</div>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="KEYENCE"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-sm font-medium">制造商</div>
            <Input
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="KEYENCE Corp"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">型号</div>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="IM7010"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-sm font-medium">量程</div>
            <Input
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              placeholder="0-100mm"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">分辨率</div>
            <Input
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              placeholder="0.01mm"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">精度</div>
            <Input
              value={formData.accuracy}
              onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
              placeholder="±0.001mm"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">PPT 模板</div>
          <div className="flex gap-2">
            <Select
              value={formData.ppt_template_id}
              onChange={(v) => setFormData({ ...formData, ppt_template_id: v })}
              placeholder="选择模板"
              className="flex-1"
              allowClear
              options={templates.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.slide_count}页)`,
              }))}
            />
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                onOpenChange(false)
                onOpenTemplateManage()
              }}
              title="管理模板"
            />
          </div>
        </div>
      </div>
    </Drawer>
  )
}
