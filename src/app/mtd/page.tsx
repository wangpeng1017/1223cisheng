'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileDown, Trash2, Settings, Package, Wrench } from 'lucide-react'

const API_BASE = 'http://localhost:8001/api'

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

export default function MTDPage() {
  const [projects, setProjects] = useState<MTDProject[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [extractions, setExtractions] = useState<FAIExtraction[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')

  const [newProject, setNewProject] = useState({
    project_name: '', part_number: '', vendor: '', revision: '01',
    equipment_ids: [] as number[], fixture_ids: [] as number[], fai_extraction_id: null as number | null
  })
  const [newEquipment, setNewEquipment] = useState({ name: '', manufacturer: '', model: '' })
  const [newFixture, setNewFixture] = useState({ fixture_no: '', size: '', material: '' })

  useEffect(() => { fetchProjects(); fetchEquipment(); fetchFixtures(); fetchExtractions() }, [])

  const fetchProjects = async () => { try { const res = await fetch(`${API_BASE}/mtd/projects`); if (res.ok) setProjects(await res.json()) } catch (e) { console.error(e) } }
  const fetchEquipment = async () => { try { const res = await fetch(`${API_BASE}/mtd/equipment`); if (res.ok) setEquipment(await res.json()) } catch (e) { console.error(e) } }
  const fetchFixtures = async () => { try { const res = await fetch(`${API_BASE}/mtd/fixtures`); if (res.ok) setFixtures(await res.json()) } catch (e) { console.error(e) } }
  const fetchExtractions = async () => { try { const res = await fetch(`${API_BASE}/extractions`); if (res.ok) setExtractions(await res.json()) } catch (e) { console.error(e) } }

  const createProject = async () => {
    if (!newProject.project_name || !newProject.part_number) return alert('请填写项目名称和料号')
    const res = await fetch(`${API_BASE}/mtd/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProject) })
    if (res.ok) { setNewProject({ project_name: '', part_number: '', vendor: '', revision: '01', equipment_ids: [], fixture_ids: [], fai_extraction_id: null }); fetchProjects() }
  }

  const createEquipment = async () => {
    if (!newEquipment.name) return alert('请填写设备名称')
    const res = await fetch(`${API_BASE}/mtd/equipment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEquipment) })
    if (res.ok) { setNewEquipment({ name: '', manufacturer: '', model: '' }); fetchEquipment() }
  }

  const createFixture = async () => {
    if (!newFixture.fixture_no) return alert('请填写夹具编号')
    const res = await fetch(`${API_BASE}/mtd/fixtures`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFixture) })
    if (res.ok) { setNewFixture({ fixture_no: '', size: '', material: '' }); fetchFixtures() }
  }

  const deleteProject = async (id: number) => { if (!confirm('确定删除？')) return; const res = await fetch(`${API_BASE}/mtd/projects/${id}`, { method: 'DELETE' }); if (res.ok) fetchProjects() }
  const deleteEquipment = async (id: number) => { if (!confirm('确定删除？')) return; const res = await fetch(`${API_BASE}/mtd/equipment/${id}`, { method: 'DELETE' }); if (res.ok) fetchEquipment() }
  const deleteFixture = async (id: number) => { if (!confirm('确定删除？')) return; const res = await fetch(`${API_BASE}/mtd/fixtures/${id}`, { method: 'DELETE' }); if (res.ok) fetchFixtures() }

  const generatePPT = async (projectId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/mtd/projects/${projectId}/generate-ppt`, { method: 'POST' })
      if (res.ok) {
        const blob = await res.blob(); const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `MTD_${projectId}.pptx`
        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove()
      } else alert('生成 PPT 失败')
    } catch { alert('生成 PPT 失败') }
    finally { setLoading(false) }
  }

  const toggleEquipment = (id: number) => setNewProject(p => ({ ...p, equipment_ids: p.equipment_ids.includes(id) ? p.equipment_ids.filter(x => x !== id) : [...p.equipment_ids, id] }))
  const toggleFixture = (id: number) => setNewProject(p => ({ ...p, fixture_ids: p.fixture_ids.includes(id) ? p.fixture_ids.filter(x => x !== id) : [...p.fixture_ids, id] }))

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MTD 项目管理</h1>
      <p className="text-muted-foreground mb-6">管理 MTD 项目，自动生成提交给 Apple 的测试文档 PPT</p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="projects"><Package className="w-4 h-4 mr-2" />项目</TabsTrigger>
          <TabsTrigger value="equipment"><Settings className="w-4 h-4 mr-2" />设备</TabsTrigger>
          <TabsTrigger value="fixtures"><Wrench className="w-4 h-4 mr-2" />夹具</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>新建 MTD 项目</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>项目名称 *</Label><Input placeholder="J510" value={newProject.project_name} onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })} /></div>
                <div><Label>料号 *</Label><Input placeholder="160-06631-01" value={newProject.part_number} onChange={(e) => setNewProject({ ...newProject, part_number: e.target.value })} /></div>
                <div><Label>供应商</Label><Input placeholder="MAGSOUND" value={newProject.vendor} onChange={(e) => setNewProject({ ...newProject, vendor: e.target.value })} /></div>
                <div><Label>版本</Label><Input placeholder="01" value={newProject.revision} onChange={(e) => setNewProject({ ...newProject, revision: e.target.value })} /></div>
                <div>
                  <Label>FAI 数据源</Label>
                  <Select value={newProject.fai_extraction_id?.toString() || ''} onValueChange={(v) => setNewProject({ ...newProject, fai_extraction_id: v ? parseInt(v) : null })}>
                    <SelectTrigger><SelectValue placeholder="选择 FAI 提取记录" /></SelectTrigger>
                    <SelectContent>{extractions.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.file_name} ({e.item_count} 项)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {equipment.length > 0 && <div><Label>关联设备</Label><div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">{equipment.map(eq => <div key={eq.id} className="flex items-center gap-2"><Checkbox checked={newProject.equipment_ids.includes(eq.id)} onCheckedChange={() => toggleEquipment(eq.id)} /><span className="text-sm">{eq.name} - {eq.model}</span></div>)}</div></div>}
                {fixtures.length > 0 && <div><Label>关联夹具</Label><div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">{fixtures.map(f => <div key={f.id} className="flex items-center gap-2"><Checkbox checked={newProject.fixture_ids.includes(f.id)} onCheckedChange={() => toggleFixture(f.id)} /><span className="text-sm">{f.fixture_no} - {f.size}</span></div>)}</div></div>}
                <Button onClick={createProject} className="w-full"><Plus className="w-4 h-4 mr-2" />创建项目</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>项目列表</CardTitle></CardHeader>
              <CardContent>
                {projects.length === 0 ? <p className="text-center py-8">暂无项目</p> : <div className="space-y-3">{projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{p.project_name}</p><p className="text-sm text-muted-foreground">{p.part_number} | {p.vendor || '无供应商'}</p><p className="text-xs text-muted-foreground">设备: {p.equipment_ids?.length || 0} | 夹具: {p.fixture_ids?.length || 0}</p></div>
                    <div className="flex gap-2"><Button size="sm" onClick={() => generatePPT(p.id)} disabled={loading}><FileDown className="w-4 h-4 mr-1" />生成 PPT</Button><Button size="sm" variant="destructive" onClick={() => deleteProject(p.id)}><Trash2 className="w-4 h-4" /></Button></div>
                  </div>
                ))}</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加测量设备</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>设备名称 *</Label><Input placeholder="KEYENCE" value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })} /></div>
                <div><Label>制造商</Label><Input placeholder="KEYENCE" value={newEquipment.manufacturer} onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })} /></div>
                <div><Label>型号</Label><Input placeholder="IM7010" value={newEquipment.model} onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })} /></div>
                <Button onClick={createEquipment} className="w-full"><Plus className="w-4 h-4 mr-2" />添加设备</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>设备列表</CardTitle></CardHeader>
              <CardContent>
                {equipment.length === 0 ? <p className="text-center py-8">暂无设备</p> : <div className="space-y-3">{equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{eq.name}</p><p className="text-sm text-muted-foreground">{eq.manufacturer} | {eq.model}</p></div>
                    <Button size="sm" variant="destructive" onClick={() => deleteEquipment(eq.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fixtures">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加测量夹具</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>夹具编号 *</Label><Input placeholder="J-J510-1#" value={newFixture.fixture_no} onChange={(e) => setNewFixture({ ...newFixture, fixture_no: e.target.value })} /></div>
                <div><Label>尺寸</Label><Input placeholder="189*36*12" value={newFixture.size} onChange={(e) => setNewFixture({ ...newFixture, size: e.target.value })} /></div>
                <div><Label>材料</Label><Input placeholder="Electric board" value={newFixture.material} onChange={(e) => setNewFixture({ ...newFixture, material: e.target.value })} /></div>
                <Button onClick={createFixture} className="w-full"><Plus className="w-4 h-4 mr-2" />添加夹具</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>夹具列表</CardTitle></CardHeader>
              <CardContent>
                {fixtures.length === 0 ? <p className="text-center py-8">暂无夹具</p> : <div className="space-y-3">{fixtures.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{f.fixture_no}</p><p className="text-sm text-muted-foreground">{f.size} | {f.material}</p></div>
                    <Button size="sm" variant="destructive" onClick={() => deleteFixture(f.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
