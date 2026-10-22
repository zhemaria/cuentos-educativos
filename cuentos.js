/* ==================================================================
   Cuentos educativos · Lógica común de cada cuento
   José M. Fernández · Licencia CC BY-NC-SA 4.0
   https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es

   Cada cuento solo contiene texto y marcas:
     · <button class="voz" data-g="polen">  palabra de ciencia
     · <div id="g-polen"> dentro de <dl class="glosario">  su definición
     · <span class="cita" id="c-a">  parte del texto que responde una pregunta
     · <li class="pregunta" data-cita="c-a" data-correcta="1">  pregunta
   Este archivo añade todo el comportamiento.
   ================================================================== */
(function(){
  'use strict';

  var LANG = (document.documentElement.lang || 'es').slice(0,2);

  var T = {
    es:{
      escuchar:'Escuchar el cuento', detener:'Detener la lectura',
      oir:'Escuchar', glosario:'Ver en el glosario', cerrar:'Cerrar',
      bien:'¡Correcto!', mal:'Todavía no. Vuelve a leer la parte marcada e inténtalo otra vez.',
      verTexto:'Ver en el texto', volver:'Volver a la pregunta ',
      tamano:'Tamaño del texto: ', porciento:' por ciento',
      puntaje:function(a,t){ return 'Respondiste bien ' + a + ' de ' + t + ' preguntas al primer intento.'; },
      sinLamina:'La ilustración llegará pronto.',
      correcta:'Respuesta correcta', incorrecta:'Respuesta incorrecta'
    },
    en:{
      escuchar:'Listen to the story', detener:'Stop reading',
      oir:'Listen', glosario:'See it in the glossary', cerrar:'Close',
      bien:'Correct!', mal:'Not yet. Read the highlighted part again and try once more.',
      verTexto:'Show me in the story', volver:'Back to question ',
      tamano:'Text size: ', porciento:' percent',
      puntaje:function(a,t){ return 'You got ' + a + ' out of ' + t + ' questions right on the first try.'; },
      sinLamina:'The illustration is coming soon.',
      correcta:'Correct answer', incorrecta:'Wrong answer'
    }
  }[LANG === 'en' ? 'en' : 'es'];

  function $(id){ return document.getElementById(id); }
  function todos(sel, raiz){ return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  var menosMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function irA(el){
    el.scrollIntoView({behavior: menosMovimiento ? 'auto' : 'smooth', block:'center'});
  }
  function guardar(k, v){ try{ localStorage.setItem('cuentos-' + k, v); }catch(e){} }
  function leer(k){ try{ return localStorage.getItem('cuentos-' + k); }catch(e){ return null; } }

  /* Aviso para lectores de pantalla (dentro de la página, nunca alert) */
  var aviso = document.createElement('p');
  aviso.className = 'sr-only';
  aviso.setAttribute('role','status');
  aviso.setAttribute('aria-live','polite');
  document.body.appendChild(aviso);
  function anunciar(t){ aviso.textContent = ''; setTimeout(function(){ aviso.textContent = t; }, 50); }

  /* ---------------------------------------------------------------
     1. LECTURA EN VOZ ALTA
     --------------------------------------------------------------- */
  var hayVoz = 'speechSynthesis' in window;
  var voces = [];
  function cargarVoces(){ if(hayVoz) voces = speechSynthesis.getVoices(); }
  if(hayVoz){ cargarVoces(); speechSynthesis.onvoiceschanged = cargarVoces; }

  function elegirVoz(){
    var pref = LANG === 'en' ? ['en-US','en-GB','en'] : ['es-US','es-MX','es-419','es-ES','es'];
    for(var i=0;i<pref.length;i++){
      for(var j=0;j<voces.length;j++){
        if(voces[j].lang && voces[j].lang.replace('_','-').indexOf(pref[i]) === 0) return voces[j];
      }
    }
    return null;
  }
  /* Algunos navegadores cortan las lecturas largas. Por eso el texto se
     divide en frases y se lee una tras otra. */
  var turno = 0;
  function enFrases(texto){
    var t = String(texto).replace(/\s+/g,' ').trim();
    var frases = t.match(/[^.!?…]+[.!?…]+["»”')]*\s*|[^.!?…]+$/g) || [t];
    return frases.map(function(f){ return f.trim(); }).filter(Boolean);
  }
  function decir(texto, alTerminar){
    if(!hayVoz) return;
    speechSynthesis.cancel();
    var miTurno = ++turno;
    var frases = enFrases(texto);
    var v = elegirVoz();
    var i = 0;
    function siguiente(){
      if(miTurno !== turno) return;          // se detuvo o empezó otra lectura
      if(i >= frases.length){ if(alTerminar) alTerminar(); return; }
      var u = new SpeechSynthesisUtterance(frases[i++]);
      if(v) u.voice = v;
      u.lang = v ? v.lang : (LANG === 'en' ? 'en-US' : 'es-US');
      u.rate = 0.9;
      u.onend = siguiente;
      u.onerror = function(e){
        if(e.error === 'interrupted' || e.error === 'canceled') return;
        siguiente();
      };
      speechSynthesis.speak(u);
    }
    // Pequeña pausa tras cancel(): Chrome a veces descarta lo que se pide enseguida.
    setTimeout(siguiente, 120);
  }
  function callar(){ turno++; if(hayVoz) speechSynthesis.cancel(); }
  var leyendoCuento = false;

  /* Botón de lectura: #btn-voz en un cuento suelto, o un .voz-capitulo
     por capítulo en el libro (data-capitulo="N" señala #capitulo-N). */
  var btnVoz = null;   // el botón que está leyendo ahora
  var botonesVoz = todos('#btn-voz, .voz-capitulo');
  botonesVoz.forEach(function(b){
    b.textContent = T.escuchar;
    b.disabled = !hayVoz;
    b.setAttribute('aria-pressed','false');
    b.addEventListener('click', function(){
      var eraEste = leyendoCuento && btnVoz === b;
      if(leyendoCuento){ callar(); botonCuentoEnReposo(); }
      if(eraEste) return;
      var cap = b.getAttribute('data-capitulo');
      var ambito = cap ? $('capitulo-' + cap) : document;
      var titulo = cap ? (ambito.querySelector('.titulo-cap') || ambito.querySelector('h2')) : $('titulo');
      // El título va primero, con punto final para que la voz haga la pausa.
      var partes = [titulo.textContent.trim() + '.'];
      todos('.cuento p', ambito).forEach(function(p){ partes.push(p.textContent); });
      btnVoz = b;
      decir(partes.join(' '), botonCuentoEnReposo);
      leyendoCuento = true;
      b.textContent = T.detener;
      b.setAttribute('aria-pressed','true');
    });
  });
  function botonCuentoEnReposo(){
    leyendoCuento = false;
    if(!btnVoz) return;
    btnVoz.textContent = T.escuchar;
    btnVoz.setAttribute('aria-pressed','false');
    btnVoz = null;
  }
  // Cualquier otra lectura (una palabra, una pregunta) detiene la del cuento.
  function decirSuelto(texto){ botonCuentoEnReposo(); decir(texto); }

  /* ---------------------------------------------------------------
     2. TAMAÑO DE LETRA Y CONTRASTE
     --------------------------------------------------------------- */
  var escala = parseFloat(leer('escala')) || 1;
  function aplicarEscala(delta, avisar){
    escala = Math.min(1.6, Math.max(0.85, Math.round((escala + delta)*100)/100));
    document.documentElement.style.setProperty('--escala', escala);
    guardar('escala', escala);
    if(avisar) anunciar(T.tamano + Math.round(escala*100) + T.porciento);
  }
  aplicarEscala(0, false);
  if($('btn-mayor')) $('btn-mayor').addEventListener('click', function(){ aplicarEscala(0.1, true); });
  if($('btn-menor')) $('btn-menor').addEventListener('click', function(){ aplicarEscala(-0.1, true); });

  var btnContraste = $('btn-contraste');
  function ponerContraste(si){
    document.body.classList.toggle('contraste-alto', si);
    if(btnContraste) btnContraste.setAttribute('aria-pressed', si ? 'true' : 'false');
    guardar('contraste', si ? '1' : '0');
  }
  ponerContraste(leer('contraste') === '1');
  if(btnContraste) btnContraste.addEventListener('click', function(){
    ponerContraste(!document.body.classList.contains('contraste-alto'));
  });
  if($('btn-imprimir')) $('btn-imprimir').addEventListener('click', function(){ window.print(); });

  /* ---------------------------------------------------------------
     3. ILUSTRACIÓN AUSENTE
     --------------------------------------------------------------- */
  todos('.lamina img').forEach(function(img){
    var sinImagen = function(){
      var d = document.createElement('div');
      d.className = 'vacia';
      d.textContent = T.sinLamina;
      if(img.parentNode) img.parentNode.replaceChild(d, img);
    };
    if(img.complete && img.naturalWidth === 0) sinImagen();
    else img.addEventListener('error', sinImagen);
  });
  // En el mosaico del libro, una lámina que falta deja solo el recuadro de color.
  todos('.mosaico img').forEach(function(img){
    var ocultar = function(){ img.style.visibility = 'hidden'; };
    if(img.complete && img.naturalWidth === 0) ocultar();
    else img.addEventListener('error', ocultar);
  });

  /* ---------------------------------------------------------------
     4. PALABRAS DE CIENCIA: panel con la definición
     --------------------------------------------------------------- */
  var panel = document.createElement('div');
  panel.className = 'panel';
  panel.hidden = true;
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-labelledby','panel-titulo');
  panel.innerHTML =
    '<div class="dentro">' +
      '<h3 id="panel-titulo"></h3><p id="panel-def"></p>' +
      '<div class="botones">' +
        '<button type="button" id="panel-oir"><span aria-hidden="true">🔊&nbsp;</span>' + T.oir + '</button>' +
        '<a id="panel-ir" href="#glosario">' + T.glosario + '</a>' +
        '<button type="button" class="cerrar" id="panel-cerrar">' + T.cerrar + '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);
  var origenPanel = null;

  function abrirPanel(boton){
    var clave = boton.getAttribute('data-g');
    var caja = $('g-' + clave);
    if(!caja) return;
    $('panel-titulo').textContent = caja.querySelector('dt').textContent;
    $('panel-def').textContent = caja.querySelector('dd').textContent;
    $('panel-ir').setAttribute('href', '#g-' + clave);
    todos('.voz[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
    boton.setAttribute('aria-expanded','true');
    origenPanel = boton;
    panel.hidden = false;
    $('panel-cerrar').focus();
  }
  function cerrarPanel(){
    if(panel.hidden) return;
    panel.hidden = true;
    if(!leyendoCuento) callar();
    if(origenPanel){ origenPanel.setAttribute('aria-expanded','false'); origenPanel.focus(); }
  }
  todos('.voz').forEach(function(b){
    b.setAttribute('aria-expanded','false');
    b.setAttribute('aria-haspopup','dialog');
    b.addEventListener('click', function(){ abrirPanel(b); });
  });
  $('panel-cerrar').addEventListener('click', cerrarPanel);
  $('panel-ir').addEventListener('click', function(){ panel.hidden = true; });
  $('panel-oir').addEventListener('click', function(){
    decirSuelto($('panel-titulo').textContent + '. ' + $('panel-def').textContent);
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cerrarPanel(); });

  /* ---------------------------------------------------------------
     5. PREGUNTAS CON RETROALIMENTACIÓN INMEDIATA
     --------------------------------------------------------------- */
  var volver = document.createElement('button');
  volver.type = 'button';
  volver.className = 'volver';
  volver.hidden = true;
  document.body.appendChild(volver);
  var preguntaActiva = null;

  function quitarResaltado(){ todos('.cita.resaltada').forEach(function(c){ c.classList.remove('resaltada'); }); }

  function mostrarEnTexto(pregunta){
    var cita = $(pregunta.getAttribute('data-cita'));
    if(!cita) return;
    quitarResaltado();
    cita.classList.add('resaltada');
    cita.setAttribute('tabindex','-1');
    irA(cita);
    cita.focus({preventScroll:true});
    preguntaActiva = pregunta;
    volver.textContent = '↩ ' + T.volver + pregunta.querySelector('.letra').textContent;
    volver.hidden = false;
  }
  volver.addEventListener('click', function(){
    if(!preguntaActiva) return;
    volver.hidden = true;
    irA(preguntaActiva);
    var foco = preguntaActiva.querySelector('.opcion:not(:disabled)') || preguntaActiva.querySelector('.ver-texto');
    if(foco) foco.focus({preventScroll:true});
  });

  var preguntas = todos('.pregunta');
  /* El puntaje se lleva por grupo: la página entera en un cuento suelto,
     o cada capítulo (elemento con data-capitulo) en el libro. */
  var grupos = [];
  function grupoDe(q){
    var raiz = q.closest('[data-capitulo]') || document.body;
    for(var i=0;i<grupos.length;i++) if(grupos[i].raiz === raiz) return grupos[i];
    var g = {raiz:raiz, total:0, primer:0, hechas:0};
    grupos.push(g);
    return g;
  }
  preguntas.forEach(function(q){ grupoDe(q).total++; });

  preguntas.forEach(function(q){
    var grupo = grupoDe(q);
    var correcta = parseInt(q.getAttribute('data-correcta'), 10);
    var opciones = todos('.opcion', q);
    var explicacion = q.querySelector('.explicacion');
    var intentos = 0;

    var resp = document.createElement('div');
    resp.className = 'respuesta';
    resp.hidden = true;
    resp.setAttribute('role','status');
    resp.setAttribute('aria-live','polite');
    q.appendChild(resp);

    var ver = document.createElement('button');
    ver.type = 'button';
    ver.className = 'ver-texto';
    ver.innerHTML = '<span aria-hidden="true">🔎&nbsp;</span>' + T.verTexto;
    ver.hidden = true;
    ver.addEventListener('click', function(){ mostrarEnTexto(q); });
    q.appendChild(ver);

    opciones.forEach(function(op, i){
      op.type = 'button';
      op.addEventListener('click', function(){
        intentos++;
        ver.hidden = false;
        resp.hidden = false;
        if(i === correcta){
          opciones.forEach(function(o){ o.disabled = true; });
          op.classList.add('acierto');
          op.insertAdjacentHTML('afterbegin', '<span class="marca" aria-hidden="true">✓</span>');
          op.setAttribute('aria-label', T.correcta + ': ' + op.textContent.replace('✓',''));
          resp.className = 'respuesta bien';
          resp.innerHTML = '<strong>' + T.bien + '</strong>';
          if(explicacion) resp.appendChild(document.createTextNode(explicacion.textContent));
          if(intentos === 1) grupo.primer++;
          grupo.hechas++;
          if(grupo.hechas === grupo.total) mostrarPuntaje(grupo);
        }else{
          op.disabled = true;
          op.classList.add('fallo');
          op.insertAdjacentHTML('afterbegin', '<span class="marca" aria-hidden="true">✗</span>');
          op.setAttribute('aria-label', T.incorrecta + ': ' + op.textContent.replace('✗',''));
          resp.className = 'respuesta mal';
          resp.innerHTML = '<strong>' + T.mal + '</strong>';
          // La retroalimentación muestra de inmediato dónde está la respuesta.
          var cita = $(q.getAttribute('data-cita'));
          if(cita){ quitarResaltado(); cita.classList.add('resaltada'); }
        }
      });
    });

    // Botón para escuchar la pregunta y sus opciones.
    var oir = q.querySelector('.oir-pregunta');
    if(!oir && hayVoz){
      oir = document.createElement('button');
      oir.type = 'button';
      oir.className = 'oir-pregunta';
      oir.innerHTML = '<span aria-hidden="true">🔊</span><span class="sr-only">' + T.oir + '</span>';
      q.querySelector('.enunciado').appendChild(oir);
    }
    if(oir){
      oir.disabled = !hayVoz;
      oir.addEventListener('click', function(){
        var t = q.querySelector('.texto-enunciado').textContent + '. ' +
                opciones.map(function(o){ return o.textContent; }).join('. ');
        decirSuelto(t);
      });
    }
  });

  function mostrarPuntaje(g){
    var p = g.raiz.querySelector('.puntaje');
    if(!p) return;
    p.textContent = T.puntaje(g.primer, g.total);
    p.hidden = false;
  }

  /* ---------------------------------------------------------------
     6. LIBRO EN ACORDEÓN
     Cada capítulo es un <details>. Se abre uno a la vez; los enlaces
     a #capitulo-N (mosaico) lo abren; al imprimir se abren todos.
     --------------------------------------------------------------- */
  var capitulos = todos('details.capitulo');
  var imprimiendo = false;
  if(capitulos.length){
    var abrir = function(d, enfocar){
      if(!d) return;
      d.open = true;
      var s = d.querySelector('summary');
      s.scrollIntoView({behavior: menosMovimiento ? 'auto' : 'smooth', block:'start'});
      if(enfocar) s.focus({preventScroll:true});
    };
    capitulos.forEach(function(d){
      d.addEventListener('toggle', function(){
        if(imprimiendo) return;
        if(d.open){
          // Un solo capítulo abierto (por si el navegador no admite name="").
          capitulos.forEach(function(o){ if(o !== d && o.open) o.open = false; });
        }else if(btnVoz && d.contains(btnVoz)){
          callar(); botonCuentoEnReposo();
        }
      });
    });
    // Enlaces del mosaico (y cualquier otro) hacia un capítulo.
    todos('a[href^="#capitulo-"]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        abrir(document.querySelector(a.getAttribute('href')), true);
      });
    });
    // «Cerrar y volver al índice».
    todos('.cerrar-cap').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        var d = a.closest('details');
        if(d) d.open = false;
        var s = d ? d.querySelector('summary') : $('indice');
        irA(s);
        s.focus({preventScroll:true});
      });
    });
    // Si la dirección trae un ancla (#capitulo-3 o algo dentro de un capítulo), se abre.
    var abrirPorAncla = function(){
      if(!location.hash) return;
      var destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var d = destino && destino.closest('details.capitulo');
      if(d){ d.open = true; setTimeout(function(){ irA(destino === d ? d.querySelector('summary') : destino); }, 50); }
    };
    abrirPorAncla();
    window.addEventListener('hashchange', abrirPorAncla);
    // Imprimir: abrir todos y después dejarlos como estaban.
    var estadoAntes = null;
    window.addEventListener('beforeprint', function(){
      imprimiendo = true;
      estadoAntes = capitulos.map(function(d){ return d.open; });
      capitulos.forEach(function(d){ d.removeAttribute('name'); d.open = true; });
    });
    window.addEventListener('afterprint', function(){
      if(!estadoAntes) return;
      capitulos.forEach(function(d, i){ d.open = estadoAntes[i]; d.setAttribute('name','libro'); });
      setTimeout(function(){ imprimiendo = false; }, 100);
    });
  }
})();
