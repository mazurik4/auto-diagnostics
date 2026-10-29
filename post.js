// Сторінка роботи: фото на весь екран — стрілки, свайп, Esc. Без JS посилання просто відкривають фото.
(function(){
  'use strict';
  var links = document.querySelectorAll('.post-thumbs a[data-photo]');
  if(!links.length) links = document.querySelectorAll('.post-photo a[data-photo]');
  var photos = [].map.call(links, function(a){ return {src: a.getAttribute('href'), alt: (a.querySelector('img') || {}).alt || ''}; });
  if(!photos.length) return;

  var icon = function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var lb, img, count, idx = 0, opener = null;

  function build(){
    lb = document.createElement('div');
    lb.className = 'plb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Фото роботи');
    lb.innerHTML = '<img alt="">' +
      '<span class="plb-count" aria-live="polite"></span>' +
      '<button type="button" class="plb-close" aria-label="Закрити">' + icon('<path d="M18 6 6 18M6 6l12 12"/>') + '</button>' +
      (photos.length > 1 ?
        '<button type="button" class="plb-prev" aria-label="Попереднє фото">' + icon('<path d="m15 18-6-6 6-6"/>') + '</button>' +
        '<button type="button" class="plb-next" aria-label="Наступне фото">' + icon('<path d="m9 18 6-6-6-6"/>') + '</button>' : '');
    document.body.appendChild(lb);
    img = lb.querySelector('img');
    count = lb.querySelector('.plb-count');
    lb.querySelector('.plb-close').addEventListener('click', close);
    if(photos.length > 1){
      lb.querySelector('.plb-prev').addEventListener('click', function(){ show(idx - 1); });
      lb.querySelector('.plb-next').addEventListener('click', function(){ show(idx + 1); });
    }
    // клік по темному тлі закриває
    lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
    // свайп вліво/вправо — гортання, вниз — закрити
    var x0 = null, y0 = 0;
    lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive:true});
    lb.addEventListener('touchend', function(e){
      if(x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      else if(dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, {passive:true});
  }

  function show(i){
    idx = (i + photos.length) % photos.length;
    img.src = photos[idx].src;
    img.alt = photos[idx].alt;
    count.textContent = photos.length > 1 ? (idx + 1) + ' / ' + photos.length : '';
    // наступне й попереднє фото підвантажуємо заздалегідь
    [idx + 1, idx - 1].forEach(function(j){ new Image().src = photos[(j + photos.length) % photos.length].src; });
  }

  function open(i){
    if(!lb) build();
    opener = document.activeElement;
    show(i);
    lb.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.plb-close').focus();
  }

  function close(){
    lb.classList.remove('open');
    document.documentElement.style.overflow = '';
    if(opener && opener.focus) opener.focus();
  }

  document.addEventListener('keydown', function(e){
    if(!lb || !lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') show(idx + 1);
    else if(e.key === 'ArrowLeft') show(idx - 1);
    else if(e.key === 'Tab'){
      // фокус не виходить за межі перегляду
      var btns = lb.querySelectorAll('button'), first = btns[0], last = btns[btns.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  document.querySelectorAll('.post-photo a[data-photo], .post-thumbs a[data-photo]').forEach(function(a){
    a.addEventListener('click', function(e){
      if(e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      open(+a.getAttribute('data-photo'));
    });
  });
})();
