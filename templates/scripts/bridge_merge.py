# Merge look sandboxes back into the main template folder, by owned files.
# Backs up main first (backup/<name>_<time>/), copies each sandbox's owned files, reports which owned files are
# missing or unchanged. Usage: python scripts/bridge_merge.py [cam,world,mat,post]
# Set ROOT to your Remotion project and NAME to the folder under src/videos/ (sandboxes are src/videos/<NAME>_<box>).
import os, shutil, sys, time, filecmp

ROOT = os.environ.get("REMOTION_ROOT", ".")
NAME = os.environ.get("SHORT", "dunia")
MAIN = os.path.join(ROOT, f"src/videos/{NAME}")
OWN = {
    "cam": ["story.ts"],
    "world": ["world.ts", "lights.ts", "shade.ts", "grade.ts"],
    "mat": ["paint.ts", "build.ts"],
    "post": ["ink.ts", "Dunia.tsx", "lensblur.ts"],
}
which = sys.argv[1].split(",") if len(sys.argv) > 1 else list(OWN)
bak = os.path.join(ROOT, "backup", time.strftime(f"{NAME}_%Y%m%d_%H%M%S"))
shutil.copytree(MAIN, bak)
print("backup ->", bak)
for box in which:
    src = os.path.join(ROOT, f"src/videos/{NAME}_{box}")
    for f in OWN[box]:
        a, b = os.path.join(src, f), os.path.join(MAIN, f)
        if not os.path.exists(a):
            print(f"  {box}: {f} not in sandbox (skipped)")
            continue
        if os.path.exists(b) and filecmp.cmp(a, b, shallow=False):
            print(f"  {box}: {f} unchanged")
            continue
        shutil.copy2(a, b)
        print(f"  {box}: {f} -> main")
