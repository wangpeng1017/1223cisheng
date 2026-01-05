"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_BASE = "http://8.130.182.148:8001/api"

interface MTDProject {
  id: number
  project_name: string
  part_number: string
  vendor: string
  revision: string
  equipment_ids: number[]
  fixture_ids: number[]
  fai_extraction_id: number | null
  created_at: string
}

interface Equipment { id: number; name: string; manufacturer: string; model: string }
interface Fixture { id: number; fixture_no: string; size: string; material: string }
interface FAIExtraction { id: number; file_name: string; item_count: number }

interface ProjectSheetProps {
  project?: MTDProject | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function ProjectSheet({ project, open, onOpenChange, onSave }: ProjectSheetProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [extractions, setExtractions] = useState<FAIExtraction[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    project_name: "",
    part_number: "",
    vendor: "",
    revision: "01",
    equipment_ids: [] as number[],
    fixture_ids: [] as number[],
    fai_extraction_id: null as number | null
  })

  useEffect(() => {
    if (open) {
      fetchEquipment()
      fetchFixtures()
      fetchExtractions()
    }
  }, [open])

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name,
        part_number: project.part_number,
        vendor: project.vendor || "",
        revision: project.revision || "01",
        equipment_ids: project.equipment_ids || [],
        fixture_ids: project.fixture_ids || [],
        fai_extraction_id: project.fai_extraction_id
      })
    } else {
      setFormData({
        project_name: "",
        part_number: "",
        vendor: "",
        revision: "01",
        equipment_ids: [],
        fixture_ids: [],
        fai_extraction_id: null
      })
    }
  }, [project, open])

  const fetchEquipment = async () => {
    const res = await fetch(`${API_BASE}/mtd/equipment`)
    if (res.ok) setEquipment(await res.json())
  }

  const fetchFixtures = async () => {
    const res = await fetch(`${API_BASE}/mtd/fixtures`)
    if (res.ok) setFixtures(await res.json())
  }

  const fetchExtractions = async () => {
    const res = await fetch(`${API_BASE}/extractions`)
    if (res.ok) setExtractions(await res.json())
  }

  const handleSave = async () => {
    if (!formData.project_name || !formData.part_number) {
      alert("请填写项目名称和料号")
      return
    }

    setLoading(true)
    try {
      const url = project
        ? `${API_BASE}/mtd/projects/${project.id}`
        : `${API_BASE}/mtd/projects`

      const method = project ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
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

  const toggleEquipment = (id: number) => {
    setFormData(p => ({
      ...p,
      equipment_ids: p.equipment_ids.includes(id)
        ? p.equipment_ids.filter(x => x !== id)
        : [...p.equipment_ids, id]
    }))
  }

  const toggleFixture = (id: number) => {
    setFormData(p => ({
      ...p,
      fixture_ids: p.fixture_ids.includes(id)
        ? p.fixture_ids.filter(x => x !== id)
        : [...p.fixture_ids, id]
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{project ? "编辑项目" : "新建项目"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <Label>项目名称 *</Label>
            <Input
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="J510"
            />
          </div>

          <div>
            <Label>料号 *</Label>
            <Input
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              placeholder="160-06631-01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>供应商</Label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="MAGSOUND"
              />
            </div>
            <div>
              <Label>版本</Label>
              <Input
                value={formData.revision}
                onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                placeholder="01"
              />
            </div>
          </div>

          <div>
            <Label>FAI 数据源</Label>
            <Select
              value={formData.fai_extraction_id?.toString() || ""}
              onValueChange={(v) => setFormData({ ...formData, fai_extraction_id: v ? parseInt(v) : null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择 FAI 提取记录" />
              </SelectTrigger>
              <SelectContent>
                {extractions.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id.toString()}>
                    {ex.file_name} ({ex.item_count} 项)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>关联设备</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`eq-${eq.id}`}
                      checked={formData.equipment_ids.includes(eq.id)}
                      onCheckedChange={() => toggleEquipment(eq.id)}
                    />
                    <Label htmlFor={`eq-${eq.id}`} className="text-sm cursor-pointer">
                      {eq.name} - {eq.model}
                    </Label>
                  </div>
                ))}
                {equipment.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无设备</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <Label>关联夹具</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {fixtures.map((f) => (
                  <div key={f.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fix-${f.id}`}
                      checked={formData.fixture_ids.includes(f.id)}
                      onCheckedChange={() => toggleFixture(f.id)}
                    />
                    <Label htmlFor={`fix-${f.id}`} className="text-sm cursor-pointer">
                      {f.fixture_no} - {f.size}
                    </Label>
                  </div>
                ))}
                {fixtures.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无夹具</p>
                )}
              </div>
            </ScrollArea>
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
