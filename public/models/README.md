# ONNX model

Place the HT-Demucs ONNX model here as `htdemucs.onnx` (hundreds of MB).

Without it, the app runs in **demo fallback mode** (heuristic splitter) so the
full flow can be tested. For production:

1. Export HT-Demucs (Demucs v4) to ONNX, e.g. via `demucs` + `onnx` tooling,
   or download a community ONNX build and verify its license.
2. Put the file at `public/models/htdemucs.onnx`.
3. The browser worker loads it lazily with ONNX Runtime Web (WebGPU → WASM)
   and caches it via Cache Storage.

Demucs is MIT-licensed; weight licenses depend on the source — check before
commercial use.
