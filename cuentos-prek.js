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
  if(hayVoz){ cargarVoces(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', cargarVoces); }
  function voz(){
    var propias = voces.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(L) === 0; });
    return propias.filter(function(v){ return /US|MX|419/i.test(v.lang); })[0] || propias[0] || null;
  }
  function apagarPalabras(){
    Array.prototype.forEach.call(visor.querySelectorAll('.pk-palabra.leyendo'), function(b){ b.classList.remove('leyendo'); });
  }
  /* Lee un texto; si se pasan palabras, las va iluminando. alTerminar(true) si terminó normalmente. */
  function decir(texto, palabras, alTerminar){
    var mio = ++turno;
    if(hayVoz) speechSynthesis.cancel();
    apagarPalabras();
    var reloj = null, hubo = false, idx = -1;
    function marcar(k){
      if(!palabras || k < 0 || k >= palabras.length || k === idx) return;
      if(idx >= 0) palabras[idx].classList.remove('leyendo');
      idx = k; palabras[k].classList.add('leyendo');
    }
    function porPosicion(c){
      if(!palabras) return;
      var k = 0;
      for(var j = 0; j < palabras.length; j++){ if(+palabras[j].getAttribute('data-i') <= c) k = j; }
      marcar(k);
    }
    function terminar(ok){
      if(mio !== turno) return;
      clearInterval(reloj); apagarPalabras();
      if(alTerminar) alTerminar(ok);
    }
    if(!hayVoz){
      /* Sin voz: se iluminan las palabras a ritmo de lectura en voz alta */
      var k0 = 0;
      marcar(0);
      reloj = setInterval(function(){ if(mio !== turno) return clearInterval(reloj); k0++; if(palabras && k0 < palabras.length) marcar(k0); else terminar(true); }, 520);
      return;
    }
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = L === 'es' ? 'es-US' : 'en-US';
    var v = voz(); if(v) u.voice = v;
    u.rate = 0.8; u.pitch = 1.08;
    u.onstart = function(){
      if(mio !== turno || !palabras) return;
      marcar(0);
      /* Algunas voces no avisan palabra por palabra: entonces se estima el ritmo */
      var t0 = Date.now(), largo = texto.length;
      reloj = setInterval(function(){
        if(mio !== turno || hubo){ clearInterval(reloj); return; }
        porPosicion(Math.min(largo, Math.floor((Date.now() - t0) / 1000 * 11.5 * u.rate)));
      }, 120);
    };
    u.onboundary = function(e){
      if(mio !== turno || !palabras) return;
      if(e.name && e.name !== 'word') return;
      hubo = true; clearInterval(reloj);
      porPosicion(e.charIndex);
    };
    u.onend = function(){ terminar(true); };
    u.onerror = function(e){ terminar(e && e.error === 'interrupted' ? false : true); };
    speechSynthesis.speak(u);
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
})();
