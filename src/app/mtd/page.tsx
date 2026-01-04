"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Settings, Wrench, Package, FileDown, Trash2, Loader2, Edit2, FileText } from "lucide-react"
import { generateMTDPPT } from "@/lib/ppt-generator"
import { ProjectSheet, EquipmentSheet, FixtureSheet, TemplateManageSheet } from "@/components/mtd"

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

interface Equipment {
  id: number
  name: string
  manufacturer: string
  model: string
  specs?: Record<string, string>
  ppt_template_id?: number | null
  ppt_slide_index?: number
}

interface Fixture {
  remark?: string
  id: number
  fixture_no: string
  size: string
  material: string
  ppt_template_id?: number | null
  ppt_slide_index?: number
}

interface FAIExtraction {
  id: number
  file_name: string
  item_count: number
}

interface FAIItem {
  fai_num: string
  spc: string
  specification: string
  description: string
  cpk_method: string
  cpk_fixture: string
  inprocess_method: string
  inprocess_fixture: string
  location: string
  cross_check_by: string
}

interface PPTTemplate {
  id: number
  name: string
}

export default function MTDPage() {
  const [projects, setProjects] = useState<MTDProject[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [extractions, setExtractions] = useState<FAIExtraction[]>([])
  const [templates, setTemplates] = useState<PPTTemplate[]>([])
  const [activeTab, setActiveTab] = useState("projects")

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState("")

  // 抽屉状态
  const [projectSheetOpen, setProjectSheetOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<MTDProject | null>(null)

  const [equipmentSheetOpen, setEquipmentSheetOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)

  const [fixtureSheetOpen, setFixtureSheetOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null)

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false)
  const [templateEntityType, setTemplateEntityType] = useState<"equipment" | "fixture">("equipment")
  const [templateItemId, setTemplateItemId] = useState<number | undefined>(undefined)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number; name: string }>({
    open: false,
    type: "",
    id: 0,
    name: ""
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = () => {
    fetchProjects()
    fetchEquipment()
    fetchFixtures()
    fetchExtractions()
    fetchTemplates()
  }

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/mtd/projects`)
    if (res.ok) setProjects(await res.json())
  }

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

  const fetchTemplates = async () => {
    const res = await fetch(`${API_BASE}/ppt/templates`)
    if (res.ok) setTemplates(await res.json())
  }

  // 打开项目抽屉
  const openProjectSheet = (project?: MTDProject | null) => {
    setEditingProject(project || null)
    setProjectSheetOpen(true)
  }

  // 打开设备抽屉
  const openEquipmentSheet = (eq?: Equipment | null) => {
    setEditingEquipment(eq || null)
    setEquipmentSheetOpen(true)
  }

  // 打开夹具抽屉
  const openFixtureSheet = (fix?: Fixture | null) => {
    setEditingFixture(fix || null)
    setFixtureSheetOpen(true)
  }

  // 打开模板管理抽屉
  const openTemplateSheet = (entityType: "equipment" | "fixture", itemId?: number) => {
    setTemplateEntityType(entityType)
    setTemplateItemId(itemId)
    setTemplateSheetOpen(true)
  }

  // 模板选择回调
  const handleTemplateSelected = async (templateId: number, slideIndex: number) => {
    if (templateItemId) {
      const url = templateEntityType === "equipment"
        ? `${API_BASE}/ppt/templates/equipment/${templateItemId}/template`
        : `${API_BASE}/ppt/templates/fixture/${templateItemId}/template`

      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, slide_index: slideIndex })
      })
      fetchAll()
    }
  }

  // 删除确认
  const confirmDelete = (type: string, id: number, name: string) => {
    setDeleteDialog({ open: true, type, id, name })
  }

  const handleDelete = async () => {
    const { type, id } = deleteDialog
    const url = type === "project"
      ? `${API_BASE}/mtd/projects/${id}`
      : type === "equipment"
        ? `${API_BASE}/mtd/equipment/${id}`
        : `${API_BASE}/mtd/fixtures/${id}`

    const res = await fetch(url, { method: "DELETE" })
    if (res.ok) {
      fetchAll()
      setDeleteDialog({ open: false, type: "", id: 0, name: "" })
    }
  }

  // 生成 PPT
  const generatePPT = async (project: MTDProject) => {
    setGenerating(true)
    setProgress(0)
    setProgressMsg("准备生成...")

    try {
      const selectedEquipment = equipment.filter(eq => project.equipment_ids?.includes(eq.id))
      const selectedFixtures = fixtures.filter(f => project.fixture_ids?.includes(f.id))

      let faiItems: FAIItem[] = []
      if (project.fai_extraction_id) {
        const res = await fetch(`${API_BASE}/extractions/${project.fai_extraction_id}/items`)
        if (res.ok) faiItems = await res.json()
      }

      await generateMTDPPT(
        {
          project_name: project.project_name,
          part_number: project.part_number,
          vendor: project.vendor || "",
          revision: project.revision || "01"
        },
        selectedEquipment,
        selectedFixtures,
        faiItems,
        (prog, msg) => { setProgress(prog); setProgressMsg(msg) }
      )

      setProgressMsg("PPT 生成完成！")
    } catch (error) {
      alert("生成 PPT 失败: " + error)
    } finally {
      setTimeout(() => { setGenerating(false); setProgress(0); setProgressMsg("") }, 1500)
    }
  }

  const getTemplateName = (templateId: number | null | undefined) => {
    if (!templateId) return "未设置"
    return templates.find(t => t.id === templateId)?.name || "未知"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">MTD 项目管理</h1>
          <p className="text-muted-foreground">管理 MTD 项目，自动生成测试文档 PPT</p>
        </div>
      </div>

      {/* PPT 生成进度 */}
      {generating && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="font-medium text-blue-800">{progressMsg}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-blue-600 mt-1 text-right">{progress}%</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="projects"><Package className="w-4 h-4 mr-2" />项目</TabsTrigger>
          <TabsTrigger value="equipment"><Settings className="w-4 h-4 mr-2" />设备</TabsTrigger>
          <TabsTrigger value="fixtures"><Wrench className="w-4 h-4 mr-2" />夹具</TabsTrigger>
        </TabsList>

        {/* 项目 TAB */}
        <TabsContent value="projects">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openProjectSheet()}>
              <Plus className="w-4 h-4 mr-2" />新建项目
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead>料号</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>设备数</TableHead>
                  <TableHead>夹具数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      暂无项目，点击「新建项目」创建
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.project_name}</TableCell>
                      <TableCell>{p.part_number}</TableCell>
                      <TableCell>{p.vendor || "-"}</TableCell>
                      <TableCell>{p.revision}</TableCell>
                      <TableCell>{p.equipment_ids?.length || 0}</TableCell>
                      <TableCell>{p.fixture_ids?.length || 0}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString("zh-CN")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openProjectSheet(p)} title="编辑">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => generatePPT(p)} disabled={generating} title="生成PPT">
                            <FileDown className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => confirmDelete("project", p.id, p.project_name)} title="删除">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 设备 TAB */}
        <TabsContent value="equipment">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openEquipmentSheet()}>
              <Plus className="w-4 h-4 mr-2" />添加设备
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备名称</TableHead>
                  <TableHead>制造商</TableHead>
                  <TableHead>型号</TableHead>
                  <TableHead>量程</TableHead>
                  <TableHead>分辨率</TableHead>
                  <TableHead>精度</TableHead>
                  <TableHead>PPT模板</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      暂无设备，点击「添加设备」创建
                    </TableCell>
                  </TableRow>
                ) : (
                  equipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell>{eq.manufacturer || "-"}</TableCell>
                      <TableCell>{eq.model || "-"}</TableCell>
                      <TableCell>{eq.specs?.range || "-"}</TableCell>
                      <TableCell>{eq.specs?.resolution || "-"}</TableCell>
                      <TableCell>{eq.specs?.accuracy || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{getTemplateName(eq.ppt_template_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEquipmentSheet(eq)} title="编辑">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openTemplateSheet("equipment", eq.id)} title="模板">
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => confirmDelete("equipment", eq.id, eq.name)} title="删除">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 夹具 TAB */}
        <TabsContent value="fixtures">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openFixtureSheet()}>
              <Plus className="w-4 h-4 mr-2" />添加夹具
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>夹具编号</TableHead>
                  <TableHead>尺寸</TableHead>
                  <TableHead>材料</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>PPT模板</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixtures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无夹具，点击「添加夹具」创建
                    </TableCell>
                  </TableRow>
                ) : (
                  fixtures.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.fixture_no}</TableCell>
                      <TableCell>{f.size || "-"}</TableCell>
                      <TableCell>{f.material || "-"}</TableCell>
                      <TableCell>{f.remark || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{getTemplateName(f.ppt_template_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openFixtureSheet(f)} title="编辑">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openTemplateSheet("fixture", f.id)} title="模板">
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => confirmDelete("fixture", f.id, f.fixture_no)} title="删除">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 项目抽屉 */}
      <ProjectSheet
        project={editingProject}
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
        onSave={fetchAll}
      />

      {/* 设备抽屉 */}
      <EquipmentSheet
        equipment={editingEquipment}
        open={equipmentSheetOpen}
        onOpenChange={(open) => {
          setEquipmentSheetOpen(open)
          if (!open) setEditingEquipment(null)
        }}
        onSave={fetchAll}
        onOpenTemplateManage={() => openTemplateSheet("equipment", editingEquipment?.id)}
      />

      {/* 夹具抽屉 */}
      <FixtureSheet
        fixture={editingFixture}
        open={fixtureSheetOpen}
        onOpenChange={(open) => {
          setFixtureSheetOpen(open)
          if (!open) setEditingFixture(null)
        }}
        onSave={fetchAll}
        onOpenTemplateManage={() => openTemplateSheet("fixture", editingFixture?.id)}
      />

      {/* 模板管理抽屉 */}
      <TemplateManageSheet
        entityType={templateEntityType}
        itemId={templateItemId}
        open={templateSheetOpen}
        onOpenChange={(open) => {
          setTemplateSheetOpen(open)
          if (!open) {
            // 如果是从设备/夹具编辑打开的，重新打开编辑抽屉
            if (templateItemId) {
              if (templateEntityType === "equipment") openEquipmentSheet(editingEquipment)
              else openFixtureSheet(editingFixture)
            }
          }
        }}
        onTemplateSelected={handleTemplateSelected}
      />

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要删除{deleteDialog.type === "project" ? "项目" : deleteDialog.type === "equipment" ? "设备" : "夹具"}
            「{deleteDialog.name}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
