declare module "occt-import-js" {
    interface OcctMesh {
        attributes: {
            position: { array: Float32Array }
            normal?: { array: Float32Array }
        }
        index?: { array: Uint32Array }
        color?: number[]
    }
    interface OcctResult {
        success: boolean
        meshes: OcctMesh[]
    }
    interface OcctInstance {
        ReadStepFile(buffer: Uint8Array, params: unknown): OcctResult
    }
    export default function (options?: Record<string, unknown>): Promise<OcctInstance>
}
