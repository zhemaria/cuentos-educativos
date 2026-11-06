/* ==================================================================
   Cuentos educativos · Prekínder · Cuentos para escuchar
   ------------------------------------------------------------------
   Cada cuento tiene dos o tres escenas. Lumi lee el cuento en voz alta
   y cada palabra se ilumina mientras la dice: el niño ve que lo que se
   dice está escrito, de izquierda a derecha y palabra por palabra.
   - Cada escena muestra su video (si existe) o su lámina; si todavía no
     hay ninguno de los dos, un dibujo grande de espera.
   - Al terminar una escena pasa sola a la siguiente; al final, «Otra vez».
   - Tocar una palabra la lee sola.
   No guarda datos del niño.
   Marcado esperado (ver cualquier pk-*.html):
     <section class="pk-visor"> … <figure class="pk-escena" data-img data-video data-emoji data-alt>
         <div class="pk-marco"></div><p class="pk-texto">…</p></figure> …
   José M. Fernández · Desarrollo: Claude (Anthropic) · Licencia CC BY-NC-SA 4.0
   ================================================================== */
(function(){
  'use strict';
  var L = (document.documentElement.lang || 'es').slice(0,2) === 'en' ? 'en' : 'es';
  var T = {
    es:{ escuchar:'▶ Escuchar el cuento', seguir:'▶ Seguir escuchando', parar:'■ Parar', anterior:'Escena anterior',
         siguiente:'Escena siguiente', escena:function(i,n){ return 'Escena ' + i + ' de ' + n; },
         pronto:'La lámina llegará pronto.', fin:'¡Fin!', otra:'🔁 Otra vez', palabra:'Escuchar la palabra ' },
    en:{ escuchar:'▶ Listen to the story', seguir:'▶ Keep listening', parar:'■ Stop', anterior:'Previous scene',
         siguiente:'Next scene', escena:function(i,n){ return 'Scene ' + i + ' of ' + n; },
         pronto:'The picture is coming soon.', fin:'The end!', otra:'🔁 Again', palabra:'Listen to the word ' }
  }[L];

  var visor = document.querySelector('.pk-visor');
  if(!visor) return;
  var escenas = Array.prototype.slice.call(visor.querySelectorAll('.pk-escena'));
  if(!escenas.length) return;
  var titulo = document.getElementById('titulo');
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(sel){ return visor.querySelector(sel); }
  var bEscuchar = $('.pk-escuchar'), bParar = $('.pk-parar'), bAnt = $('.pk-anterior'), bSig = $('.pk-siguiente'),
      puntos = $('.pk-puntos'), fin = $('.pk-fin'), bOtra = $('.pk-otra'), estado = $('.pk-estado');

  /* ---------- Lámina, video o dibujo de espera ---------- */
  function ponerImagen(fig){
    var marco = fig.querySelector('.pk-marco');
    var img = new Image();
    img.alt = fig.getAttribute('data-alt') || '';
    img.width = 1376; img.height = 768;
    img.onerror = function(){
      marco.innerHTML = '<div class="pk-espera" role="img" aria-label="' + img.alt.replace(/"/g,'&quot;') + '">' +
        '<span aria-hidden="true">' + (fig.getAttribute('data-emoji') || '📖') + '</span><small>' + T.pronto + '</small></div>';
    };
    img.src = fig.getAttribute('data-img');
    marco.innerHTML = ''; marco.appendChild(img);
  }
  function ponerMedio(fig){
    var marco = fig.querySelector('.pk-marco'), src = fig.getAttribute('data-video');
    if(!src || quieto){ ponerImagen(fig); return; }
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', fig.getAttribute('data-alt') || '');
    v.poster = fig.getAttribute('data-img') || '';
    v.preload = 'metadata';
    v.addEventListener('error', function(){ ponerImagen(fig); }, true);
    var s = document.createElement('source'); s.src = src; s.type = 'video/mp4';
    s.addEventListener('error', function(){ ponerImagen(fig); });
    v.appendChild(s);
    marco.innerHTML = ''; marco.appendChild(v);
  }
  escenas.forEach(ponerMedio);
  function videoDe(fig){ return fig.querySelector('video'); }

  /* ---------- Palabras: cada una en su caja, con su posición en el texto ---------- */
  escenas.forEach(function(fig){
    var p = fig.querySelector('.pk-texto');
    var texto = p.textContent.replace(/\s+/g, ' ').trim();
    var html = '', pos = 0;
    texto.split(' ').forEach(function(w){
      var limpio = w.replace(/[¡!¿?.,;:«»"“”()]/g, '');
      html += '<button type="button" class="pk-palabra" data-i="' + pos + '"' +
              (limpio ? ' aria-label="' + T.palabra + limpio.replace(/"/g,'&quot;') + '"' : '') + '>' + w + '</button> ';
      pos += w.length + 1;
    });
    p.setAttribute('data-texto', texto);
    p.innerHTML = html.trim();
  });

  /* ---------- Voz ---------- */
  var hayVoz = 'speechSynthesis' in window, voces = [], turno = 0;
  function cargarVoces(){ if(hayVoz) voces = speechSynthesis.getVoices(); }
  if(hayVoz){ cargarVoces(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', function(){ cargarVoces(); if(typeof pintarVoces === 'function') pintarVoces(); }); }
  /* Elegir la voz: primero las que avisan bien cada palabra (las de Microsoft en
     Windows y Edge, y las voces instaladas en el aparato); las voces «Google» de
     Chrome por internet van al final, porque no avisan palabra por palabra y sus
     avisos de inicio llegan tarde, y entonces la luz se atrasa. */
  function voz(){
    var propias = voces.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(L) === 0; });
    function puntos(v){
      var p = 0;
      if(/Natural|Online/i.test(v.name)) p += 60;          // voces neuronales: naturales y a tiempo
      if(L === 'en'){
        /* Inglés: las de Microsoft suenan bien y avisan cada palabra */
        if(/Microsoft/i.test(v.name)) p += 40;
        if(v.localService) p += 20;
        if(/Google/i.test(v.name)) p -= 30;
      } else {
        /* Español: las de Microsoft que trae Windows suenan robóticas;
           la de Google entona mucho mejor (la luz va por estimación, frase por frase) */
        if(/Google/i.test(v.name)) p += 40;
        if(/Microsoft/i.test(v.name) && !/Natural|Online/i.test(v.name)) p -= 10;
      }
      if(/US|MX|419/i.test(v.lang)) p += 5;
      return p;
    }
    var orden = propias.slice().sort(function(a, b){ return puntos(b) - puntos(a); });
    /* Si el adulto eligió una voz en «Para el adulto», se usa esa */
    var elegida = null;
    try{ elegida = localStorage.getItem('cuentos-prek-voz2-' + L); }catch(e){}
    if(elegida){ var v0 = orden.filter(function(v){ return v.name === elegida; })[0]; if(v0) return v0; }
    return orden[0] || null;
  }
  /* ---------- Elegir la voz (para el adulto) ---------- */
  var avisaPalabras = null;   // se sabe después de la primera frase leída
  var TV = {
    es:{ voz:'Voz de Lumi:', sinc:'Esta voz ilumina cada palabra a tiempo.', nosinc:'Esta voz no avisa cada palabra: la luz va por estimación. Si se atrasa, pruebe otra voz de la lista (las de Microsoft suelen ir mejor).', probar:'Probar la voz', prueba:'Hola, soy Lumi. Vamos a leer un cuento.' },
    en:{ voz:'Lumi’s voice:', sinc:'This voice lights up each word on time.', nosinc:'This voice does not report each word, so the light follows an estimate. If it falls behind, try another voice from the list (Microsoft voices usually work best).', probar:'Try the voice', prueba:'Hi, I am Lumi. Let’s read a story.' }
  }[L];
  var cajaVoz = null;
  function pintarVoces(){
    var adulto = document.querySelector('.pk-adulto');
    if(!adulto || !hayVoz) return;
    var propias = voces.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(L) === 0; });
    if(!propias.length) return;
    if(!cajaVoz){
      cajaVoz = document.createElement('div');
      cajaVoz.className = 'pk-voz';
      cajaVoz.innerHTML = '<label>' + TV.voz + ' <select></select></label> <button type="button">' + TV.probar + '</button><p class="pk-sinc" aria-live="polite"></p>';
      adulto.appendChild(cajaVoz);
      cajaVoz.querySelector('select').addEventListener('change', function(e){
        try{ localStorage.setItem('cuentos-prek-voz2-' + L, e.target.value); localStorage.removeItem('cuentos-prek-ritmo2-' + L); }catch(x){}
        ritmo = 14; avisaPalabras = null; pintarSinc();
      });
      cajaVoz.querySelector('button').addEventListener('click', function(){ parar(); decir(TV.prueba, null, null); });
    }
    var actualV = voz();
    cajaVoz.querySelector('select').innerHTML = propias.map(function(v){
      return '<option value="' + v.name.replace(/"/g,'&quot;') + '"' + (actualV && v.name === actualV.name ? ' selected' : '') + '>' +
             v.name.replace(/</g,'&lt;') + ' (' + v.lang + ')</option>';
    }).join('');
    pintarSinc();
  }
  function pintarSinc(){
    if(!cajaVoz) return;
    cajaVoz.querySelector('.pk-sinc').textContent = avisaPalabras === null ? '' : (avisaPalabras ? TV.sinc : TV.nosinc);
  }
  function apagarPalabras(){
    Array.prototype.forEach.call(visor.querySelectorAll('.pk-palabra.leyendo'), function(b){ b.classList.remove('leyendo'); });
  }
  /* Ritmo de la voz en letras por segundo. Empieza con un valor típico y se
     ajusta solo: después de cada frase se mide cuánto tardó la voz de verdad. */
  var ritmo = 14;
  /* El ritmo aprendido se recuerda en este aparato para los próximos cuentos */
  try{ var r0 = parseFloat(localStorage.getItem('cuentos-prek-ritmo2-' + L)); if(r0 > 5 && r0 < 30) ritmo = r0; }catch(e){}
  /* Parte el texto en frases (en los puntos, comas, ¡! y ¿?) con sus palabras.
     Cada frase se lee por separado: al empezar cada una, la luz vuelve a su
     sitio, así el desfase nunca crece. */
  function frases(texto, palabras){
    if(!palabras) return [{texto:texto, palabras:null, inicios:null}];
    var lista = [], actualF = null;
    palabras.forEach(function(b){
      if(!actualF){ actualF = {partes:[], palabras:[], inicios:[]}; lista.push(actualF); }
      var w = b.textContent, pos = actualF.partes.join(' ').length + (actualF.partes.length ? 1 : 0);
      actualF.partes.push(w); actualF.palabras.push(b); actualF.inicios.push(pos);
      if(/[.!?][»”"']*$/.test(w)) actualF = null;
    });
    return lista.map(function(f){ return {texto:f.partes.join(' '), palabras:f.palabras, inicios:f.inicios}; });
  }
  /* Lee un texto; si se pasan palabras, las va iluminando. alTerminar(true) si terminó normalmente. */
  function decir(texto, palabras, alTerminar){
    var mio = ++turno;
    if(hayVoz) speechSynthesis.cancel();
    apagarPalabras();
    var reloj = null, encendida = null;
    function encender(b){
      if(b === encendida) return;
      if(encendida) encendida.classList.remove('leyendo');
      encendida = b; if(b) b.classList.add('leyendo');
    }
    function terminar(ok){
      if(mio !== turno) return;
      clearInterval(reloj); apagarPalabras();
      if(alTerminar) alTerminar(ok);
    }
    var lista = frases(texto, palabras), n = 0;
    if(!hayVoz){
      /* Sin voz: se iluminan las palabras a ritmo de lectura en voz alta */
      var todas = palabras || [], k0 = 0;
      encender(todas[0] || null);
      reloj = setInterval(function(){ if(mio !== turno) return clearInterval(reloj); k0++; if(k0 < todas.length) encender(todas[k0]); else terminar(true); }, 520);
      return;
    }
    function siguiente(){
      if(mio !== turno) return;
      if(n >= lista.length){ terminar(true); return; }
      var f = lista[n++], hubo = false, t0 = 0;
      function porLetra(c){
        if(!f.palabras) return;
        var k = 0;
        for(var j = 0; j < f.inicios.length; j++){ if(f.inicios[j] <= c) k = j; }
        encender(f.palabras[k]);
      }
      var u = new SpeechSynthesisUtterance(f.texto);
      u.lang = L === 'es' ? 'es-US' : 'en-US';
      var v = voz(); if(v) u.voice = v;
      u.rate = 0.8; u.pitch = 1.08;
      u.onstart = function(){
        if(mio !== turno) return;
        t0 = Date.now();
        clearInterval(reloj);
        if(!f.palabras) return;
        porLetra(0);
        /* Si la voz no avisa palabra por palabra, se sigue el ritmo medido */
        reloj = setInterval(function(){
          if(mio !== turno || hubo){ clearInterval(reloj); return; }
          porLetra((Date.now() - t0) / 1000 * ritmo + 1);
        }, 60);
      };
      u.onboundary = function(e){
        if(mio !== turno || !f.palabras) return;
        if(e.name && e.name !== 'word') return;
        hubo = true; clearInterval(reloj);
        if(avisaPalabras !== true){ avisaPalabras = true; pintarSinc(); }
        porLetra(e.charIndex);
      };
      u.onend = function(){
        if(mio !== turno) return;
        clearInterval(reloj);
        if(f.palabras && f.palabras.length > 2 && !hubo && avisaPalabras === null){ avisaPalabras = false; pintarSinc(); }
        /* Aprender el ritmo real de esta voz (solo con frases de cierto largo) */
        var seg = (Date.now() - t0) / 1000 - 0.2;   // menos la pausita final de la voz
        if(t0 && seg > 0.4 && f.texto.length > 8){
          var medido = f.texto.length / seg;
          if(medido > 5 && medido < 30){
            ritmo = ritmo * 0.3 + medido * 0.7;
            try{ localStorage.setItem('cuentos-prek-ritmo2-' + L, ritmo.toFixed(2)); }catch(e){}
          }
        }
        siguiente();
      };
      u.onerror = function(e){ if(e && e.error === 'interrupted') terminar(false); else siguiente(); };
      speechSynthesis.speak(u);
    }
    siguiente();
  }
  function callar(){ turno++; if(hayVoz) speechSynthesis.cancel(); apagarPalabras(); }

  /* ---------- Escenas ---------- */
  var actual = 0, leyendo = false, espera = null;
  puntos.innerHTML = escenas.map(function(f, i){
    return '<button type="button" class="pk-punto" aria-label="' + T.escena(i+1, escenas.length) + '"></button>';
  }).join('');
  var lPuntos = Array.prototype.slice.call(puntos.querySelectorAll('.pk-punto'));
  lPuntos.forEach(function(b, i){ b.addEventListener('click', function(){ parar(); mostrar(i); }); });

  function mostrar(i){
    actual = Math.max(0, Math.min(escenas.length - 1, i));
    escenas.forEach(function(f, j){
      f.hidden = j !== actual;
      var vd = videoDe(f);
      if(vd){ if(j === actual){ var pr = vd.play(); if(pr && pr.catch) pr.catch(function(){}); } else vd.pause(); }
    });
    lPuntos.forEach(function(b, j){ if(j === actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    bAnt.disabled = actual === 0;
    bSig.disabled = actual === escenas.length - 1;
    fin.hidden = true; botones();
    estado.textContent = T.escena(actual + 1, escenas.length);
  }
  function botones(){
    bEscuchar.hidden = leyendo || !fin.hidden; bParar.hidden = !leyendo;
    bEscuchar.textContent = actual === 0 ? T.escuchar : T.seguir;
  }
  function leerEscena(conTitulo){
    var fig = escenas[actual], p = fig.querySelector('.pk-texto');
    var palabras = Array.prototype.slice.call(p.querySelectorAll('.pk-palabra'));
    function cuerpo(){
      decir(p.getAttribute('data-texto'), palabras, function(ok){
        if(!ok || !leyendo) return;
        if(actual < escenas.length - 1){
          espera = setTimeout(function(){ if(!leyendo) return; mostrar(actual + 1); leerEscena(false); }, 1100);
        } else {
          leyendo = false;
          fin.hidden = false; botones();
          bOtra.focus({preventScroll:true});
        }
      });
    }
    if(conTitulo && titulo){
      decir(titulo.textContent.trim() + '.', null, function(ok){ if(ok && leyendo) espera = setTimeout(cuerpo, 500); });
    } else cuerpo();
  }
  function empezar(){
    clearTimeout(espera);
    leyendo = true; botones(); bParar.focus({preventScroll:true});
    leerEscena(actual === 0);
  }
  function parar(){
    clearTimeout(espera);
    leyendo = false; callar(); botones();
  }

  bEscuchar.addEventListener('click', empezar);
  bParar.addEventListener('click', function(){ parar(); bEscuchar.focus({preventScroll:true}); });
  bAnt.addEventListener('click', function(){ parar(); mostrar(actual - 1); });
  bSig.addEventListener('click', function(){ parar(); mostrar(actual + 1); });
  bOtra.addEventListener('click', function(){ parar(); mostrar(0); empezar(); });
  /* Flechas del teclado para cambiar de escena */
  visor.addEventListener('keydown', function(e){
    if(e.target.closest && e.target.closest('.pk-palabra')) return;
    if(e.key === 'ArrowRight' && actual < escenas.length - 1){ parar(); mostrar(actual + 1); }
    if(e.key === 'ArrowLeft' && actual > 0){ parar(); mostrar(actual - 1); }
  });
  /* Tocar una palabra la lee sola */
  visor.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.pk-palabra');
    if(!b) return;
    parar();
    decir(b.textContent.replace(/[¡!¿?.,;:«»"“”()]/g, ''), [b], null);
  });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) parar(); });

  /* Imprimir: todas las escenas, con su lámina */
  window.addEventListener('beforeprint', function(){ parar(); escenas.forEach(function(f){ f.hidden = false; }); });
  window.addEventListener('afterprint', function(){ mostrar(actual); });
  var bImp = document.getElementById('btn-imprimir');
  if(bImp) bImp.addEventListener('click', function(){ window.print(); });

  mostrar(0);
  botones();
  pintarVoces();
  setTimeout(pintarVoces, 800);   // algunas voces llegan un poco después
})();
