/* ==================================================================
   Cuentos educativos · Kindergarten
   Lectura en voz alta frase por frase, palabras con dibujo y preguntas
   que se contestan tocando un dibujo. No guarda datos del niño.
   Sirve para un cuento suelto y para el libro: cada cuento (o cada capítulo
   del libro) es un «ámbito» independiente, con su botón de escuchar, sus
   preguntas y sus estrellas.
   José M. Fernández · Desarrollo: Claude (Anthropic) · Licencia CC BY-NC-SA 4.0
   ================================================================== */
(function(){
  'use strict';
  var L = (document.documentElement.lang || 'es').slice(0,2);
  var T = {
    es:{ bien:['¡Muy bien!','¡Eso es!','¡Excelente!'], otra:'Casi. Escucha esta parte del cuento:',
         pronto:'La lámina de este cuento llegará pronto.', y:' o ',
         final:function(n){ return n === 3 ? '¡Contestaste las tres preguntas al primer intento!' :
           n === 0 ? '¡Contestaste las tres preguntas! La próxima vez, escucha el cuento otra vez antes de empezar.' :
           'Contestaste ' + ['','una','dos'][n] + ' de tres preguntas al primer intento. ¡Muy bien!'; } },
    en:{ bien:['Great job!','That\'s it!','Excellent!'], otra:'Almost. Listen to this part of the story:',
         pronto:'The picture for this story is coming soon.', y:', or ',
         final:function(n){ return n === 3 ? 'You answered all three questions on the first try!' :
           n === 0 ? 'You answered all three questions! Next time, listen to the story again before you start.' :
           'You answered ' + ['','one','two'][n] + ' of three questions on the first try. Good work!'; } }
  }[L];
  if(!T) return;

  function $(id){ return document.getElementById(id); }
  function todos(sel, raiz){ return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function elegir(a){ return a[Math.floor(Math.random() * a.length)]; }
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function anunciar(t){ var a = $('k-aviso'); if(!a) return; a.textContent = ''; setTimeout(function(){ a.textContent = t; }, 50); }

  /* ---------- Voz (una sola para toda la página) ---------- */
  var hayVoz = 'speechSynthesis' in window, voces = [], turno = 0, alCallar = null;
  function cargarVoces(){ if(hayVoz) voces = speechSynthesis.getVoices(); }
  if(hayVoz){ cargarVoces(); speechSynthesis.onvoiceschanged = cargarVoces; }
  function voz(){
    var propias = voces.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(L) === 0; });
    return propias.filter(function(v){ return /US|MX|419/i.test(v.lang); })[0] || propias[0] || null;
  }
  /* Dice varios textos seguidos; antes de cada uno llama a alEmpezar(i).
     Si otro ámbito empieza a hablar, el anterior se limpia con alCallar. */
  function decir(textos, alEmpezar, alTerminar, limpiar){
    if(alCallar){ var f = alCallar; alCallar = null; f(); }
    alCallar = limpiar || null;
    if(!hayVoz){ if(alTerminar) alTerminar(); return; }
    var mio = ++turno, i = 0;
    speechSynthesis.cancel();
    function siguiente(){
      if(mio !== turno) return;
      if(i >= textos.length){ alCallar = null; if(alTerminar) alTerminar(); return; }
      if(alEmpezar) alEmpezar(i);
      var u = new SpeechSynthesisUtterance(textos[i]);
      u.lang = L === 'es' ? 'es-US' : 'en-US';
      var v = voz(); if(v) u.voice = v;
      u.rate = 0.85; u.pitch = 1.05;
      u.onend = function(){ i++; siguiente(); };
      u.onerror = function(){ i++; siguiente(); };
      speechSynthesis.speak(u);
    }
    siguiente();
  }
  function callar(){ turno++; if(hayVoz) speechSynthesis.cancel(); if(alCallar){ var f = alCallar; alCallar = null; f(); } }
  window.kCallar = callar;   // el libro la usa al cerrar un capítulo

  /* ---------- Un ámbito: un cuento o un capítulo ---------- */
  function iniciar(raiz, titulo){
    var frases = todos('.k-cuento .frase', raiz);
    var bEscuchar = raiz.querySelector('.k-escuchar'), bParar = raiz.querySelector('.k-parar');
    function quitarLectura(){ frases.forEach(function(f){ f.classList.remove('leyendo'); }); }
    function marcarFrase(f){
      quitarLectura(); if(!f) return;
      f.classList.add('leyendo');
      f.scrollIntoView({block:'center', behavior: quieto ? 'auto' : 'smooth'});
    }
    function reposo(){ quitarLectura(); if(bParar) bParar.hidden = true; if(bEscuchar) bEscuchar.hidden = false; }

    if(bEscuchar) bEscuchar.addEventListener('click', function(){
      var tit = titulo ? titulo.textContent.trim() + '.' : '';
      var textos = [tit].concat(frases.map(function(f){ return f.querySelector('.k-texto').textContent; }));
      bEscuchar.hidden = true; if(bParar){ bParar.hidden = false; bParar.focus(); }
      decir(textos, function(i){ marcarFrase(i === 0 ? null : frases[i-1]); },
            function(){ reposo(); if(bEscuchar) bEscuchar.focus(); }, reposo);
    });
    if(bParar) bParar.addEventListener('click', function(){ callar(); if(bEscuchar) bEscuchar.focus(); });

    frases.forEach(function(f){
      f.querySelector('.k-oir').addEventListener('click', function(){
        decir([f.querySelector('.k-texto').textContent], function(){ reposo(); marcarFrase(f); }, quitarLectura, reposo);
      });
    });

    /* Palabras nuevas */
    var palabras = todos('.k-palabra', raiz);
    palabras.forEach(function(b){
      b.addEventListener('click', function(){
        var def = b.parentNode.querySelector('.k-def');
        var abierta = b.getAttribute('aria-expanded') === 'true';
        palabras.forEach(function(x){ x.setAttribute('aria-expanded','false'); x.parentNode.querySelector('.k-def').hidden = true; });
        if(abierta){ callar(); return; }
        b.setAttribute('aria-expanded','true'); def.hidden = false;
        decir([b.querySelector('.k-termino').textContent + '.', def.textContent], null, null, reposo);
      });
    });

    /* Preguntas */
    var preguntas = todos('.k-pregunta', raiz), contestadas = 0, alPrimero = 0;
    function quitarResaltado(){ todos('.cita.resaltada', raiz).forEach(function(c){ c.classList.remove('resaltada'); }); }
    preguntas.forEach(function(q){
      var correcta = +q.getAttribute('data-correcta');
      var opciones = todos('.k-opcion', q), fallo = false, hecha = false;
      q.querySelector('.k-oir').addEventListener('click', function(){
        var ops = todos('.k-etiqueta', q).map(function(o){ return o.textContent; });
        decir([q.querySelector('.k-enunciado .k-texto').textContent, ops.slice(0,-1).join(', ') + T.y + ops[ops.length-1] + '?'], null, null, reposo);
      });
      opciones.forEach(function(op, i){
        op.addEventListener('click', function(){
          if(hecha) return;
          if(i === correcta){
            hecha = true; contestadas++; if(!fallo) alPrimero++;
            op.classList.remove('mal'); op.classList.add('bien');
            opciones.forEach(function(o){ o.disabled = true; o.setAttribute('aria-disabled','true'); });
            q.querySelector('.k-pista').hidden = true; quitarResaltado();
            var exp = q.querySelector('.k-explicacion'); exp.hidden = false;
            var frase = elegir(T.bien);
            decir([frase, exp.textContent], null, null, reposo); anunciar(frase + ' ' + exp.textContent);
            if(contestadas === preguntas.length){
              var est = raiz.querySelector('.k-estrellas');
              if(est){
                est.innerHTML = '<span class="k-fila" aria-hidden="true">' + '⭐'.repeat(alPrimero) + '☆'.repeat(preguntas.length - alPrimero) + '</span>' + T.final(alPrimero);
                est.hidden = false;
                setTimeout(function(){ decir([T.final(alPrimero)], null, null, reposo); }, 2600);
              }
            }
          } else {
            fallo = true;
            op.classList.remove('mal'); void op.offsetWidth; op.classList.add('mal');
            var cita = raiz.querySelector('#' + q.getAttribute('data-cita'));
            var pista = q.querySelector('.k-pista');
            var txt = cita ? cita.textContent : '';
            pista.textContent = T.otra + ' «' + txt + '»';
            pista.hidden = false;
            quitarResaltado(); if(cita) cita.classList.add('resaltada');
            decir([T.otra, txt], null, null, reposo); anunciar(pista.textContent);
          }
        });
      });
    });

    /* Lámina en movimiento (opcional): nunca arranca sola */
    var bVideo = raiz.querySelector('.k-video'), fig = raiz.querySelector('.lamina[data-video]');
    if(bVideo && fig) bVideo.addEventListener('click', function(){
      callar();
      var img = fig.querySelector('img');
      var v = document.createElement('video');
      v.src = fig.getAttribute('data-video');
      v.controls = true; v.playsInline = true; v.setAttribute('playsinline', '');
      if(img){ v.poster = img.src; v.setAttribute('aria-label', img.alt); }
      v.style.display = 'block'; v.style.width = '100%'; v.style.height = 'auto';
      fig.innerHTML = ''; fig.appendChild(v);
      bVideo.parentNode.hidden = true;
      var p = v.play(); if(p && p.catch) p.catch(function(){});
      v.focus();
    });
  }

  /* ---------- Láminas que todavía no están ---------- */
  todos('.lamina img').forEach(function(img){
    function pronto(){ img.parentNode.innerHTML = '<div class="k-pronto"><div><span aria-hidden="true">🎨</span>' + T.pronto + '</div></div>'; }
    if(img.complete && img.naturalWidth === 0) pronto(); else img.addEventListener('error', pronto);
  });
  todos('.mosaico img').forEach(function(img){
    function ocultar(){ img.style.visibility = 'hidden'; }
    if(img.complete && img.naturalWidth === 0) ocultar(); else img.addEventListener('error', ocultar);
  });
  /* ---------- Imprimir o guardar en PDF: se abren todos los capítulos y se cargan todas las láminas ---------- */
  var imprimiendo = false, estadoAntes = null;
  function prepararImpresion(){
    if(imprimiendo) return;
    imprimiendo = true;
    var caps = todos('details.capitulo');
    estadoAntes = caps.map(function(d){ return d.open; });
    caps.forEach(function(d){ d.removeAttribute('name'); d.open = true; });
    todos('img[loading="lazy"]').forEach(function(img){ img.loading = 'eager'; });
  }
  function terminarImpresion(){
    if(!imprimiendo) return;
    var caps = todos('details.capitulo');
    if(estadoAntes) caps.forEach(function(d, i){ d.open = estadoAntes[i]; d.setAttribute('name', 'libro'); });
    estadoAntes = null;
    setTimeout(function(){ imprimiendo = false; }, 150);
  }
  window.addEventListener('beforeprint', prepararImpresion);
  window.addEventListener('afterprint', terminarImpresion);
  if($('btn-imprimir')) $('btn-imprimir').addEventListener('click', function(){
    prepararImpresion();
    var pendientes = todos('img').filter(function(img){ return !img.complete; });
    var listo = false;
    function imprimir(){ if(listo) return; listo = true; window.print(); }
    if(!pendientes.length){ setTimeout(imprimir, 50); return; }
    var faltan = pendientes.length;
    pendientes.forEach(function(img){
      function una(){ faltan--; if(faltan <= 0) imprimir(); }
      img.addEventListener('load', una, {once:true}); img.addEventListener('error', una, {once:true});
    });
    setTimeout(imprimir, 4000);
  });

  /* ---------- ¿Cuento suelto o libro? ---------- */
  var capitulos = todos('details.capitulo');
  if(!capitulos.length){
    iniciar(document.querySelector('main') || document, $('titulo'));
    return;
  }
  capitulos.forEach(function(d){ iniciar(d, d.querySelector('.titulo-cap')); });

  /* Libro: un capítulo abierto a la vez; las acuarelas del mosaico abren su cuento */
  function abrir(d){
    capitulos.forEach(function(x){ if(x !== d) x.open = false; });
    d.open = true;
    d.scrollIntoView({block:'start', behavior: quieto ? 'auto' : 'smooth'});
    var s = d.querySelector('summary'); if(s) s.focus({preventScroll:true});
  }
  capitulos.forEach(function(d){
    d.addEventListener('toggle', function(){
      if(imprimiendo) return;
      if(d.open) capitulos.forEach(function(x){ if(x !== d) x.open = false; });
      else callar();
    });
  });
  todos('.mosaico a, a[href^="#capitulo-"]').forEach(function(a){
    a.addEventListener('click', function(ev){
      var d = document.querySelector(a.getAttribute('href'));
      if(d && d.tagName === 'DETAILS'){ ev.preventDefault(); abrir(d); history.replaceState(null, '', a.getAttribute('href')); }
    });
  });
  todos('.cerrar-cap').forEach(function(a){
    a.addEventListener('click', function(){ var d = a.closest('details'); if(d) d.open = false; callar(); });
  });
  if(location.hash){ var d = document.querySelector(location.hash); if(d && d.tagName === 'DETAILS') abrir(d); }
})();
