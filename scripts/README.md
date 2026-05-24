# Optimization scripts

## 1. Compress GLB models with Blender (~92 MB -> ~10-15 MB expected)

**Step 1 — Install Blender** (one-time): https://www.blender.org/download/
Tested with Blender 4.x. After install, locate `blender.exe` (default:
`C:\Program Files\Blender Foundation\Blender 4.x\blender.exe`).

**Step 2 — Run from project root** (PowerShell):

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" --background --python scripts/optimize-glb.py
```

Or if `blender.exe` is on your PATH:

```powershell
blender --background --python scripts/optimize-glb.py
```

What it does (per `.glb` in `public/`):

1. Backs up the original to `public/_original_glb/` (only on first run).
2. Applies Decimate (collapse) at 55% to non-puppet meshes.
3. Re-exports with Draco mesh compression (lossless visual quality, ~5-8x smaller geometry).

Animations, materials and textures are preserved.

Tweak `DECIMATE_RATIO`, `DRACO_LEVEL`, and `NO_DECIMATE` at the top of
`optimize-glb.py` if you want different trade-offs.

The runtime already loads Draco from a CDN
(`https://www.gstatic.com/draco/v1/decoders/`) via drei's `useGLTF(url, true, true)` —
no code change needed after running the script.

## 2. Optimize images (already run — 2.77 MB -> 770 KB)

```powershell
node scripts/optimize-images.mjs
```

Backs up originals to `public/_original_img/` and produces `.webp` next to each
PNG/JPG. The source code already references `.webp` paths.

## Restore originals

```powershell
# GLBs
Copy-Item public/_original_glb/*.glb public/ -Force

# Images
Copy-Item public/_original_img/* public/ -Force
```
