"use client"

import * as React from "react"
import { ChevronRight, Check, AlertTriangle, Play, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>标准作业指导 (SOP)</span>
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                        Step {currentStep + 1} / {steps.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 flex-1 rounded-full transition-all duration-300",
                                    i < currentStep ? "bg-primary" :
                                        i === currentStep ? "bg-primary/60" : "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[120px] bg-white rounded-xl border p-5 shadow-sm relative overflow-hidden transition-all duration-300">
                        {isCompleted ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 animate-in fade-in zoom-in-50">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Check className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">SOP 执行完毕</h3>
                                    <p className="text-xs text-muted-foreground mt-1">设备已校准，请立即开始测量。</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 text-xs h-7">
                                    <RotateCcw className="h-3 w-3 mr-1" /> 重新执行
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300" key={currentStep}>
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
                                        {steps[currentStep].id}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base text-slate-900">{steps[currentStep].title}</h3>
                                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                            {steps[currentStep].description}
                                        </p>
                                        {steps[currentStep].warning && (
                                            <div className="mt-3 flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-700 font-medium">{steps[currentStep].warning}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isCompleted && (
                        <div className="flex justify-end">
                            <Button onClick={handleNext} className="gap-2 w-full sm:w-auto" size="sm">
                                {steps[currentStep].actionLabel || "下一步"}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
