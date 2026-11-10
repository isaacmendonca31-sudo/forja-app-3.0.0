"""Gera os ícones SVG/PNG do PWA (requer Pillow). Uso: python3 scripts/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

THEMES = {
    "green": ("#76E06F", (118, 224, 111, 255)),
    "blue": ("#70B7FF", (112, 183, 255, 255)),
    "purple": ("#C49AFF", (196, 154, 255, 255)),
    "orange": ("#FFB86B", (255, 184, 107, 255)),
}
DARK = (14, 15, 18, 255)

def draw(size, maskable, accent):
    s = size * 4  # supersampling para bordas suaves
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, s, s], fill=accent)      # sangria total (o SO aplica a máscara)
        scale, off = 0.56, 0.22                      # letra dentro da "zona segura" de 80%
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=accent)
        scale, off = 0.64, 0.18
    # Letra "F" definida no grid 512 do icon.svg
    pts = [(160,112),(368,112),(368,179),(234,179),(234,233),(336,233),(336,300),(234,300),(234,400),(160,400)]
    # normaliza a caixa (160..368 x 112..400) → escala/offset
    minx, maxx, miny, maxy = 160, 368, 112, 400
    w, h = maxx - minx, maxy - miny
    k = (s * scale) / max(w, h)
    ox = s * off + ((s * scale) - w * k) / 2 + s * (0.64 - scale) / 2 * 0
    oy = s * off + ((s * scale) - h * k) / 2
    poly = [(ox + (x - minx) * k, oy + (y - miny) * k) for x, y in pts]
    d.polygon(poly, fill=DARK)
    return img.resize((size, size), Image.LANCZOS)

for theme, (svg_color, accent) in THEMES.items():
    name = "icon" if theme == "green" else f"icon-{theme}"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="FORJA">
  <rect width="512" height="512" rx="112" fill="{svg_color}"/>
  <path d="M160 112h208v67H234v54h102v67H234v100h-74z" fill="#0E0F12"/>
</svg>
'''
    Path(f"icons/{name}.svg").write_text(svg, encoding="utf-8")
    draw(192, False, accent).save(f"icons/{name}-192.png")
    draw(512, False, accent).save(f"icons/{name}-512.png")
    draw(512, True, accent).save(f"icons/{name}-maskable-512.png")
print("ok")
