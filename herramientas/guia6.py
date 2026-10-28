"""
Guía docente de Estudios Sociales de 6.º (guide-grade6-social-studies.html).
Toma la cabecera y el pie de la guía de 5.º y los datos de cada cuento de historias6/sociales_*.py.
Uso: python3 herramientas/guia6.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen6 import cargar, archivo, e, ea, RAIZ

ARTE = "VA:Cn11.1.6: analyze how art reflects changing times, traditions, resources and cultural uses."

GUIA = {
 1: dict(tema="Primary and secondary sources",
   tit="Class time capsule",
   act="Each group brings or draws three objects for a class time capsule and writes a museum label for each one. On the back of each label, the group writes whether the object is a primary or a secondary source and one thing a future historian could NOT learn from it. Seal the labels in a box to open at the end of the year.",
   disc="Who made this source, when and why? Why might two people from the same year describe it in different ways?"),
 2: dict(tema="Rivers, irrigation and the first cities",
   tit="Clay records · A peace panel",
   act="Give each group a ball of clay or play dough and a craft stick. Students press simple marks to keep a record of \"goods\" in the classroom (pencils, books, chairs), as early scribes kept records of grain and animals. Then groups draw a long strip in three rows, like the peace side of the Standard of Ur, showing the goods and jobs of their own neighborhood.",
   disc="How did the environment decide where people settled? Which changes to the rivers helped people, and which caused new problems?"),
 3: dict(tema="Change and continuity along the Nile",
   tit="Then-and-now diptych",
   act="Each student folds a paper in half. On the left, they draw a scene from ancient Egypt from the story (the flood, a shaduf, a boat on the Nile). On the right, they draw the same place or activity today. The class hangs the drawings and sorts them into \"mostly change\" and \"mostly continuity.\"",
   disc="What changed along the Nile, and what stayed the same? Why do some things last for thousands of years?"),
 4: dict(tema="Democracy in Athens and today",
   tit="Assembly vote · Design a class coin",
   act="Hold a direct vote on a real class choice. Then repeat it, but this time only students born in the first half of the year may vote. Discuss how the excluded students felt, and connect it to who could vote in Athens. Finally, groups design a class coin with one symbol on each side, like the owl and Athena, and explain what the symbols say about the class.",
   disc="How was Athens a democracy, and how was it not? How have ideas about who can vote changed over time?"),
 5: dict(tema="The Twelve Tables and written laws",
   tit="Our twelve tables · Arch challenge",
   act="The class writes and votes on twelve short rules, posts them on the wall and signs them. As an extension, groups build an arch and a flat bridge of the same width out of paper or cardboard, then test which one holds more coins, to see why Roman builders used arches in aqueducts like the Pont du Gard.",
   disc="Why did the plebeians want the laws written down? Can a written law still be unfair?"),
 6: dict(tema="Trade and ideas on the Silk Road",
   tit="Silk Road trading game",
   act="Line up desks as cities, as in the story. Pass a \"good\" (a scarf or a card) and raise its price at each city, then pass a whispered sentence and compare the first and last versions. Students mark the routes on a map and add one good and one idea that traveled in each direction.",
   disc="How did transportation help goods and ideas spread? Why did ideas change as they traveled? What carries ideas around the world today?"),
 7: dict(tema="Paper, printing and innovation",
   tit="Stamp print shop",
   act="Groups carve a simple design into a foam sheet or a potato (with adult help) and print cards with paint or ink. Time how many cards one student makes by hand and how many one student prints in the same three minutes, then make a bar graph to show the change in productivity.",
   disc="How did paper and printing change people's work and learning? Who might lose work when a new invention arrives, and how can they adapt?"),
 8: dict(tema="Gold, salt and the Mali Empire",
   tit="Illustrated trade map",
   act="Groups make an illustrated map of West Africa and the Sahara in the style of the Catalan Atlas: mark where salt and gold came from, draw a camel caravan along the route and add Timbuktu. Then each group adds one picture showing a resource from Illinois and where it is traded today.",
   disc="Why did the north and the south need each other? How did controlling trade routes make Mali rich?"),
 9: dict(tema="Tenochtitlan and Mexico City",
   tit="Chinampa model · Cause or correlation?",
   act="In a shallow tray of water, groups build a small chinampa with layers of soil and twigs or sticks at the corners, and test whether it holds together. Then groups list pairs of things that happen together (summer and ice cream sales, more swimmers) and sort them into \"one causes the other\" and \"only a correlation.\"",
   disc="How did the Mexica adapt to the lake? Why is Mexico City sinking today? How can we tell a cause from a correlation?"),
 10: dict(tema="Supply, demand and prices",
   tit="Classroom market · Find the jobs",
   act="Run a short market with paper goods: change the number of goods (supply) or the number of buyers (demand) in each round, and record the prices on a chart. Then project The Harvesters and have pairs list every job they can find in the painting and where the wheat might go next.",
   disc="What happens to prices when there is a shortage or a surplus? Is it fair to raise prices when people really need something?"),
 11: dict(tema="Citizenship, rights and responsibilities",
   tit="Rights and responsibilities posters · A class action",
   act="Groups make a poster with two columns, rights and responsibilities, using pictures and a few words. Then the class chooses one small action to help the school or neighborhood (a cleanup, a letter to the alderperson, a book drive) and names the right it uses and the responsibility it meets. Important: do not ask students about their own or their families' citizenship or immigration status. Keep the discussion general and focused on the ideas.",
   disc="What rights belong to everyone who lives in the United States, and which belong only to citizens? How can young people practice good citizenship before they can vote?"),
 12: dict(tema="Review of the whole year",
   tit="Museum night",
   act="Each student or group prepares an exhibit about one big idea of the year, with a central claim, two pieces of evidence, one artifact (a real object, a copy or a drawing) with a museum label and one connection to today. Invite families to visit, as in the story.",
   disc="What connections do you see between the ancient world and your life? Whose perspectives did you include in your exhibit?"),
}

def guia(lista):
    plantilla = open(os.path.join(RAIZ, "guide-grade5-social-studies.html"), encoding="utf-8").read()
    cab = plantilla[:plantilla.index('  <h2 id="indice"')]
    pie = plantilla[plantilla.index('  <footer class="pie">'):]
    cab = (cab.replace("Grade 5", "Grade 6").replace("grade-5", "grade-6").replace("book-grade5-social-studies.html", "book-grade6-social-studies.html")
              .replace("Teacher guide for the Grade 5 Social Studies stories", "Teacher guide for the Grade 6 Social Studies stories"))
    cab = cab.replace("look at a picture from the time, read verses from a public domain song or poem, or listen to a rhythm",
                      "look at a work of art from the time or read lines from a public domain poem")
    cab = cab.replace("  </section>\n", "    <p>In Grade 6, the Illinois standards for history and civics describe two levels of complexity. Each story's challenge works at the grade level (LC). The optional <strong>Go further</strong> question asks for more complex reasoning (MdC), for students who are ready for it.</p>\n  </section>\n", 1)
    caps = []
    for c in lista:
        g = GUIA[c["n"]]; p = c.get("pausa", {})
        reto_std = c["std"].split(" · ")[0]
        if c["n"] == 12:
            std = ("This story reviews the Grade 6 standards in history, geography, civics and economics (SS.6-8.H · SS.6-8.G · SS.6-8.CV · SS.6-8.EC).")
        else:
            std = f"The story introduces {c['std']}: {c['std_texto']} The challenge lets students show {reto_std}; the optional “Go further” question invites deeper analysis."
        caps.append(f'''  <details class="capitulo" id="capitulo-{c['n']}" name="libro">
    <summary><span class="num" aria-hidden="true">{c['n']}</span><span class="cab"><h2><span class="titulo-cap">{e(c['titulo'])}</span></h2><small>{e(g['tema'])} · {e(c['std'])}</small></span></summary>
    <div class="cuerpo-cap">
      <p><a class="al-indice" href="{archivo(c)}.html">Open the story</a></p>
      <h3>Group activity: {e(g['tit'])}</h3>
      <p class="pausa-arte">VA:Cn11.1.6</p>
      <p>{e(g['act'])}</p>
      <h3>Discussion questions</h3>
      <p>{e(g['disc'])}</p>
      <h3>Pause to connect (done alone in the story)</h3>
      <p>{e(p.get('intro', ''))}</p>
      <p style="font-size:.85rem;color:var(--tinta-suave)">Illinois Learning Standards for Social Science (revised; in effect since the 2022–2023 school year). {e(std)} Arts connection (Illinois Arts Learning Standards, Anchor Standard 11, Connecting): {ARTE}</p>
      <p><a class="al-indice cerrar-cap" href="#indice">↑ Close and go back to contents</a></p>
    </div>
  </details>''')
    return cab + '  <h2 id="indice" tabindex="-1">Activities by story</h2>\n  <div class="acordeon">\n' + "\n".join(caps) + "\n  </div>\n" + pie

if __name__ == "__main__":
    lista = sorted([c for c in cargar() if c["area"] == "sociales"], key=lambda c: c["n"])
    open(os.path.join(RAIZ, "guide-grade6-social-studies.html"), "w", encoding="utf-8").write(guia(lista))
    print("guía:", len(lista), "cuentos")
