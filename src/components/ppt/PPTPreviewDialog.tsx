"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Modal, Button, Input, Tabs, Tag, Table, App } from "antd"
import type { TableProps } from "antd"
import { FileTextOutlined, CheckCircleOutlined, LoadingOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { PPTGenerationData } from "@/lib/types/ppt"
import { TemplateSelector } from "@/components/ppt/TemplateSelector"

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

    // 设备表格列
    const equipmentColumns: TableProps<any>["columns"] = [
        { title: "设备名称", dataIndex: "name", width: 120, render: (_: any, __: any, index: number) => <Input size="small" value={editedData.equipments[index]?.name} onChange={(e) => updateEquipment(index, 'name', e.target.value)} /> },
        { title: "制造商", dataIndex: "manufacturer", width: 120, render: (_: any, __: any, index: number) => <Input size="small" value={editedData.equipments[index]?.manufacturer} onChange={(e) => updateEquipment(index, 'manufacturer', e.target.value)} /> },
        { title: "型号", dataIndex: "model", width: 100, render: (_: any, __: any, index: number) => <Input size="small" value={editedData.equipments[index]?.model} onChange={(e) => updateEquipment(index, 'model', e.target.value)} /> },
        { title: "测量范围", dataIndex: "range", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.equipments[index]?.range || ''} onChange={(e) => updateEquipment(index, 'range', e.target.value)} /> },
        { title: "精度", dataIndex: "accuracy", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.equipments[index]?.accuracy || ''} onChange={(e) => updateEquipment(index, 'accuracy', e.target.value)} /> },
        { title: "操作", key: "action", width: 60, render: (_: any, __: any, index: number) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeEquipment(index)} /> },
    ]

    // 夹具表格列
    const fixtureColumns: TableProps<any>["columns"] = [
        { title: "夹具编号", dataIndex: "no", width: 100, render: (_: any, __: any, index: number) => <Input size="small" value={editedData.fixtures[index]?.no} onChange={(e) => updateFixture(index, 'no', e.target.value)} /> },
        { title: "尺寸", dataIndex: "size", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.fixtures[index]?.size} onChange={(e) => updateFixture(index, 'size', e.target.value)} /> },
        { title: "材质", dataIndex: "material", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.fixtures[index]?.material} onChange={(e) => updateFixture(index, 'material', e.target.value)} /> },
        { title: "图片", dataIndex: "pic", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.fixtures[index]?.pic || ''} onChange={(e) => updateFixture(index, 'pic', e.target.value)} placeholder="可选" /> },
        { title: "备注", dataIndex: "remark", render: (_: any, __: any, index: number) => <Input size="small" value={editedData.fixtures[index]?.remark || ''} onChange={(e) => updateFixture(index, 'remark', e.target.value)} placeholder="可选" /> },
        { title: "操作", key: "action", width: 60, render: (_: any, __: any, index: number) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeFixture(index)} /> },
    ]

    // FAI 数据列
    const faiColumns: TableProps<any>["columns"] = [
        { title: "FAI", dataIndex: "faiNum", width: 60, render: (t: number) => <span className="font-medium">{t}</span> },
        { title: "SPC", dataIndex: "spcCode", width: 60, render: (t: string) => t || '-' },
        { title: "分类", dataIndex: "category", render: (t: string) => <Tag>{t}</Tag> },
        { title: "规格", dataIndex: "specification", render: (t: string) => <span className="font-mono text-xs">{t}</span> },
        { title: "描述", dataIndex: "description" },
        { title: "方法", dataIndex: "method" },
    ]

    const tabItems = [
        {
            key: "product",
            label: "产品信息",
            children: (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">项目名称 *</div>
                        <Input value={editedData.productInfo.projectName} onChange={(e) => updateProductInfo('projectName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">料号 *</div>
                        <Input value={editedData.productInfo.partNumber} onChange={(e) => updateProductInfo('partNumber', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">版本号 *</div>
                        <Input value={editedData.productInfo.revision} onChange={(e) => updateProductInfo('revision', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">供应商 *</div>
                        <Input value={editedData.productInfo.vendor} onChange={(e) => updateProductInfo('vendor', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <div className="text-sm font-medium">日期 *</div>
                        <Input value={editedData.productInfo.date} onChange={(e) => updateProductInfo('date', e.target.value)} />
                    </div>
                </div>
            )
        },
        {
            key: "equipment",
            label: <span>设备列表 <Tag className="ml-1">{editedData.equipments.length}</Tag></span>,
            children: (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">测量设备信息（自动推断）</p>
                        <Button size="small" icon={<PlusOutlined />} onClick={addEquipment}>添加设备</Button>
                    </div>
                    <Table
                        dataSource={editedData.equipments}
                        columns={equipmentColumns}
                        rowKey={(_, index) => String(index)}
                        pagination={false}
                        size="small"
                    />
                </div>
            )
        },
        {
            key: "fixture",
            label: <span>夹具列表 <Tag className="ml-1">{editedData.fixtures.length}</Tag></span>,
            children: (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">测量夹具信息</p>
                        <Button size="small" icon={<PlusOutlined />} onClick={addFixture}>添加夹具</Button>
                    </div>
                    <Table
                        dataSource={editedData.fixtures}
                        columns={fixtureColumns}
                        rowKey={(_, index) => String(index)}
                        pagination={false}
                        size="small"
                    />
                </div>
            )
        },
        {
            key: "fai",
            label: "FAI数据",
            children: (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-emerald-500" />
                        <p className="text-sm text-slate-500">
                            共 <span className="font-bold">{editedData.faiItems.length}</span> 个FAI测量项
                        </p>
                    </div>
                    <Table
                        dataSource={editedData.faiItems}
                        columns={faiColumns}
                        rowKey={(_, index) => String(index)}
                        pagination={false}
                        size="small"
                        scroll={{ y: 256 }}
                    />
                </div>
            )
        },
        {
            key: "template",
            label: "模板",
            children: (
                <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={setSelectedTemplate}
                    disabled={isGenerating}
                />
            )
        },
    ]

    return (
        <Modal
            title={
                <span className="flex items-center gap-2">
                    <FileTextOutlined />
                    PPT生成预览
                </span>
            }
            open={open}
            onCancel={() => onOpenChange(false)}
            width={900}
            footer={[
                <Button key="cancel" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                    取消
                </Button>,
                <Button key="confirm" type="primary" onClick={handleConfirm} disabled={isGenerating} icon={isGenerating ? <LoadingOutlined /> : <CheckCircleOutlined />}>
                    {isGenerating ? '生成中...' : '确认生成'}
                </Button>,
            ]}
        >
            <p className="text-sm text-slate-500 mb-4">
                请确认并编辑PPT内容，预估共 <span className="font-bold text-blue-600">{estimatedPages}</span> 页
            </p>
            <Tabs items={tabItems} />
        </Modal>
    )
}
