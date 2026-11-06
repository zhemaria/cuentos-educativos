# -*- coding: utf-8 -*-
"""Genera los cuentos para escuchar de prekínder (español e inglés), los cuatro
libros (portadas con mosaico) y la hoja de indicaciones de láminas y movimiento.
Uso:  python3 herramientas/gen_prek.py   (desde la raíz del repositorio)"""
import html, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from prek_cuentos import CIENCIAS, SOCIALES, ESTILO, MOV, METAS

RAIZ = pathlib.Path(__file__).resolve().parent.parent
def e(s): return html.escape(s, quote=True)

AREAS = {
 "ciencias": dict(lista=CIENCIAS, es_pre="pk-ciencias", en_pre="pk-science", es_n="Ciencias", en_n="Science",
                  es_libro="libro-prek-ciencias.html", en_libro="book-prek-science.html"),
 "sociales": dict(lista=SOCIALES, es_pre="pk-sociales", en_pre="pk-social-studies", es_n="Estudios sociales", en_n="Social studies",
                  es_libro="libro-prek-sociales.html", en_libro="book-prek-social-studies.html"),
}

def archivos(area, c):
    a = AREAS[area]
    es = "%s-%02d-%s.html" % (a["es_pre"], c["n"], c["es_slug"])
    en = "%s-%02d-%s.html" % (a["en_pre"], c["n"], c["en_slug"])
    base = "%s-%02d-%s" % (a["es_pre"], c["n"], c["es_slug"])   # las láminas usan el nombre en español
    return es, en, base

TX = {
 "es": dict(skip="Ir al cuento", ubic="Ubicación", idioma="Idioma", cuentos="Cuentos educativos", nivel="Prekínder",
            imprimir="Imprimir", visor="El cuento", escuchar="▶ Escuchar el cuento", parar="■ Parar",
            ant="Escena anterior", sig="Escena siguiente", fin="¡Fin!", otra="🔁 Otra vez", otro="Elegir otro cuento",
            adulto="Para el adulto que acompaña", pista="Toca una palabra para oírla sola.",
            ields="Estándares de Aprendizaje y Desarrollo Temprano de Illinois (IELDS)", cred="Ilustraciones generadas con inteligencia artificial",
            libro="Libro · Prekínder", sub="Cuentos para escuchar con Adrián y Génesis",
            libro_ent="Cuentos cortitos de dos o tres escenas. Lumi los lee en voz alta y cada palabra se ilumina mientras la dice: así los niños descubren que lo que se dice está escrito.",
            toca="Toca un cuento para escucharlo.", indice="index.html#prekinder"),
 "en": dict(skip="Skip to the story", ubic="Location", idioma="Language", cuentos="Educational stories", nivel="Pre-K",
            imprimir="Print", visor="The story", escuchar="▶ Listen to the story", parar="■ Stop",
            ant="Previous scene", sig="Next scene", fin="The end!", otra="🔁 Again", otro="Choose another story",
            adulto="For the grown-up", pista="Tap a word to hear it by itself.",
            ields="Illinois Early Learning and Development Standards (IELDS)", cred="Illustrations generated with artificial intelligence",
            libro="Book · Pre-K", sub="Stories to listen to with Adrián and Génesis",
            libro_ent="Very short stories with two or three scenes. Lumi reads them aloud and each word lights up as it is spoken, so children discover that what we say can be written.",
            toca="Tap a story to listen to it.", indice="index-en.html#pre-k"),
}

def selector(L, otro):
    if L == "es":
        return ('<span class="selector-idioma" role="group" aria-label="Idioma"><span aria-hidden="true">🌐</span>'
                '<a href="%s" lang="en" hreflang="en">English</a><span class="op" aria-current="true" lang="es">Español</span></span>' % otro)
    return ('<span class="selector-idioma" role="group" aria-label="Language"><span aria-hidden="true">🌐</span>'
            '<span class="op" aria-current="true" lang="en">English</span><a href="%s" lang="es" hreflang="es">Español</a></span>' % otro)

def cabeza(L, titulo, desc):
    lic = "https://creativecommons.org/licenses/by-nc-sa/4.0/" + ("deed.es" if L == "es" else "")
    return f"""<!DOCTYPE html>
<!--
  Cuentos educativos · Prekínder · {e(titulo)}
  Autor: José M. Fernández · Desarrollo: Claude (Anthropic)
  Licencia: Creative Commons BY-NC-SA 4.0 · {lic}
  Generado con herramientas/gen_prek.py: para cambiar el texto, editar herramientas/prek_cuentos.py
-->
<html lang="{L}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)} · {e(TX[L]['cuentos'])}</title>
<meta name="description" content="{e(desc)}">
<meta name="author" content="José M. Fernández">
<meta name="license" content="CC BY-NC-SA 4.0">
<link rel="license" href="{lic}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap">
<link rel="stylesheet" href="cuentos.css">
<link rel="stylesheet" href="cuentos-prek.css">
</head>
"""

def pagina(area, c, L):
    a, t = AREAS[area], TX[L]
    es, en, base = archivos(area, c)
    otro = en if L == "es" else es
    libro = a[L + "_libro"]
    meta = METAS[c["meta"]][0 if L == "es" else 1]
    tit, ent = c[L + "_t"], c[L + "_e"]
    esc_html = ""
    for i, s in enumerate(c["escenas"], 1):
        esc_html += (f'      <figure class="pk-escena" id="escena-{i}" data-img="{base}-{i}.jpg" data-video="{base}-{i}.mp4" '
                     f'data-emoji="{s["emoji"]}" data-alt="{e(s["alt_" + L])}">\n'
                     f'        <div class="pk-marco"></div>\n'
                     f'        <p class="pk-texto">{e(s[L])}</p>\n'
                     f'      </figure>\n')
    return cabeza(L, tit, ent) + f"""<body class="prek">
<a class="salto" href="#cuento">{t['skip']}</a>
<main class="hoja">

  <nav class="migas" aria-label="{t['ubic']}">
    <span><a href="{t['indice']}">{t['cuentos']}</a> · <a href="{libro}">{t['nivel']} · {a[L + '_n']}</a></span>
    {selector(L, otro)}
  </nav>

  <p class="sello">{t['nivel']} · {a[L + '_n']}</p>
  <h1 id="titulo">{e(tit)}</h1>

  <section class="pk-visor" id="cuento" aria-label="{t['visor']}" tabindex="-1">
    <div class="pk-escenas">
{esc_html}    </div>
    <p class="pk-estado sr-only" aria-live="polite"></p>
    <div class="pk-controles">
      <button type="button" class="pk-flecha pk-anterior" aria-label="{t['ant']}">◀</button>
      <button type="button" class="pk-escuchar">{t['escuchar']}</button>
      <button type="button" class="pk-parar" hidden>{t['parar']}</button>
      <button type="button" class="pk-flecha pk-siguiente" aria-label="{t['sig']}">▶</button>
    </div>
    <div class="pk-puntos" role="group" aria-label="{t['visor']}"></div>
    <div class="pk-fin" hidden>
      <p>{t['fin']} <span aria-hidden="true">🎉</span></p>
      <button type="button" class="pk-otra">{t['otra']}</button>
      <a href="{libro}">{t['otro']}</a>
    </div>
  </section>
  <p class="pista" style="text-align:center">{t['pista']}</p>

  <details class="pk-adulto">
    <summary>{t['adulto']}</summary>
    <p>{e(ent)}</p>
    <p>{e(c[L + '_adulto'])}</p>
    <p style="font-size:.9rem;color:var(--tinta-suave)">{t['ields']}: {e(meta)}.</p>
  </details>

  <div class="apoyos" role="group" aria-label="{t['imprimir']}">
    <button type="button" id="btn-imprimir">{t['imprimir']}</button>
  </div>
  <p class="creditos">José M. Fernández · Claude (Anthropic) · {t['cred']}</p>
</main>
<script src="cuentos-prek.js"></script>
</body>
</html>
"""

def libro(area, L):
    a, t = AREAS[area], TX[L]
    otro = a["en_libro"] if L == "es" else a["es_libro"]
    tit = a[L + "_n"]
    tarj = ""
    for c in a["lista"]:
        es, en, base = archivos(area, c)
        f = es if L == "es" else en
        tarj += (f'      <li><a href="{f}"><span class="pk-mini"><img src="{base}-1.jpg" alt="" loading="lazy" '
                 f'onerror="this.replaceWith(document.createTextNode(\'{c["emoji"]}\'))"></span>'
                 f'<strong>{e(c[L + "_t"])}</strong></a></li>\n')
    desc = t["libro_ent"]
    return cabeza(L, tit + " · " + t["nivel"], desc) + f"""<body class="prek">
<a class="salto" href="#indice">{t['skip']}</a>
<main class="hoja">
  <nav class="migas" aria-label="{t['ubic']}">
    <span><a href="{t['indice']}">{t['cuentos']}</a> · {t['nivel']} · {tit}</span>
    {selector(L, otro)}
  </nav>
  <header class="portada-libro">
    <p class="sello">{t['libro']}</p>
    <h1>{tit}</h1>
    <p class="subtitulo">{t['sub']}</p>
    <p class="entrada">{e(desc)}</p>
  </header>
  <h2 id="indice" tabindex="-1">{t['toca']}</h2>
  <ul class="pk-mosaico">
{tarj}  </ul>
  <p class="creditos">José M. Fernández · Claude (Anthropic) · {t['cred']}</p>
</main>
<script src="https://zhemaria.github.io/primaria/nav-lumi.js" data-grado="prek"></script>
</body>
</html>
"""

def indicaciones():
    tarjetas, indice = "", ""
    for area in ("ciencias", "sociales"):
        a = AREAS[area]
        indice += "<li><strong>%s</strong><ul>" % a["es_n"]
        for c in a["lista"]:
            es, en, base = archivos(area, c)
            ancla = base
            indice += '<li><a href="#%s">%d. %s</a></li>' % (ancla, c["n"], e(c["es_t"]))
            escenas = ""
            for i, s in enumerate(c["escenas"], 1):
                p = s["p"] + ", " + ESTILO
                m = MOV.format(m=s["m"])
                escenas += f"""
      <div class="esc">
        <h3>Escena {i} <small>· {e(s['es'])}</small></h3>
        <p class="ind">Lámina: <code>{base}-{i}.jpg</code> · 1376 × 768 · JPEG &nbsp; Video (opcional): <code>{base}-{i}.mp4</code></p>
        <p class="ver"><strong>Lo que debe verse:</strong> {e(s['alt_es'])}</p>
        <p class="caja" id="p-{base}-{i}">{e(p)}</p>
        <p><button type="button" class="copiar" data-de="p-{base}-{i}">Copiar indicación de la lámina</button></p>
        <p class="caja mov" id="m-{base}-{i}">{e(m)}</p>
        <p><button type="button" class="copiar" data-de="m-{base}-{i}">Copiar indicación de movimiento (Veo)</button></p>
      </div>"""
            tarjetas += f"""
    <section class="lam" id="{ancla}">
      <h2>{a['es_n']} {c['n']}. {e(c['es_t'])} <small>({e(c['en_t'])})</small></h2>
      <p class="ind">Páginas: <code>{es}</code> · <code>{en}</code></p>{escenas}
      <p><a href="#indice">↑ Volver al índice</a></p>
    </section>"""
        indice += "</ul></li>"
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Láminas de prekínder · Indicaciones</title>
<style>
:root{{--tinta:#1f2a30;--suave:#46555e;--papel:#fbf7ef;--verde:#1f5f52;--ambar:#5c3900;--ambar-claro:#fbf1dd;--azul:#0f4c75;--azul-claro:#e3f0f8;--borde:#d9d1c1}}
body{{margin:0;background:var(--papel);color:var(--tinta);font-family:"Segoe UI",system-ui,sans-serif;line-height:1.6}}
main{{max-width:52rem;margin:0 auto;padding:1rem 16px 4rem}} h1{{color:var(--verde)}} h2{{font-size:1.2rem;margin:0 0 .4rem}} h2 small,h3 small{{color:var(--suave);font-weight:400}}
h3{{font-size:1rem;margin:1rem 0 .3rem}}
.lam{{background:#fff;border:1px solid var(--borde);border-radius:14px;padding:1rem;margin:1rem 0;scroll-margin-top:1rem}}
.esc{{border-top:1px dashed var(--borde);padding-top:.4rem}}
.caja{{background:var(--ambar-claro);border-left:5px solid var(--ambar);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0}}
.caja.mov{{background:var(--azul-claro);border-left-color:var(--azul)}}
.ind{{margin:0 0 .4rem;font-size:.95rem}} code{{background:#eee;padding:0 .3rem;border-radius:4px;word-break:break-all}}
.copiar{{font:inherit;min-height:44px;padding:.3rem 1rem;border-radius:10px;border:2px solid var(--verde);background:var(--verde);color:#fff;cursor:pointer}}
.mov + p .copiar{{background:var(--azul);border-color:var(--azul)}}
.copiar:focus-visible,a:focus-visible{{outline:3px solid #8c3b2e;outline-offset:3px}} a{{color:var(--verde)}}
#aviso{{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);background:var(--verde);color:#fff;padding:.5rem 1rem;border-radius:999px}}
.indice ul{{margin:.2rem 0 .6rem}}
</style>
</head>
<body>
<main>
  <h1>Láminas de prekínder · Cuentos para escuchar</h1>
  <p>Son 16 cuentos (8 de ciencias y 8 de estudios sociales) con dos o tres escenas cada uno: 46 láminas en total. Cada indicación ya trae el estilo de acuarela, el formato 16:9 y la regla de «dos brazos, dos manos, sin letras».</p>
  <ol>
    <li>Copie la <strong>indicación de la lámina</strong> (caja amarilla) y péguela en Poe. Guarde la lámina con el nombre que aparece en la tarjeta.</li>
    <li>Si quiere el video, suba esa lámina al bot <strong>Veo-3.1-Fast</strong> y pegue la <strong>indicación de movimiento</strong> (caja azul). Guarde el video con el mismo nombre y extensión <code>.mp4</code>.</li>
    <li>Mándeme las láminas y los videos (o súbalos a la raíz de <code>cuentos-educativos</code>). El cuento los usa solo: si hay video, lo muestra; si no, la lámina; y mientras no haya nada, un dibujo grande de espera.</li>
  </ol>
  <p><strong>Personajes:</strong> Adrián (pelo negro azabache, camiseta roja, dinosaurio de peluche verde), Génesis (pelo negro, vestido rosado salmón, osita con lacito rosado) y Emir (aparece en tres cuentos de estudios sociales).</p>
  <h2 id="indice">Índice</h2>
  <ul class="indice">{indice}</ul>
{tarjetas}
</main>
<p id="aviso" hidden role="status"></p>
<script>
document.querySelectorAll('.copiar').forEach(function(b){{
  b.addEventListener('click', function(){{
    var t = document.getElementById(b.getAttribute('data-de')).textContent;
    var hecho = function(){{ var a = document.getElementById('aviso'); a.textContent = 'Copiado. Péguelo en Poe.'; a.hidden = false; setTimeout(function(){{ a.hidden = true; }}, 1800); }};
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(hecho, function(){{ prompt('Copie el texto:', t); }});
    else prompt('Copie el texto:', t);
  }});
}});
</script>
</body>
</html>
"""

def catalogo():
    """Entradas para catalogo.js (grado 'prek')."""
    out = []
    orden = 0
    for area in ("ciencias", "sociales"):
        for c in AREAS[area]["lista"]:
            es, en, base = archivos(area, c)
            orden += 1
            out.append({"id": base, "grado": "prek", "area": area, "orden": -100 + orden,
                        "estandar": "IELDS " + c["meta"],
                        "es": {"titulo": c["es_t"], "archivo": es, "tema": c["es_e"].rstrip(".")},
                        "en": {"titulo": c["en_t"], "archivo": en, "tema": c["en_e"].rstrip(".")},
                        "imagen": base + "-1.jpg"})
    return out

if __name__ == "__main__":
    n = 0
    for area in AREAS:
        for c in AREAS[area]["lista"]:
            es, en, base = archivos(area, c)
            (RAIZ / es).write_text(pagina(area, c, "es"), encoding="utf-8")
            (RAIZ / en).write_text(pagina(area, c, "en"), encoding="utf-8")
            n += 2
        for L in ("es", "en"):
            (RAIZ / AREAS[area][L + "_libro"]).write_text(libro(area, L), encoding="utf-8")
    (RAIZ / "indicaciones-laminas-prek.html").write_text(indicaciones(), encoding="utf-8")
    (RAIZ / "herramientas" / "prek_catalogo.json").write_text(json.dumps(catalogo(), ensure_ascii=False, indent=2), encoding="utf-8")
    print(n, "cuentos, 4 libros, 1 hoja de indicaciones")
