"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PPTGenerationData } from "@/lib/types/ppt"
import { TemplateSelector } from "@/components/ppt/TemplateSelector"
import { Loader2, FileText, CheckCircle } from "lucide-react"

interface PPTPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: PPTGenerationData | null
    onConfirm: (data: PPTGenerationData) => void
    isGenerating?: boolean
}

export function PPTPreviewDialog({
    open,
    onOpenChange,
    data,
    onConfirm,
    isGenerating = false,
}: PPTPreviewDialogProps) {
    const [editedData, setEditedData] = useState<PPTGenerationData | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<string>('default')

    // 当 data 变化时同步到 editedData
    useEffect(() => {
        if (data) {
            setEditedData(data)
        }
    }, [data])

    // 如果没有数据，不渲染内容
    if (!editedData) {
        return null
    }

    // 更新产品信息
    const updateProductInfo = (field: keyof typeof editedData.productInfo, value: string) => {
        setEditedData(prev => prev ? {
            ...prev,
            productInfo: {
                ...prev.productInfo,
                [field]: value,
            },
        } : null)
    }

    // 更新设备信息
    const updateEquipment = (index: number, field: string, value: string) => {
        setEditedData(prev => prev ? {
            ...prev,
            equipments: prev.equipments.map((eq, i) =>
                i === index ? { ...eq, [field]: value } : eq
            ),
        } : null)
    }

    // 更新夹具信息
    const updateFixture = (index: number, field: string, value: string) => {
        setEditedData(prev => prev ? {
            ...prev,
            fixtures: prev.fixtures.map((fix, i) =>
                i === index ? { ...fix, [field]: value } : fix
            ),
        } : null)
    }

    // 添加新设备
    const addEquipment = () => {
        setEditedData(prev => prev ? {
            ...prev,
            equipments: [
                ...prev.equipments,
                { name: '', manufacturer: '', model: '', range: '', accuracy: '' },
            ],
        } : null)
    }

    // 删除设备
    const removeEquipment = (index: number) => {
        setEditedData(prev => prev ? {
            ...prev,
            equipments: prev.equipments.filter((_, i) => i !== index),
        } : null)
    }

    // 添加新夹具
    const addFixture = () => {
        setEditedData(prev => prev ? {
            ...prev,
            fixtures: [
                ...prev.fixtures,
                { no: '', size: '', material: '', pic: '', remark: '' },
            ],
        } : null)
    }

    // 删除夹具
    const removeFixture = (index: number) => {
        setEditedData(prev => prev ? {
            ...prev,
            fixtures: prev.fixtures.filter((_, i) => i !== index),
        } : null)
    }

    // 确认生成
    const handleConfirm = () => {
        if (editedData) {
            onConfirm(editedData)
            onOpenChange(false)
        }
    }

    // 计算预估页数
    const estimatedPages = 1 + // 封面
        1 + // 目录
        editedData.equipments.length + // 设备页
        (editedData.fixtures.length > 0 ? 1 : 0) + // 夹具页
        1 + // BOM页
        1 + // FAI汇总表
        editedData.faiItems.length // 测量项详情页

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        PPT生成预览
                    </DialogTitle>
                    <DialogDescription>
                        请确认并编辑PPT内容，预估共 <span className="font-bold text-primary">{estimatedPages}</span> 页
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="product" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="product">产品信息</TabsTrigger>
                        <TabsTrigger value="equipment">
                            设备列表
                            <Badge variant="secondary" className="ml-2">
                                {editedData.equipments.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="fixture">
                            夹具列表
                            <Badge variant="secondary" className="ml-2">
                                {editedData.fixtures.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="fai">FAI数据</TabsTrigger>
                        <TabsTrigger value="template">模板</TabsTrigger>
                    </TabsList>

                    {/* 产品信息 */}
                    <TabsContent value="product" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectName">项目名称 *</Label>
                                <Input
                                    id="projectName"
                                    value={editedData.productInfo.projectName}
                                    onChange={(e) => updateProductInfo('projectName', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="partNumber">料号 *</Label>
                                <Input
                                    id="partNumber"
                                    value={editedData.productInfo.partNumber}
                                    onChange={(e) => updateProductInfo('partNumber', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="revision">版本号 *</Label>
                                <Input
                                    id="revision"
                                    value={editedData.productInfo.revision}
                                    onChange={(e) => updateProductInfo('revision', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor">供应商 *</Label>
                                <Input
                                    id="vendor"
                                    value={editedData.productInfo.vendor}
                                    onChange={(e) => updateProductInfo('vendor', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="date">日期 *</Label>
                                <Input
                                    id="date"
                                    value={editedData.productInfo.date}
                                    onChange={(e) => updateProductInfo('date', e.target.value)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* 设备列表 */}
                    <TabsContent value="equipment" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-slate-500">测量设备信息（自动推断）</p>
                            <Button variant="outline" size="sm" onClick={addEquipment}>
                                + 添加设备
                            </Button>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">设备名称</TableHead>
                                        <TableHead className="w-[120px]">制造商</TableHead>
                                        <TableHead className="w-[100px]">型号</TableHead>
                                        <TableHead>测量范围</TableHead>
                                        <TableHead>精度</TableHead>
                                        <TableHead className="w-[60px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editedData.equipments.map((eq, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={eq.name}
                                                    onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={eq.manufacturer}
                                                    onChange={(e) => updateEquipment(index, 'manufacturer', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={eq.model}
                                                    onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={eq.range || ''}
                                                    onChange={(e) => updateEquipment(index, 'range', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={eq.accuracy || ''}
                                                    onChange={(e) => updateEquipment(index, 'accuracy', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEquipment(index)}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                >
                                                    ✕
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* 夹具列表 */}
                    <TabsContent value="fixture" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-slate-500">测量夹具信息</p>
                            <Button variant="outline" size="sm" onClick={addFixture}>
                                + 添加夹具
                            </Button>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[100px]">夹具编号</TableHead>
                                        <TableHead>尺寸</TableHead>
                                        <TableHead>材质</TableHead>
                                        <TableHead>图片</TableHead>
                                        <TableHead>备注</TableHead>
                                        <TableHead className="w-[60px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editedData.fixtures.map((fix, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={fix.no}
                                                    onChange={(e) => updateFixture(index, 'no', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={fix.size}
                                                    onChange={(e) => updateFixture(index, 'size', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={fix.material}
                                                    onChange={(e) => updateFixture(index, 'material', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={fix.pic || ''}
                                                    onChange={(e) => updateFixture(index, 'pic', e.target.value)}
                                                    className="h-8"
                                                    placeholder="可选"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={fix.remark || ''}
                                                    onChange={(e) => updateFixture(index, 'remark', e.target.value)}
                                                    className="h-8"
                                                    placeholder="可选"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFixture(index)}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                >
                                                    ✕
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* FAI数据预览 */}
                    <TabsContent value="fai" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <p className="text-sm text-slate-500">
                                共 <span className="font-bold">{editedData.faiItems.length}</span> 个FAI测量项
                            </p>
                        </div>
                        <div className="rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="w-[60px]">FAI</TableHead>
                                        <TableHead className="w-[60px]">SPC</TableHead>
                                        <TableHead>分类</TableHead>
                                        <TableHead>规格</TableHead>
                                        <TableHead>描述</TableHead>
                                        <TableHead>方法</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editedData.faiItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.faiNum}</TableCell>
                                            <TableCell>{item.spcCode || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.specification}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.method}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* 模板选择 */}
                    <TabsContent value="template" className="space-y-4">
                        <TemplateSelector
                            selectedTemplate={selectedTemplate}
                            onTemplateChange={setSelectedTemplate}
                            disabled={isGenerating}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                确认生成
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
