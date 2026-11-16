import type { DeviceCapabilities } from "@/types";

export async function detectCapabilities(): Promise<DeviceCapabilities> {
  let webgpu = false;
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      const adapter = await (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu?.requestAdapter();
      webgpu = !!adapter;
    }
  } catch {
    webgpu = false;
  }
  const wasmSimd = (() => {
    try {
      return typeof WebAssembly !== "undefined" && WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
    } catch {
      return false;
    }
  })();
  const memoryGB = typeof navigator !== "undefined" && "deviceMemory" in navigator
    ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) || null
    : null;
  const browser = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4;
  return {
    webgpu,
    wasmSimd,
    memoryGB,
    browser,
    cores,
    backend: webgpu ? "webgpu" : "wasm",
  };
}

export function recommendMode(caps: DeviceCapabilities): "browser" | "cloud" {
  if (caps.webgpu) return "browser";
  if (caps.memoryGB !== null && caps.memoryGB < 4) return "cloud";
  return "browser";
}
