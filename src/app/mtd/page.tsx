"use client"

import { useState, useEffect } from "react"
import { Button, Card, Tabs, Table, Progress, Modal, message } from "antd"
import type { TableProps, TabsProps } from "antd"
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
      message.success("删除成功")
      fetchAll()
      setDeleteDialog({ open: false, type: "", id: 0, name: "" })
    } else {
      message.error("删除失败")
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
      message.success("PPT 生成成功")
    } catch (error) {
      message.error("生成 PPT 失败: " + error)
    } finally {
      setTimeout(() => { setGenerating(false); setProgress(0); setProgressMsg("") }, 1500)
    }
  }

  const getTemplateName = (templateId: number | null | undefined) => {
    if (!templateId) return "未设置"
    return templates.find(t => t.id === templateId)?.name || "未知"
  }

  // 项目表格列
  const projectColumns: TableProps<MTDProject>["columns"] = [
    {
      title: "项目名称",
      dataIndex: "project_name",
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    { title: "料号", dataIndex: "part_number" },
    { title: "供应商", dataIndex: "vendor", render: (text: string) => text || "-" },
    { title: "版本", dataIndex: "revision" },
    {
      title: "设备数",
      dataIndex: "equipment_ids",
      render: (ids: number[]) => ids?.length || 0
    },
    {
      title: "夹具数",
      dataIndex: "fixture_ids",
      render: (ids: number[]) => ids?.length || 0
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("zh-CN")
    },
    {
      title: "操作",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Button.Group size="small">
          <Button type="text" icon={<Edit2 size={14} />} onClick={() => openProjectSheet(record)} />
          <Button type="text" icon={<FileDown size={14} />} onClick={() => generatePPT(record)} disabled={generating} />
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => confirmDelete("project", record.id, record.project_name)} />
        </Button.Group>
      )
    }
  ]

  // 设备表格列
  const equipmentColumns: TableProps<Equipment>["columns"] = [
    {
      title: "设备名称",
      dataIndex: "name",
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    { title: "制造商", dataIndex: "manufacturer", render: (text: string) => text || "-" },
    { title: "型号", dataIndex: "model", render: (text: string) => text || "-" },
    { title: "量程", dataIndex: "specs", render: (specs: any) => specs?.range || "-" },
    { title: "分辨率", dataIndex: "specs", render: (specs: any) => specs?.resolution || "-" },
    { title: "精度", dataIndex: "specs", render: (specs: any) => specs?.accuracy || "-" },
    {
      title: "PPT模板",
      dataIndex: "ppt_template_id",
      render: (templateId: number) => <span className="text-gray-500 text-sm">{getTemplateName(templateId)}</span>
    },
    {
      title: "操作",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Button.Group size="small">
          <Button type="text" icon={<Edit2 size={14} />} onClick={() => openEquipmentSheet(record)} />
          <Button type="text" icon={<FileText size={14} />} onClick={() => openTemplateSheet("equipment", record.id)} />
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => confirmDelete("equipment", record.id, record.name)} />
        </Button.Group>
      )
    }
  ]

  // 夹具表格列
  const fixtureColumns: TableProps<Fixture>["columns"] = [
    {
      title: "夹具编号",
      dataIndex: "fixture_no",
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    { title: "尺寸", dataIndex: "size", render: (text: string) => text || "-" },
    { title: "材料", dataIndex: "material", render: (text: string) => text || "-" },
    { title: "备注", dataIndex: "remark", render: (text: string) => text || "-" },
    {
      title: "PPT模板",
      dataIndex: "ppt_template_id",
      render: (templateId: number) => <span className="text-gray-500 text-sm">{getTemplateName(templateId)}</span>
    },
    {
      title: "操作",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Button.Group size="small">
          <Button type="text" icon={<Edit2 size={14} />} onClick={() => openFixtureSheet(record)} />
          <Button type="text" icon={<FileText size={14} />} onClick={() => openTemplateSheet("fixture", record.id)} />
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => confirmDelete("fixture", record.id, record.fixture_no)} />
        </Button.Group>
      )
    }
  ]

  const tabItems: TabsProps["items"] = [
    {
      key: "projects",
      label: (
        <span className="flex items-center gap-2">
          <Package size={16} />
          项目
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" icon={<Plus size={16} />} onClick={() => openProjectSheet()}>
              新建项目
            </Button>
          </div>
          <Table
            dataSource={projects}
            columns={projectColumns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <p className="text-center text-gray-400 py-8">暂无项目，点击「新建项目」创建</p> }}
          />
        </div>
      )
    },
    {
      key: "equipment",
      label: (
        <span className="flex items-center gap-2">
          <Settings size={16} />
          设备
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" icon={<Plus size={16} />} onClick={() => openEquipmentSheet()}>
              添加设备
            </Button>
          </div>
          <Table
            dataSource={equipment}
            columns={equipmentColumns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <p className="text-center text-gray-400 py-8">暂无设备，点击「添加设备」创建</p> }}
          />
        </div>
      )
    },
    {
      key: "fixtures",
      label: (
        <span className="flex items-center gap-2">
          <Wrench size={16} />
          夹具
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" icon={<Plus size={16} />} onClick={() => openFixtureSheet()}>
              添加夹具
            </Button>
          </div>
          <Table
            dataSource={fixtures}
            columns={fixtureColumns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <p className="text-center text-gray-400 py-8">暂无夹具，点击「添加夹具」创建</p> }}
          />
        </div>
      )
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">MTD 项目管理</h1>
          <p className="text-gray-500">管理 MTD 项目，自动生成测试文档 PPT</p>
        </div>
      </div>

      {/* PPT 生成进度 */}
      {generating && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="font-medium text-blue-800">{progressMsg}</span>
          </div>
          <Progress percent={progress} className="mb-1" />
          <p className="text-sm text-blue-600 text-right">{progress}%</p>
        </Card>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

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
      <Modal
        title="确认删除"
        open={deleteDialog.open}
        onOk={handleDelete}
        onCancel={() => setDeleteDialog({ ...deleteDialog, open: false })}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p className="py-4">
          确定要删除{deleteDialog.type === "project" ? "项目" : deleteDialog.type === "equipment" ? "设备" : "夹具"}
          「{deleteDialog.name}」吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}
