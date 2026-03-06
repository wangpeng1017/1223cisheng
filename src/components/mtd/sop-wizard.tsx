"use client"

import * as React from "react"
import { RightOutlined, CheckOutlined, WarningOutlined, PlayCircleOutlined, UndoOutlined } from "@ant-design/icons"
import { Card, Button } from "antd"

interface SopStep {
    id: number
    title: string
    description: string
    warning?: string
    actionLabel?: string
}

interface SopWizardProps {
    steps: SopStep[]
    onComplete?: () => void
}

export function SopWizard({ steps, onComplete }: SopWizardProps) {
    const [currentStep, setCurrentStep] = React.useState(0)
    const [isCompleted, setIsCompleted] = React.useState(false)

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            setIsCompleted(true)
            if (onComplete) onComplete()
        }
    }

    const handleReset = () => {
        setCurrentStep(0)
        setIsCompleted(false)
    }

    return (
        <Card className="bg-slate-50/50 border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">标准作业指导 (SOP)</span>
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                    Step {currentStep + 1} / {steps.length}
                </span>
            </div>
            <div className="space-y-6">
                {/* 进度条 */}
                <div className="flex items-center gap-1">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentStep ? "bg-blue-600" :
                                    i === currentStep ? "bg-blue-400" : "bg-slate-200"
                                }`}
                        />
                    ))}
                </div>

                {/* 步骤内容 */}
                <div className="min-h-[120px] bg-white rounded-xl border p-5 shadow-sm relative overflow-hidden transition-all duration-300">
                    {isCompleted ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckOutlined style={{ fontSize: 24, color: "#059669" }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">SOP 执行完毕</h3>
                                <p className="text-xs text-gray-500 mt-1">设备已校准，请立即开始测量。</p>
                            </div>
                            <Button size="small" onClick={handleReset} icon={<UndoOutlined />} className="mt-2">
                                重新执行
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4" key={currentStep}>
                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 font-bold text-blue-600">
                                    {steps[currentStep].id}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-base text-slate-900">{steps[currentStep].title}</h3>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                        {steps[currentStep].description}
                                    </p>
                                    {steps[currentStep].warning && (
                                        <div className="mt-3 flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                            <WarningOutlined className="text-amber-600 mt-0.5" />
                                            <p className="text-xs text-amber-700 font-medium">{steps[currentStep].warning}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                {!isCompleted && (
                    <div className="flex justify-end">
                        <Button type="primary" onClick={handleNext} icon={<RightOutlined />} iconPosition="end">
                            {steps[currentStep].actionLabel || "下一步"}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}
