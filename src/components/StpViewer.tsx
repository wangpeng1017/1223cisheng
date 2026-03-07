"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js"

export interface DimAnnotation {
    label: string
    value3d: number
    value2d?: number
    matched?: boolean
}

interface StpViewerProps {
    file: File | null
    height?: number
    comparisonData?: {
        bounding_box: { x_size: number; y_size: number; z_size: number }
        matches: { dim_3d: string; value_3d: number; value_2d: number; difference: number }[]
        mismatches: { dim_3d: string; value_3d: number; value_2d: number; difference: number; severity: string }[]
    } | null
    showDimensions?: boolean
}

function createDimLabel(text: string, color: string, subtext?: string): HTMLDivElement {
    const div = document.createElement("div")
    div.style.cssText = `
        background: ${color}; color: #fff; padding: 3px 8px; border-radius: 4px;
        font-size: 11px; font-family: monospace; white-space: nowrap; pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25); line-height: 1.4; text-align: center;
    `
    div.innerHTML = `<b>${text}</b>${subtext ? `<br/><span style="font-size:9px;opacity:0.85">${subtext}</span>` : ""}`
    return div
}

function createDimLine(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3, color: number, offset: number = 0) {
    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    const perp = new THREE.Vector3()
    if (Math.abs(dir.y) < 0.9) perp.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
    else perp.crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize()
    const off = perp.multiplyScalar(offset)

    const p1 = start.clone().add(off)
    const p2 = end.clone().add(off)

    // Main dimension line
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2])
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 })
    scene.add(new THREE.Line(geom, mat))

    // End ticks
    const tickLen = off.length() * 0.3 || 1
    const tickDir = perp.clone().normalize().multiplyScalar(tickLen)
    for (const p of [p1, p2]) {
        const tickGeom = new THREE.BufferGeometry().setFromPoints([
            p.clone().add(tickDir), p.clone().sub(tickDir)
        ])
        scene.add(new THREE.Line(tickGeom, mat))
    }

    // Extension lines
    const extMat = new THREE.LineBasicMaterial({ color, linewidth: 1, transparent: true, opacity: 0.4 })
    for (const [base, tip] of [[start, p1], [end, p2]]) {
        const extGeom = new THREE.BufferGeometry().setFromPoints([base, tip])
        scene.add(new THREE.Line(extGeom, extMat))
    }

    return p1.clone().add(p2).multiplyScalar(0.5)
}

export default function StpViewer({ file, height = 350, comparisonData, showDimensions = true }: StpViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasWrapRef = useRef<HTMLDivElement | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const labelRendererRef = useRef<CSS2DRenderer | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [dims, setDims] = useState<{ x: number; y: number; z: number } | null>(null)

    useEffect(() => {
        if (!file || !containerRef.current) return

        const container = containerRef.current
        let animId: number
        let disposed = false

        // Clean up previous render inside a wrapper div (avoid React DOM conflicts)
        if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current = null }
        if (canvasWrapRef.current) {
            canvasWrapRef.current.remove()
            canvasWrapRef.current = null
        }
        const wrap = document.createElement("div")
        wrap.style.cssText = "position:absolute;inset:0;"
        container.appendChild(wrap)
        canvasWrapRef.current = wrap

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf1f5f9)

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / height, 0.1, 10000)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(container.clientWidth, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        wrap.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // CSS2D label renderer (for dimension labels)
        const labelRenderer = new CSS2DRenderer()
        labelRenderer.setSize(container.clientWidth, height)
        labelRenderer.domElement.style.position = "absolute"
        labelRenderer.domElement.style.top = "0"
        labelRenderer.domElement.style.left = "0"
        labelRenderer.domElement.style.pointerEvents = "none"
        wrap.appendChild(labelRenderer.domElement)
        labelRendererRef.current = labelRenderer

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
        const d1 = new THREE.DirectionalLight(0xffffff, 0.8); d1.position.set(1, 1, 1); scene.add(d1)
        const d2 = new THREE.DirectionalLight(0xffffff, 0.4); d2.position.set(-1, -0.5, -1); scene.add(d2)

        // Grid
        const grid = new THREE.GridHelper(200, 20, 0xcccccc, 0xe0e0e0)
        scene.add(grid)

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.1

        const animate = () => {
            if (disposed) return
            animId = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
            labelRenderer.render(scene, camera)
        }
        animate()

        setLoading(true)
        setError("")

        const loadStp = async () => {
            try {
                const occtImportJs = await import("occt-import-js")
                const occt = await occtImportJs.default({
                    locateFile: (name: string) => {
                        if (name.endsWith(".wasm")) return "/occt-import-js.wasm"
                        return name
                    },
                } as any)

                const buffer = await file.arrayBuffer()
                const result = occt.ReadStepFile(new Uint8Array(buffer), null)

                if (!result.success || result.meshes.length === 0) {
                    setError("STP 文件解析失败"); setLoading(false); return
                }

                const group = new THREE.Group()
                for (const mesh of result.meshes) {
                    const geometry = new THREE.BufferGeometry()
                    const posArr = mesh.attributes.position.array
                    geometry.setAttribute("position",
                        new THREE.Float32BufferAttribute(posArr instanceof Float32Array ? posArr : new Float32Array(posArr), 3))
                    if (mesh.attributes.normal) {
                        const normArr = mesh.attributes.normal.array
                        geometry.setAttribute("normal",
                            new THREE.Float32BufferAttribute(normArr instanceof Float32Array ? normArr : new Float32Array(normArr), 3))
                    }
                    if (mesh.index) {
                        const idxArr = mesh.index.array
                        geometry.setIndex(new THREE.BufferAttribute(idxArr instanceof Uint32Array ? idxArr : new Uint32Array(idxArr), 1))
                    }
                    let color = 0x6699cc
                    if (mesh.color) color = new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2]).getHex()
                    const material = new THREE.MeshPhongMaterial({ color, specular: 0x222222, shininess: 30, side: THREE.DoubleSide })
                    group.add(new THREE.Mesh(geometry, material))
                }
                scene.add(group)

                // Compute bounding box
                const box = new THREE.Box3().setFromObject(group)
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const maxDim = Math.max(size.x, size.y, size.z)
                const dist = maxDim * 2.2

                setDims({ x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2) })

                camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.8)
                camera.lookAt(center)
                controls.target.copy(center)
                controls.update()
                grid.position.y = box.min.y

                // ===== Add dimension annotations =====
                if (showDimensions) {
                    const margin = maxDim * 0.15

                    // Helper to find 2D match
                    const find2dMatch = (dimName: string, val3d: number) => {
                        if (!comparisonData) return null
                        const allItems = [...comparisonData.matches, ...comparisonData.mismatches]
                        const item = allItems.find(m => m.dim_3d === dimName)
                        if (item) return item
                        // Fuzzy match by value
                        return allItems.find(m => Math.abs(m.value_3d - val3d) < 0.01) || null
                    }

                    // X dimension (width) - along bottom front edge
                    const xMatch = find2dMatch("bounding_box_x", size.x)
                    const xColor = xMatch ? (Math.abs(xMatch.difference) < 0.1 ? 0x16a34a : 0xdc2626) : 0x3b82f6
                    const xSubtext = xMatch ? `2D: ${xMatch.value_2d}mm ${Math.abs(xMatch.difference) < 0.1 ? "✓" : "△" + xMatch.difference.toFixed(2)}` : undefined
                    const xMid = createDimLine(scene,
                        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                        xColor, margin)
                    const xLabel = createDimLabel(`X: ${size.x.toFixed(2)}mm`, xColor === 0x16a34a ? "#16a34a" : xColor === 0xdc2626 ? "#dc2626" : "#3b82f6", xSubtext)
                    const xObj = new CSS2DObject(xLabel)
                    xObj.position.copy(xMid)
                    scene.add(xObj)

                    // Y dimension (height) - along left front edge
                    const yMatch = find2dMatch("bounding_box_y", size.y)
                    const yColor = yMatch ? (Math.abs(yMatch.difference) < 0.1 ? 0x16a34a : 0xdc2626) : 0xf59e0b
                    const ySubtext = yMatch ? `2D: ${yMatch.value_2d}mm ${Math.abs(yMatch.difference) < 0.1 ? "✓" : "△" + yMatch.difference.toFixed(2)}` : undefined
                    const yMid = createDimLine(scene,
                        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                        yColor, margin)
                    const yLabel = createDimLabel(`Y: ${size.y.toFixed(2)}mm`, yColor === 0x16a34a ? "#16a34a" : yColor === 0xdc2626 ? "#dc2626" : "#f59e0b", ySubtext)
                    const yObj = new CSS2DObject(yLabel)
                    yObj.position.copy(yMid)
                    scene.add(yObj)

                    // Z dimension (depth) - along bottom left edge
                    const zMatch = find2dMatch("bounding_box_z", size.z)
                    const zColor = zMatch ? (Math.abs(zMatch.difference) < 0.1 ? 0x16a34a : 0xdc2626) : 0x8b5cf6
                    const zSubtext = zMatch ? `2D: ${zMatch.value_2d}mm ${Math.abs(zMatch.difference) < 0.1 ? "✓" : "△" + zMatch.difference.toFixed(2)}` : undefined
                    const zMid = createDimLine(scene,
                        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                        zColor, margin)
                    const zLabel = createDimLabel(`Z: ${size.z.toFixed(2)}mm`, zColor === 0x16a34a ? "#16a34a" : zColor === 0xdc2626 ? "#dc2626" : "#8b5cf6", zSubtext)
                    const zObj = new CSS2DObject(zLabel)
                    zObj.position.copy(zMid)
                    scene.add(zObj)

                    // Add comparison match/mismatch labels for other dimensions
                    if (comparisonData) {
                        const allItems = [
                            ...comparisonData.matches.map(m => ({ ...m, matched: true })),
                            ...comparisonData.mismatches.map(m => ({ ...m, matched: false })),
                        ]
                        // Filter out bounding box items (already shown) and pick top items
                        const extras = allItems.filter(m =>
                            !m.dim_3d.startsWith("bounding_box") && m.dim_3d !== "unknown"
                        ).slice(0, 8)

                        extras.forEach((item, i) => {
                            // Place labels around the model at various positions
                            const angle = (i / extras.length) * Math.PI * 2
                            const labelDist = maxDim * 0.7
                            const px = center.x + Math.cos(angle) * labelDist
                            const py = center.y + (i % 2 === 0 ? maxDim * 0.2 : -maxDim * 0.1)
                            const pz = center.z + Math.sin(angle) * labelDist

                            const dimColor = item.matched ? "#16a34a" : "#dc2626"
                            const shortName = item.dim_3d.replace(/_/g, " ").replace(/circle|cylinder|face distance/i, (m: string) => m.charAt(0).toUpperCase() + m.slice(1))
                            const label = createDimLabel(
                                `${shortName}`,
                                dimColor,
                                `3D: ${item.value_3d}mm → 2D: ${item.value_2d}mm ${item.matched ? "✓" : "✗"}`
                            )
                            const obj = new CSS2DObject(label)
                            obj.position.set(px, py, pz)
                            scene.add(obj)

                            // Connection line to center
                            const lineGeom = new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(px, py, pz), center.clone()
                            ])
                            const lineMat = new THREE.LineBasicMaterial({
                                color: item.matched ? 0x16a34a : 0xdc2626,
                                transparent: true, opacity: 0.3,
                            })
                            scene.add(new THREE.Line(lineGeom, lineMat))
                        })
                    }
                }

                setLoading(false)
            } catch (err: any) {
                console.error("STP load error:", err)
                setError(`加载失败: ${err.message || "未知错误"}`)
                setLoading(false)
            }
        }
        loadStp()

        const handleResize = () => {
            if (!container || disposed) return
            const w = container.clientWidth
            camera.aspect = w / height
            camera.updateProjectionMatrix()
            renderer.setSize(w, height)
            labelRenderer.setSize(w, height)
        }
        window.addEventListener("resize", handleResize)

        return () => {
            disposed = true
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", handleResize)
            controls.dispose()
            renderer.dispose()
            rendererRef.current = null
            if (canvasWrapRef.current) {
                canvasWrapRef.current.remove()
                canvasWrapRef.current = null
            }
        }
    }, [file, height, comparisonData, showDimensions])

    return (
        <div ref={containerRef} style={{ width: "100%", height, position: "relative", borderRadius: 8, overflow: "hidden" }}>
            {loading && (
                <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(241,245,249,0.9)", zIndex: 10, flexDirection: "column", gap: 8,
                }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: 13, color: "#64748b" }}>解析 3D 模型中...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}
            {error && (
                <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#f1f5f9", zIndex: 10, flexDirection: "column", gap: 8,
                }}>
                    <span style={{ fontSize: 24 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
                </div>
            )}
            {dims && !loading && !error && (
                <div style={{
                    position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", color: "#fff",
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "monospace", zIndex: 5,
                }}>
                    包围盒: {dims.x} × {dims.y} × {dims.z} mm
                </div>
            )}
        </div>
    )
}
