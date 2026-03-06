"use client"

import { useState, useEffect } from "react"
import { Drawer, Button, Input, Select } from "antd"
import { FileTextOutlined } from "@ant-design/icons"

const API_BASE = "http://8.130.182.148:8001/api"

interface Fixture {
  id: number
  fixture_no: string
  size: string
  material: string
  remark?: string
  ppt_template_id?: number | null
  ppt_slide_index?: number
}

interface PPTTemplate {
  id: number
  name: string
  entity_type: string
  slide_count: number
}

interface FixtureSheetProps {
  fixture?: Fixture | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onOpenTemplateManage: () => void
}

export function FixtureSheet({
  fixture,
  open,
  onOpenChange,
  onSave,
  onOpenTemplateManage
}: FixtureSheetProps) {
  const [templates, setTemplates] = useState<PPTTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    fixture_no: "",
    size: "",
    material: "",
    remark: "",
    ppt_template_id: null as number | null,
    ppt_slide_index: 1
  })

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  useEffect(() => {
    if (fixture) {
      setFormData({
        fixture_no: fixture.fixture_no,
        size: fixture.size || "",
        material: fixture.material || "",
        remark: fixture.remark || "",
        ppt_template_id: fixture.ppt_template_id || null,
        ppt_slide_index: fixture.ppt_slide_index || 1
      })
    } else {
      setFormData({
        fixture_no: "",
        size: "",
        material: "",
        remark: "",
        ppt_template_id: null,
        ppt_slide_index: 1
      })
    }
  }, [fixture, open])

  const fetchTemplates = async () => {
    const res = await fetch(`${API_BASE}/ppt/templates?entity_type=fixture`)
    if (res.ok) setTemplates(await res.json())
  }

  const handleSave = async () => {
    if (!formData.fixture_no) {
      alert("请填写夹具编号")
      return
    }

    setLoading(true)
    try {
      const url = fixture
        ? `${API_BASE}/mtd/fixtures/${fixture.id}`
        : `${API_BASE}/mtd/fixtures`

      const method = fixture ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixture_no: formData.fixture_no,
          size: formData.size,
          material: formData.material,
          remark: formData.remark
        })
      })

      if (res.ok) {
        // 如果有模板绑定，单独处理
        if (formData.ppt_template_id) {
          const fixtureId = fixture?.id || (await res.json()).id
          await fetch(`${API_BASE}/ppt/templates/fixture/${fixtureId}/template`, {
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
      title={fixture ? "编辑夹具" : "添加夹具"}
      open={open}
      onClose={() => onOpenChange(false)}
      width={440}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>保存</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-sm font-medium">夹具编号 *</div>
          <Input
            value={formData.fixture_no}
            onChange={(e) => setFormData({ ...formData, fixture_no: e.target.value })}
            placeholder="J-J510-1#"
          />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">尺寸</div>
          <Input
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            placeholder="189*36*12"
          />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">材料</div>
          <Input
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            placeholder="Electric board"
          />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">备注</div>
          <Input
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            placeholder="可选备注"
          />
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
