"use client"

import * as React from "react"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

            // Notify parent of overall status
            const allKeys = specs.map(s => s.label)
            const allValues: Record<string, number> = {}
            let overallStatus: "OK" | "NG" = "OK"

            allKeys.forEach(k => {
                const v = k === key ? numVal : parseFloat(values[k] || "0")
                allValues[k] = v
                // careful with the closure here, use the new status for current key
                const s = k === key ? status : (prev[k] || "PENDING")
                if (s === "NG" || s === "PENDING") overallStatus = "NG" // Treat pending as potentially NG for safety or just keep partial
            })

            // Fix: logic for overall status needs to be robust, here we just pass simple callback
            if (onChange) onChange(allValues, overallStatus)

            return next
        })
    }

    return (
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            磁学特性参数录入
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-200">
                                Special Characteristic
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            请严格按照作业指导书进行退磁、清零、测试操作
                        </CardDescription>
                    </div>
                    <Info className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                {specs.map((spec, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <Label className="font-medium text-slate-700">{spec.label}</Label>
                            <span className="font-mono text-xs text-muted-foreground">
                                Spec: {spec.target.toFixed(2)} ± {spec.tolerance.toFixed(2)} {spec.unit}
                            </span>
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder={`Enter value in ${spec.unit}`}
                                value={values[spec.label] || ""}
                                onChange={(e) => handleInputChange(spec.label, e.target.value, spec)}
                                className={cn(
                                    "pr-12 font-mono transition-all",
                                    statuses[spec.label] === "OK" && "border-emerald-500 bg-emerald-50 focus-visible:ring-emerald-500",
                                    statuses[spec.label] === "NG" && "border-rose-500 bg-rose-50 focus-visible:ring-rose-500"
                                )}
                            />
                            <div className="absolute right-3 top-2.5">
                                {statuses[spec.label] === "OK" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                {statuses[spec.label] === "NG" && <XCircle className="h-5 w-5 text-rose-500" />}
                                {(!statuses[spec.label] || statuses[spec.label] === "PENDING") && <div className="text-xs text-muted-foreground font-mono mt-0.5">{spec.unit}</div>}
                            </div>
                        </div>
                        {/* Visualization of Tolerance Range */}
                        {statuses[spec.label] && statuses[spec.label] !== "PENDING" && (
                            <div className="pt-1">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    {/* Simplified visualization: Center is target, bar shows relative position */}
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            statuses[spec.label] === "OK" ? "bg-emerald-500" : "bg-rose-500"
                                        )}
                                        style={{
                                            width: "100%", // Simplified for now, just color change
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                                    <span>{(spec.target - spec.tolerance).toFixed(2)}</span>
                                    <span className="text-slate-900 font-bold">{spec.target.toFixed(2)}</span>
                                    <span>{(spec.target + spec.tolerance).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
