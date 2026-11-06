#!/usr/bin/env bash
# Prepara las láminas y los videos de un cuento de prekínder para la web.
#   Uso: herramientas/preparar_medios.sh CARPETA_CON_LOS_ARCHIVOS BASE [CARPETA_DE_REVISION]
#   BASE es el nombre sin número de escena, p. ej. pk-ciencias-03-sol-lluvia
# - Láminas: a JPEG de verdad (calidad 85), aunque vengan en PNG con extensión .jpg.
# - Videos: sin sonido (solo se oye a Lumi), H.264 comprimido, listo para empezar a verse rápido.
# - Deja en CARPETA_DE_REVISION una hoja con las láminas y otra con cuadros de cada video.
set -euo pipefail
ORIGEN="$1"; BASE="$2"; REV="${3:-$ORIGEN}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$REV"
for f in "$ORIGEN/$BASE"-*.jpg; do
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'JPEG',quality=85,optimize=True,progressive=True)" "$f" "$REPO/$(basename "$f")"
done
for f in "$ORIGEN/$BASE"-*.mp4; do
  n="$(basename "$f")"
  ffmpeg -v error -y -i "$f" -an -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -movflags +faststart "$REPO/$n"
  ffmpeg -v error -y -i "$REPO/$n" -vf "fps=0.5,scale=320:-1,tile=4x1" -frames:v 1 "$REV/cuadros-${n%.mp4}.png"
done
python3 - "$REPO" "$BASE" "$REV" <<'EOF'
import sys, glob, os
from PIL import Image
repo, base, rev = sys.argv[1:]
lams = sorted(glob.glob(os.path.join(repo, base + "-*.jpg")))
ims = [Image.open(f).resize((427, 238)) for f in lams]
if ims:
    o = Image.new("RGB", (427 * len(ims), 238), "white")
    for k, i in enumerate(ims): o.paste(i, (k * 427, 0))
    o.save(os.path.join(rev, "laminas.png"))
cs = [Image.open(f) for f in sorted(glob.glob(os.path.join(rev, "cuadros-" + base + "-*.png")))]
if cs:
    o = Image.new("RGB", (max(c.width for c in cs), sum(c.height for c in cs)), "white"); y = 0
    for c in cs: o.paste(c, (0, y)); y += c.height
    o.save(os.path.join(rev, "videos.png"))
EOF
ls -la "$REPO/$BASE"-*
