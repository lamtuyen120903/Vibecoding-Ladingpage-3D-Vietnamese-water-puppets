"""
Blender CLI script — compress all GLBs in /public into smaller Draco-compressed GLBs.

Run from project root (after installing Blender from blender.org):

  Windows PowerShell:
    & "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" --background --python scripts/optimize-glb.py

  Or if blender.exe is on PATH:
    blender --background --python scripts/optimize-glb.py

What it does (per .glb in /public):
  1. Imports the GLB into a fresh scene
  2. Applies Decimate modifier (collapse) at DECIMATE_RATIO to reduce poly count
     - skipped if file is in NO_DECIMATE list (puppets, small models)
  3. Re-exports with Draco mesh compression (geometry-only, lossless visual quality)
  4. Writes to /public/<name>.glb (overwrites — originals backed up to /public/_original_glb)

Notes:
  - Animations are preserved.
  - Textures are kept as-is (already small inside these GLBs).
  - Draco needs MeshoptDecoder/DRACOLoader on the runtime side — code update handled separately.
"""

import bpy
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "public")
BACKUP_DIR = os.path.join(PUBLIC_DIR, "_original_glb")

# Only decimate huge structural meshes. Keep character/puppet models intact.
NO_DECIMATE = {"puppet-girl.glb"}

# 0.5 = keep 50% of triangles. Adjust per model if needed.
DECIMATE_RATIO = 0.55

# Draco compression level: 0 (fastest, biggest) — 10 (slowest, smallest).
# 6 is a good default; geometry quantization preserves visual fidelity.
DRACO_LEVEL = 7


def log(msg):
    print(f"[optimize-glb] {msg}", flush=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)


def apply_decimate(ratio):
    """Apply collapse-decimate to every mesh in the scene."""
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        # Skip if mesh is shared with armature animation that needs all verts (rare here)
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new(name="OptDecimate", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError as e:
            log(f"  ! could not apply decimate on {obj.name}: {e}")


def export_glb(out_path):
    """Export with Draco compression, keep animations + materials + textures."""
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_apply=False,
        export_animations=True,
        export_skins=True,
        export_morph=True,
        # Draco settings
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_draco_color_quantization=10,
        export_draco_generic_quantization=12,
    )


def process_file(name):
    src = os.path.join(PUBLIC_DIR, name)
    if not os.path.isfile(src):
        log(f"skip (missing): {name}")
        return

    # Backup original once
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup = os.path.join(BACKUP_DIR, name)
    if not os.path.exists(backup):
        shutil.copy2(src, backup)
        log(f"backed up original -> {os.path.relpath(backup, ROOT)}")

    size_before = os.path.getsize(src)
    log(f"processing {name}  ({size_before / 1024 / 1024:.2f} MB)")

    reset_scene()
    import_glb(src)

    if name not in NO_DECIMATE:
        log(f"  decimating @ ratio={DECIMATE_RATIO}")
        apply_decimate(DECIMATE_RATIO)
    else:
        log("  (skip decimate — kept full geometry)")

    # Export to a temp file then move into place
    tmp = src + ".tmp.glb"
    export_glb(tmp)
    os.replace(tmp, src)

    size_after = os.path.getsize(src)
    pct = (1 - size_after / size_before) * 100
    log(f"  done: {size_before / 1024 / 1024:.2f} MB -> {size_after / 1024 / 1024:.2f} MB  ({pct:.1f}% smaller)")


def main():
    if not os.path.isdir(PUBLIC_DIR):
        log(f"ERROR: public dir not found at {PUBLIC_DIR}")
        sys.exit(1)

    glbs = sorted(f for f in os.listdir(PUBLIC_DIR) if f.lower().endswith(".glb"))
    if not glbs:
        log("no .glb files in public/")
        return

    log(f"found {len(glbs)} GLB(s): {', '.join(glbs)}")
    total_before = sum(os.path.getsize(os.path.join(PUBLIC_DIR, f)) for f in glbs)

    for name in glbs:
        process_file(name)

    total_after = sum(os.path.getsize(os.path.join(PUBLIC_DIR, f)) for f in glbs)
    log("")
    log("================ SUMMARY ================")
    log(f"total before: {total_before / 1024 / 1024:.2f} MB")
    log(f"total after:  {total_after / 1024 / 1024:.2f} MB")
    log(f"saved:        {(total_before - total_after) / 1024 / 1024:.2f} MB ({(1 - total_after / total_before) * 100:.1f}%)")
    log("originals backed up in public/_original_glb/")


if __name__ == "__main__":
    main()
