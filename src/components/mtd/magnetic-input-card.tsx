"use client"

import * as React from "react"
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { Card, Input, Tag } from "antd"

interface MagneticSpec {
    target: number
    tolerance: number
    unit: string
    label: string
}

interface MagneticInputCardProps {
    specs: MagneticSpec[]
    onChange?: (values: Record<string, number>, status: "OK" | "NG") => void
}

export function MagneticInputCard({ specs, onChange }: MagneticInputCardProps) {
    const [values, setValues] = React.useState<Record<string, string>>({})
    const [statuses, setStatuses] = React.useState<Record<string, "OK" | "NG" | "PENDING">>({})

    const handleInputChange = (key: string, value: string, spec: MagneticSpec) => {
        setValues(prev => ({ ...prev, [key]: value }))

        const numVal = parseFloat(value)
        if (isNaN(numVal)) {
            setStatuses(prev => ({ ...prev, [key]: "PENDING" }))
            return
        }

        const upper = spec.target + spec.tolerance
        const lower = spec.target - spec.tolerance
        const isOk = numVal >= lower && numVal <= upper

        setStatuses(prev => {
            const status: "OK" | "NG" = isOk ? "OK" : "NG"
            const next = { ...prev, [key]: status }

            const allKeys = specs.map(s => s.label)
            const allValues: Record<string, number> = {}
            let overallStatus: "OK" | "NG" = "OK"

            allKeys.forEach(k => {
                const v = k === key ? numVal : parseFloat(values[k] || "0")
                allValues[k] = v
                const s = k === key ? status : (prev[k] || "PENDING")
                if (s === "NG" || s === "PENDING") overallStatus = "NG"
            })

            if (onChange) onChange(allValues, overallStatus)

            return next
        })
    }

    return (
        <Card
            title={
                <div className="flex items-center gap-2">
                    磁学特性参数录入
                    <Tag color="purple" className="text-[10px]">Special Characteristic</Tag>
                </div>
            }
            extra={<InfoCircleOutlined className="text-gray-400" />}
            style={{ borderLeft: "4px solid #a855f7" }}
        >
            <p className="text-xs text-gray-500 mb-4">
                请严格按照作业指导书进行退磁、清零、测试操作
            </p>
            <div className="grid gap-6">
                {specs.map((spec, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{spec.label}</span>
                            <span className="font-mono text-xs text-gray-400">
                                Spec: {spec.target.toFixed(2)} ± {spec.tolerance.toFixed(2)} {spec.unit}
                            </span>
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder={`Enter value in ${spec.unit}`}
                                value={values[spec.label] || ""}
                                onChange={(e) => handleInputChange(spec.label, e.target.value, spec)}
                                className="font-mono"
                                status={statuses[spec.label] === "NG" ? "error" : undefined}
                                suffix={
                                    <>
                                        {statuses[spec.label] === "OK" && <CheckCircleOutlined className="text-emerald-500" />}
                                        {statuses[spec.label] === "NG" && <CloseCircleOutlined className="text-rose-500" />}
                                        {(!statuses[spec.label] || statuses[spec.label] === "PENDING") && <span className="text-xs text-gray-400 font-mono">{spec.unit}</span>}
                                    </>
                                }
                            />
                        </div>
                        {/* 容差范围可视化 */}
                        {statuses[spec.label] && statuses[spec.label] !== "PENDING" && (
                            <div className="pt-1">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${statuses[spec.label] === "OK" ? "bg-emerald-500" : "bg-rose-500"
                                            }`}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                                    <span>{(spec.target - spec.tolerance).toFixed(2)}</span>
                                    <span className="text-slate-900 font-bold">{spec.target.toFixed(2)}</span>
                                    <span>{(spec.target + spec.tolerance).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    )
}
