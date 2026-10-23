/* ==================================================================
   Cuentos educativos · Kindergarten
   Lectura en voz alta frase por frase, palabras con dibujo y preguntas
   que se contestan tocando un dibujo. No guarda datos del niño.
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
  }[L] || null;
  if(!T) return;

  function $(id){ return document.getElementById(id); }
  function todos(sel, raiz){ return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function elegir(a){ return a[Math.floor(Math.random() * a.length)]; }
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function anunciar(t){ var a = $('k-aviso'); if(!a) return; a.textContent = ''; setTimeout(function(){ a.textContent = t; }, 50); }

  /* ---------- Voz ---------- */
  var hayVoz = 'speechSynthesis' in window, voces = [], turno = 0;
  function cargarVoces(){ if(hayVoz) voces = speechSynthesis.getVoices(); }
  if(hayVoz){ cargarVoces(); speechSynthesis.onvoiceschanged = cargarVoces; }
  function voz(){
    var propias = voces.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(L) === 0; });
    return propias.filter(function(v){ return /US|MX|419/i.test(v.lang); })[0] || propias[0] || null;
  }
  /* Dice una lista de textos, uno tras otro; antes de cada uno llama a alEmpezar(i) */
  function decir(textos, alEmpezar, alTerminar){
    if(!hayVoz){ if(alTerminar) alTerminar(); return; }
    var mio = ++turno, i = 0;
    speechSynthesis.cancel();
    function siguiente(){
      if(mio !== turno) return;
      if(i >= textos.length){ if(alTerminar) alTerminar(); return; }
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
  function callar(){ turno++; if(hayVoz) speechSynthesis.cancel(); quitarLectura(); reposo(); }

  /* ---------- Escuchar el cuento completo ---------- */
  var frases = todos('.k-cuento .frase');
  function quitarLectura(){ frases.forEach(function(f){ f.classList.remove('leyendo'); }); }
  function marcarFrase(f){
    quitarLectura(); if(!f) return;
    f.classList.add('leyendo');
    f.scrollIntoView({block:'center', behavior: quieto ? 'auto' : 'smooth'});
  }
  function reposo(){ if($('k-parar')) $('k-parar').hidden = true; if($('k-escuchar')) $('k-escuchar').hidden = false; }
  if($('k-escuchar')) $('k-escuchar').addEventListener('click', function(){
    var titulo = $('titulo') ? $('titulo').textContent.trim() + '.' : '';
    var textos = [titulo].concat(frases.map(function(f){ return f.querySelector('.k-texto').textContent; }));
    $('k-escuchar').hidden = true; $('k-parar').hidden = false; $('k-parar').focus();
    decir(textos, function(i){ marcarFrase(i === 0 ? null : frases[i-1]); }, function(){ quitarLectura(); reposo(); if($('k-escuchar')) $('k-escuchar').focus(); });
  });
  if($('k-parar')) $('k-parar').addEventListener('click', function(){ callar(); $('k-escuchar').focus(); });
  if($('btn-imprimir')) $('btn-imprimir').addEventListener('click', function(){ window.print(); });

  /* Cada frase tiene su bocina */
  frases.forEach(function(f){
    f.querySelector('.k-oir').addEventListener('click', function(){
      reposo();
      decir([f.querySelector('.k-texto').textContent], function(){ marcarFrase(f); }, quitarLectura);
    });
  });

  /* ---------- Lámina que todavía no está ---------- */
  todos('.lamina img').forEach(function(img){
    function pronto(){
      var fig = img.parentNode;
      fig.innerHTML = '<div class="k-pronto"><div><span aria-hidden="true">🎨</span>' + T.pronto + '</div></div>';
    }
    if(img.complete && img.naturalWidth === 0) pronto(); else img.addEventListener('error', pronto);
  });

  /* ---------- Palabras nuevas ---------- */
  todos('.k-palabra').forEach(function(b){
    b.addEventListener('click', function(){
      var def = b.parentNode.querySelector('.k-def');
      var abierta = b.getAttribute('aria-expanded') === 'true';
      todos('.k-palabra').forEach(function(x){ x.setAttribute('aria-expanded','false'); x.parentNode.querySelector('.k-def').hidden = true; });
      if(abierta){ callar(); return; }
      b.setAttribute('aria-expanded','true'); def.hidden = false;
      reposo();
      decir([b.querySelector('.k-termino').textContent + '.', def.textContent]);
    });
  });

  /* ---------- Preguntas ---------- */
  var preguntas = todos('.k-pregunta'), contestadas = 0, alPrimero = 0;
  function textoPregunta(q){
    var ops = todos('.k-etiqueta', q).map(function(o){ return o.textContent; });
    var lista = ops.slice(0,-1).join(', ') + T.y + ops[ops.length-1];
    return [q.querySelector('.k-enunciado .k-texto').textContent, lista + '?'];
  }
  function quitarResaltado(){ todos('.cita.resaltada').forEach(function(c){ c.classList.remove('resaltada'); }); }
  preguntas.forEach(function(q){
    var correcta = +q.getAttribute('data-correcta');
    var opciones = todos('.k-opcion', q), fallo = false, hecha = false;
    q.querySelector('.k-oir').addEventListener('click', function(){ reposo(); decir(textoPregunta(q)); });
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
          reposo(); decir([frase, exp.textContent]); anunciar(frase + ' ' + exp.textContent);
          if(contestadas === preguntas.length){
            var est = $('k-estrellas');
            est.innerHTML = '<span class="k-fila" aria-hidden="true">' + '⭐'.repeat(alPrimero) + '☆'.repeat(preguntas.length - alPrimero) + '</span>' + T.final(alPrimero);
            est.hidden = false;
            setTimeout(function(){ decir([T.final(alPrimero)]); }, 2600);
          }
        } else {
          fallo = true;
          op.classList.remove('mal'); void op.offsetWidth; op.classList.add('mal');
          var cita = $(q.getAttribute('data-cita'));
          var pista = q.querySelector('.k-pista');
          var txt = cita ? cita.textContent : '';
          pista.textContent = T.otra + ' «' + txt + '»';
          pista.hidden = false;
          quitarResaltado(); if(cita) cita.classList.add('resaltada');
          reposo(); decir([T.otra, txt]); anunciar(pista.textContent);
        }
      });
    });
  });
})();

/* ---------- Lámina en movimiento (opcional) ----------
   Si la lámina tiene data-video, el botón la cambia por el video, con controles.
   Nunca arranca sola: solo cuando el niño toca el botón. */
(function(){
  'use strict';
  var boton = document.getElementById('k-video');
  var fig = document.querySelector('.lamina[data-video]');
  if(!boton || !fig) return;
  boton.addEventListener('click', function(){
    if('speechSynthesis' in window) speechSynthesis.cancel();
    var img = fig.querySelector('img');
    var v = document.createElement('video');
    v.src = fig.getAttribute('data-video');
    v.controls = true; v.playsInline = true; v.setAttribute('playsinline', '');
    if(img){ v.poster = img.src; v.setAttribute('aria-label', img.alt); }
    v.style.display = 'block'; v.style.width = '100%'; v.style.height = 'auto';
    fig.innerHTML = ''; fig.appendChild(v);
    boton.parentNode.hidden = true;
    var p = v.play(); if(p && p.catch) p.catch(function(){});
    v.focus();
  });
})();
