"""
Generador de los cuentos de 6.º grado (cuentos-educativos).
Cada cuento se escribe como un diccionario de Python en historias6/*.py (variable CUENTO).
Este script produce:
  - la página del cuento (grade6-<area>-NN-<slug>.html), con la misma estructura que los de 5.º
  - el libro en línea en acordeón (book-grade6-science.html / book-grade6-social-studies.html)
  - las indicaciones para las láminas (indicaciones-laminas-6to-ciencias.html / -sociales.html)
  - las entradas del catálogo (catalogo.js), sin tocar las de los demás grados
Marcas dentro de los párrafos:
  [[clave|texto]]  → botón de vocabulario (abre el glosario)
  {{a|texto}}      → cita «a» (la pregunta A señala ese trozo del cuento)
Uso: python3 herramientas/gen6.py
"""
import glob, html, importlib.util, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ESTILO = ("each person has exactly two arms and two hands, no text, letters or numbers anywhere in the picture, "
          "soft watercolor fairy-tale style, simple bright scene for a sixth grade picture book, wide 16:9 landscape format")
AREA = {
  "ciencias": {"en":"Science", "es":"Ciencias", "slug":"science", "palabras":"Science words", "palabras_largo":"Science words you will learn",
               "libro":"book-grade6-science.html", "ind":"indicaciones-laminas-6to-ciencias.html", "base":"Based on the Illinois Learning Standards for Science (NGSS)",
               "estd":"Illinois standard (NGSS)"},
  "sociales": {"en":"Social studies", "es":"Estudios sociales", "slug":"social-studies", "palabras":"Key words", "palabras_largo":"Key words you will learn",
               "libro":"book-grade6-social-studies.html", "ind":"indicaciones-laminas-6to-sociales.html", "base":"Based on the Illinois Learning Standards for Social Science",
               "estd":"Illinois Social Science standards"},
}
LETRAS = "abcdefgh"
e = lambda s: html.escape(str(s), quote=False)
ea = lambda s: html.escape(str(s), quote=True)

def cargar():
    lista = []
    for f in sorted(glob.glob(os.path.join(RAIZ, "herramientas", "historias6", "*.py"))):
        spec = importlib.util.spec_from_file_location("h", f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        lista.extend(getattr(m, "CUENTOS", [getattr(m, "CUENTO", None)]) if hasattr(m, "CUENTOS") else [m.CUENTO])
    return lista

def marcas(texto, pre=""):
    t = e(texto)
    t = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", lambda m: f'<button type="button" class="voz" data-g="{pre}{m.group(1)}">{m.group(2)}</button>', t)
    t = re.sub(r"\{\{([a-h])\|(.+?)\}\}", lambda m: f'<span class="cita" id="{pre}c-{m.group(1)}">{m.group(2)}</span>', t)
    return t

def archivo(c): return f"grade6-{AREA[c['area']]['slug']}-{c['n']:02d}-{c['slug']}"

def fichas(c, pre=""):
    return "\n".join(f'      <li><button type="button" class="voz" data-g="{pre}{k}">{e(w)}</button></li>' for k, w, *_ in c["palabras"])

def glosario(c, pre=""):
    return "\n".join(f'    <div id="g-{pre}{k}"><dt>{e(w)}</dt><dd>{e(d)}</dd><dd class="ayuda-es caja-es" lang="es"><strong>{e(wes)}:</strong> {e(des)}</dd></div>'
                     for k, w, d, wes, des in c["palabras"])

def cuento(c, pre=""):
    return "\n\n".join(f'    <p id="{pre}p{i+1}">{marcas(p, pre)}</p>' for i, p in enumerate(c["parrafos"]))

def preguntas(c, pre=""):
    out = []
    for i, (letra, q, qes, ops, ok, expl) in enumerate(c["preguntas"]):
        L = LETRAS[i].upper()
        out.append(f'''    <li class="pregunta" id="{pre}pregunta-{LETRAS[i]}" data-cita="{pre}c-{letra}" data-correcta="{ok}">
      <p class="enunciado"><span class="letra" aria-hidden="true">{L}</span><span class="texto-enunciado"><span class="sr-only">Question {L}. </span>{e(q)}</span></p>
      <p class="ayuda-es caja-es" lang="es">{e(qes)}</p>
      <div class="opciones" role="group" aria-label="Options for question {L}">
''' + "\n".join(f'        <button class="opcion">{e(o)}</button>' for o in ops) + f'''
      </div>
      <p class="explicacion" hidden>{ea(expl)}</p>
    </li>''')
    return "\n\n".join(out)

def pausa(c, pre="", h="h2"):
    p = c.get("pausa")
    if not p: return ""
    enlace = f'''    <p><a class="enlace-pausa" href="{ea(p['enlace'][0])}" target="_blank" rel="noopener noreferrer">{e(p['enlace'][1])} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></p>\n''' if p.get("enlace") else ""
    ritmo = f'''    <p><button type="button" class="ritmo" data-ritmo="{p['ritmo']}" aria-pressed="false">🎵 {e(p['ritmo_txt'])}</button></p>\n''' if p.get("ritmo") else ""
    versos = ""
    if p.get("versos"):
        versos = f'''    <blockquote class="versos">\n      <p>{"<br>".join(e(v) for v in p["versos"])}</p>\n      <footer>{e(p["versos_fuente"])}</footer>\n    </blockquote>\n'''
    describe = ""
    if p.get("describe"):
        describe = f'''    <p class="describe"><strong>{e(p.get("describe_tit","What you will see:"))}</strong> {e(p["describe"])}</p>
    <p class="ayuda-es caja-es" lang="es"><strong>{e(p.get("describe_tit_es","Lo que verás:"))}</strong> {e(p["describe_es"])}</p>\n'''
    pregs = "\n".join(f'      <li>{e(a)}<span class="ayuda-es caja-es" lang="es">{e(b)}</span></li>' for a, b in p["preguntas"])
    return f'''  <section class="pausa" id="{pre}pausa" aria-labelledby="{pre}tit-pausa">
    <{h} id="{pre}tit-pausa">Pause to connect</{h}>
    <p class="pausa-arte"><span aria-hidden="true">{p['emoji']} </span>{e(p['arte'])}</p>
    <p>{e(p['intro'])}</p>
    <p class="ayuda-es caja-es" lang="es">{e(p['intro_es'])}</p>
{enlace}{ritmo}{versos}{describe}    <ol class="pausa-preguntas">
{pregs}
    </ol>
    <p class="reto-como">Think about it, then answer in your notebook or talk it over with someone at home.</p>
    <details class="reto-pista"><summary>Check your thinking</summary><p>{ea(p['pista'])}</p></details>
  </section>
'''

def reto(c, pre="", h="h2"):
    r = c["reto"]
    mas = ""
    if c.get("mdc"):
        m = c["mdc"]
        mas = f'''    <div class="reto-mas">
    <p class="reto-tipo">Go further</p>
    <p class="reto-pregunta">{e(m['pregunta'])}</p>
    <p class="ayuda-es caja-es" lang="es"><strong>Para ir más lejos.</strong> {e(m['pregunta_es'])}</p>
    <details class="reto-pista"><summary>Check your thinking</summary><p>{ea(m['pista'])}</p></details>
    </div>
'''
    return f'''  <section class="reto" id="{pre}reto" aria-labelledby="{pre}tit-reto">
    <{h} id="{pre}tit-reto">Challenge: explain your thinking</{h}>
    <p class="reto-tipo">{e(r['tipo'])}</p>
    <p class="reto-pregunta">{e(r['pregunta'])}</p>
    <p class="ayuda-es caja-es" lang="es"><strong>{e(r['tipo_es'])}.</strong> {e(r['pregunta_es'])}</p>
    <p class="reto-como">Answer in your notebook or talk it over with a classmate. Use evidence from the story.</p>
    <p class="ayuda-es caja-es" lang="es">Responde en tu cuaderno o coméntalo con un compañero. Usa evidencia del cuento.</p>
    <details class="reto-pista"><summary>Check your thinking</summary><p>{ea(r['pista'])}</p></details>
{mas}  </section>'''

def figura(c, lazy=False, sangria="  "):
    f = archivo(c)
    vid = f' data-video="{f}.mp4"' if c.get("video") else ""
    return f'''{sangria}<figure class="lamina"{vid}>
{sangria}  <img src="{f}.jpg" width="1376" height="768"{' loading="lazy"' if lazy else ''}
{sangria}       alt="{ea(c['alt'])}">
{sangria}</figure>'''

def pagina(c):
    A = AREA[c["area"]]; f = archivo(c); n = c["n"]
    indice = ['<li><a href="#palabras">' + A["palabras"] + '</a></li>', '<li><a href="#cuento">The story</a></li>']
    if c.get("pausa"): indice.append('<li><a href="#pausa">Pause to connect</a></li>')
    indice += ['<li><a href="#glosario">Glossary</a></li>', '<li><a href="#preguntas">Questions</a></li>', '<li><a href="#reto">Challenge</a></li>']
    return f'''<!DOCTYPE html>
<!--
  Educational stories · Grade 6 · {A['en']} · {c['std']}
  «{c['titulo']}»
  From Grade 5 on, the stories are in English, with optional help in Spanish.
  Author: José M. Fernández · Development: Claude (Anthropic) · Illustration: AI
  License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
  https://creativecommons.org/licenses/by-nc-sa/4.0/
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(c['titulo'])} · Educational stories</title>
<meta name="description" content="{ea(c['descripcion'])}">
<meta name="author" content="José M. Fernández">
<meta name="license" content="CC BY-NC-SA 4.0">
<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap">
<link rel="stylesheet" href="cuentos.css">
</head>
<body>
<a class="salto" href="#cuento">Skip to the story</a>

<main class="hoja">

  <nav class="migas" aria-label="Location">
    <span><a href="index-en.html#grade-6">Educational stories</a> · Grade 6 · {A['en']}</span>
    <a class="idioma" href="{A['libro']}#capitulo-{n}">📖 The whole book</a>
  </nav>

  <div class="apoyos" role="group" aria-label="Reading supports">
    <button type="button" id="btn-voz" aria-pressed="false">Listen to the story</button>
    <button type="button" id="btn-ayuda" class="btn-ayuda" aria-pressed="false" lang="es"><span aria-hidden="true">🌐 </span>Ayuda en español</button>
    <button type="button" id="btn-menor">A<span aria-hidden="true">−</span><span class="sr-only"> Smaller text</span></button>
    <button type="button" id="btn-mayor">A<span aria-hidden="true">+</span><span class="sr-only"> Bigger text</span></button>
    <button type="button" id="btn-contraste" aria-pressed="false">High contrast</button>
    <button type="button" id="btn-imprimir">Print</button>
  </div>

{figura(c)}

  <p class="sello">Grade 6 · {A['en']} · {e(c['std'])}</p>
  <h1 id="titulo">{e(c['titulo'])}</h1>
  <p class="entrada">{e(c['entrada'])}</p>
  <p class="ayuda-es caja-es" lang="es"><strong>{e(c['titulo_es'])}.</strong> {e(c['entrada_es'])}</p>

  <ul class="indice" aria-label="Parts of this page">
    {chr(10).join('    ' + x if i else x for i, x in enumerate(indice))}
  </ul>

  <section class="clave" id="palabras" aria-labelledby="tit-palabras">
    <h2 id="tit-palabras">{A['palabras_largo']}</h2>
    <ul class="fichas">
{fichas(c)}
    </ul>
    <p style="margin:.7rem 0 0;font-size:.95rem">Tap a green word to see what it means.</p>
    <p class="ayuda-es caja-es" lang="es">Toca una palabra verde para ver qué significa. Con la ayuda activada, verás también la definición en español.</p>
  </section>

  <h2 id="cuento" tabindex="-1">The story</h2>
  <p class="ayuda-es caja-es" lang="es">El cuento está en inglés. Pulsa «Listen to the story» para escucharlo y toca las palabras verdes cuando no entiendas una.</p>
  <div class="cuento">
{cuento(c)}
  </div>

{pausa(c)}  <h2 id="tit-glosario">Glossary</h2>
  <dl class="glosario" id="glosario" aria-labelledby="tit-glosario">
{glosario(c)}
  </dl>

  <h2 id="preguntas">Questions</h2>
  <p>Choose the correct answer. If you make a mistake, the story shows you where the answer is.</p>
  <p class="ayuda-es caja-es" lang="es">Elige la respuesta correcta. Si te equivocas, el cuento te muestra dónde está la respuesta.</p>
  <ol class="preguntas">
{preguntas(c)}
  </ol>
  <p class="puntaje" id="puntaje" hidden role="status" aria-live="polite"></p>
{reto(c)}

  <footer class="pie">
    <p><strong>José M. Fernández</strong> · Development: Claude (Anthropic) · Illustration generated with artificial intelligence.</p>
    <p>{A['estd']} {e(c['std'])}: {e(c['std_texto'])}</p>
    <p>Licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="license">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)</a>.</p>
  </footer>
</main>
<script src="cuentos.js"></script>
</body>
</html>
'''

def capitulo(c):
    A = AREA[c["area"]]; n = c["n"]; pre = f"c{n}-"; f = archivo(c)
    return f'''  <details class="capitulo" id="capitulo-{n}" data-capitulo="{n}" name="libro">
    <summary><span class="num" aria-hidden="true">{n}</span><span class="cab"><h2 id="c{n}-titulo"><span class="sr-only">Chapter {n}: </span><span class="titulo-cap">{e(c['titulo'])}</span></h2><small>{e(c['tema'])}</small></span></summary>
    <div class="cuerpo-cap">
{figura(c, lazy=True, sangria="    ")}
    <p class="sello">Grade 6 · {A['en']} · {e(c['std'])}</p>
    <p class="entrada">{e(c['entrada'])}</p>
    <p class="ayuda-es caja-es" lang="es"><strong>{e(c['titulo_es'])}.</strong> {e(c['entrada_es'])}</p>
    <div class="herramientas-cap">
      <button type="button" class="voz-capitulo" data-capitulo="{n}"></button>
      <a class="al-indice" href="{f}.html">Open this story alone</a>
    </div>
    <section class="clave" aria-label="{A['palabras']}">
      <h3>{A['palabras']}</h3>
      <ul class="fichas">
{fichas(c, pre)}
    </ul>
    </section>
    <h3 class="sr-only">The story</h3>
    <div class="cuento">
{cuento(c, pre)}
  </div>
{pausa(c, pre, "h3")}    <h3>Glossary</h3>
    <dl class="glosario">
{glosario(c, pre)}
  </dl>
    <div class="preguntas-cap">
      <h3>Questions</h3>
      <p>Choose the correct answer. If you make a mistake, the story shows you where the answer is.</p>
      <p class="ayuda-es caja-es" lang="es">Elige la respuesta correcta. Si te equivocas, el cuento te muestra dónde está la respuesta.</p>
      <ol class="preguntas">
{preguntas(c, pre)}
  </ol>
      <p class="puntaje" hidden role="status" aria-live="polite"></p>
{reto(c, pre, "h3")}
    </div>
    <p style="font-size:.85rem;color:var(--tinta-suave)">{A['estd']} {e(c['std'])}: {e(c['std_texto'])}</p>
    <p><a class="al-indice cerrar-cap" href="#indice">↑ Close and go back to contents</a></p>
    </div>
  </details>'''

def libro(area, lista):
    A = AREA[area]
    mos = "\n".join(f'        <li><a href="#capitulo-{c["n"]}"><img src="{archivo(c)}.jpg" alt="Chapter {c["n"]}: {ea(c["titulo"])}" loading="lazy"></a></li>' for c in lista)
    ayuda = ("Desde quinto grado los cuentos están en inglés. El botón «Ayuda en español» traduce las consignas, las preguntas, el glosario, "
             + ("las pausas " if area == "sociales" else "") + "y los retos; el cuento queda en inglés para practicar la lectura.")
    guia_link = '\n    <a class="idioma" href="guide-grade6-social-studies.html">Teacher guide</a>' if area == "sociales" else ""
    return f'''<!DOCTYPE html>
<!--
  Educational stories · Book · {A['en']} · Grade 6
  From Grade 5 on, the stories are in English, with optional help in Spanish.
  José M. Fernández · Claude (Anthropic)
  License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
  https://creativecommons.org/licenses/by-nc-sa/4.0/
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{A['en']} · Grade 6 · Educational stories</title>
<meta name="description" content="Online Grade 6 {A['en']} book: {len(lista)} illustrated stories with vocabulary, glossary, comprehension questions and optional help in Spanish.">
<meta name="author" content="José M. Fernández">
<meta name="license" content="CC BY-NC-SA 4.0">
<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap">
<link rel="stylesheet" href="cuentos.css">
</head>
<body>
<a class="salto" href="#indice">Skip to the contents</a>
<main class="hoja">

  <nav class="migas" aria-label="Location">
    <span><a href="index-en.html#grade-6">Educational stories</a> · Grade 6 · {A['en']}</span>
    <a class="idioma" href="index.html#grado-6" lang="es" hreflang="es">Portada en español</a>{guia_link}
  </nav>

  <div class="apoyos" role="group" aria-label="Reading supports">
    <button type="button" id="btn-ayuda" class="btn-ayuda" aria-pressed="false" lang="es"><span aria-hidden="true">🌐 </span>Ayuda en español</button>
    <button type="button" id="btn-menor">A<span aria-hidden="true">−</span><span class="sr-only"> Smaller text</span></button>
    <button type="button" id="btn-mayor">A<span aria-hidden="true">+</span><span class="sr-only"> Bigger text</span></button>
    <button type="button" id="btn-contraste" aria-pressed="false">High contrast</button>
    <button type="button" id="btn-imprimir">Print or save as PDF</button>
  </div>

  <header class="portada-libro">
    <p class="sello">Book · Grade 6</p>
    <h1>{A['en']}</h1>
    <p class="subtitulo">Stories of Israel and his friends</p>
    <p class="base">{A['base']}</p>
    <p class="ayuda-es caja-es" lang="es">{ayuda}</p>
    <nav aria-label="Choose a story">
      <ul class="mosaico">
{mos}
      </ul>
    </nav>
    <p class="pista">Tap a picture or a title to open its story.</p>
    <p class="creditos">José M. Fernández · Development: Claude (Anthropic) · Illustrations generated with artificial intelligence</p>
  </header>

  <h2 id="indice" tabindex="-1">Contents</h2>
  <div class="acordeon">
{chr(10).join(capitulo(c) for c in lista)}

  </div>

  <footer class="pie">
    <p>José M. Fernández · Development: Claude (Anthropic) · Illustrations generated with artificial intelligence.</p>
    <p>Licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="license">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)</a>.</p>
  </footer>
</main>
<script src="cuentos.js"></script>
<script src="https://zhemaria.github.io/primaria/nav-lumi.js" data-grado="6"></script>
</body>
</html>
'''

def indicaciones(area, lista):
    A = AREA[area]
    plantilla = open(os.path.join(RAIZ, "indicaciones-laminas-5to-ciencias.html"), encoding="utf-8").read()
    cabeza = plantilla[:plantilla.index("<main>") + len("<main>")]
    cabeza = cabeza.replace("Láminas de Ciencias de 5.º", f"Láminas de {A['es']} de 6.º").replace("Ciencias de 5.º", f"{A['es']} de 6.º")
    pie = plantilla[plantilla.index("</main>"):]
    secc = []
    for c in lista:
        f = archivo(c)
        secc.append(f'''  <section class="lam" id="lamina-{c['n']}">
    <h2>{c['n']}. {e(c['titulo'])} <small lang="es">({e(c['titulo_es'])})</small></h2>
    <p><strong>Archivo:</strong> <code>{f}.jpg</code> · 1376 × 768 · JPEG<br><strong>Video (opcional):</strong> <code>{f}.mp4</code></p>
    <p class="alt"><strong>Lo que debe verse:</strong> <span lang="en">{e(c['alt'])}</span></p>
    <div class="caja"><p class="ind" id="ind-{c['n']}" lang="en">{e(c['escena'])}, {ESTILO}</p>
    <button type="button" class="copiar" data-de="ind-{c['n']}">Copiar indicación</button></div>
  </section>''')
    idx = "".join(f'<li><a href="#lamina-{c["n"]}">{c["n"]}. {e(c["titulo_es"])}</a></li>' for c in lista)
    cuerpo = f'''
<h1>Láminas de {A['es']} de 6.º grado</h1>
<p>Cada indicación ya trae el estilo de acuarela, el formato 16:9 y la regla de «dos brazos, dos manos, sin letras». Cópiela y péguela en Poe. Guarde la lámina con el nombre de archivo que aparece en cada tarjeta y súbala a la raíz del repositorio <code>cuentos-educativos</code>. Mientras no exista la lámina, el cuento se ve sin ella.</p>
<p>Si hace un video corto con Veo-3.1-Fast, guárdelo con el mismo nombre y extensión <code>.mp4</code>, y avíseme para activar el botón «See the picture move».</p>
<nav aria-label="Láminas"><ul class="indice">{idx}</ul></nav>
''' + "\n".join(secc) + "\n"
    return cabeza + cuerpo + pie

def catalogo(lista):
    """Agrega (o reemplaza) el bloque de 6.º al final de window.CATALOGO, entre dos marcas."""
    ruta = os.path.join(RAIZ, "catalogo.js"); s = open(ruta, encoding="utf-8").read()
    s = re.sub(r",\n  /\* grado 6 \*/[\s\S]*?/\* fin grado 6 \*/", "", s)
    ini = s.index("window.CATALOGO = ["); fin = s.index("\n];", ini)
    entradas = []
    for c in lista:
        f = archivo(c)
        entradas.append(json.dumps({"grado": 6, "area": c["area"], "orden": c["n"], "estandar": c["std"],
                    "es": {"titulo": c["titulo_es"], "archivo": f + ".html", "tema": c["tema_es"]},
                    "en": {"titulo": c["titulo"], "archivo": f + ".html", "tema": c["tema"]},
                    "imagen": f + ".jpg", "escena": c["escena"] + ", " + ESTILO}, ensure_ascii=False, indent=2).replace("\n", "\n  "))
    bloque = ",\n  /* grado 6 */\n  " + ",\n  ".join(entradas) + "\n  /* fin grado 6 */"
    s = s[:fin] + bloque + s[fin:]
    for area, A in AREA.items():
        if any(c["area"] == area for c in lista) and f"grado: 6, area: '{area}'" not in s:
            s = re.sub(r"(window\.LIBROS = \[[\s\S]*?)(\n\];)", lambda m: m.group(1) + f",\n  {{ grado: 6, area: '{area}', es: '{A['libro']}', en: '{A['libro']}' }}" + m.group(2), s, count=1)
    open(ruta, "w", encoding="utf-8").write(s)

if __name__ == "__main__":
    todos = cargar()
    for c in todos:
        open(os.path.join(RAIZ, archivo(c) + ".html"), "w", encoding="utf-8").write(pagina(c))
    for area in AREA:
        lista = sorted([c for c in todos if c["area"] == area], key=lambda c: c["n"])
        if not lista: continue
        open(os.path.join(RAIZ, AREA[area]["libro"]), "w", encoding="utf-8").write(libro(area, lista))
        open(os.path.join(RAIZ, AREA[area]["ind"]), "w", encoding="utf-8").write(indicaciones(area, lista))
    catalogo(todos)
    print(len(todos), "cuentos")
