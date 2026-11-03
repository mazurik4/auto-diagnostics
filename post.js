// Страница работы: главное фото переключается миниатюрами, стрелками и свайпом;
// клик по главному фото открывает все фото на весь экран. Без JS ссылки просто открывают фото.
(function(){
  'use strict';
  var figure = document.querySelector('.post-photo');
  var mainLink = figure && figure.querySelector('a[data-photo]');
  var thumbs = document.querySelectorAll('.post-thumbs a[data-photo]');
  var thumbBox = document.querySelector('.post-thumbs');
  var many = thumbs.length > 1;
  var links = many ? thumbs : (mainLink ? [mainLink] : []);
  var photos = [].map.call(links, function(a){ return {src: a.getAttribute('href'), alt: (a.querySelector('img') || {}).alt || ''}; });
  if(!photos.length) return;

  var icon = function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var cur = 0, mainImg = mainLink && mainLink.querySelector('img'), bg, countEl;

  // ---------- главное фото на странице ----------
  function preload(i){ new Image().src = photos[(i + photos.length) % photos.length].src; }

  function setMain(i){
    cur = (i + photos.length) % photos.length;
    var p = photos[cur];
    mainImg.classList.add('loading');
    var done = function(){ mainImg.classList.remove('loading'); };
    mainImg.onload = done; mainImg.onerror = done;
    mainImg.src = p.src; mainImg.alt = p.alt;
    mainLink.setAttribute('href', p.src);
    mainLink.setAttribute('data-photo', cur);
    bg.src = p.src;
    if(mainImg.complete) done();
    if(countEl) countEl.textContent = (cur + 1) + ' / ' + photos.length;
    [].forEach.call(thumbs, function(t, k){
      t.classList.toggle('is-active', k === cur);
      if(k === cur) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    // ряд миниатюр листаем сам (без прокрутки всей страницы), чтобы активная была на виду
    var t = thumbs[cur];
    if(thumbBox && t) thumbBox.scrollTo({left: t.offsetLeft - (thumbBox.clientWidth - t.offsetWidth) / 2, behavior: 'smooth'});
    preload(cur + 1); preload(cur - 1);
  }

  if(many && figure && mainImg){
    // размытая копия за фото + стрелки; счётчик показывает номер текущего фото
    bg = document.createElement('img');
    bg.className = 'post-photo-bg'; bg.alt = ''; bg.setAttribute('aria-hidden', 'true'); bg.src = mainImg.currentSrc || mainImg.src;
    figure.insertBefore(bg, figure.firstChild);
    var prev = document.createElement('button'), next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'post-nav post-prev'; next.className = 'post-nav post-next';
    prev.setAttribute('aria-label', 'Попереднє фото'); next.setAttribute('aria-label', 'Наступне фото');
    prev.innerHTML = icon('<path d="m15 18-6-6 6-6"/>'); next.innerHTML = icon('<path d="m9 18 6-6-6-6"/>');
    figure.appendChild(prev); figure.appendChild(next);
    prev.addEventListener('click', function(){ setMain(cur - 1); });
    next.addEventListener('click', function(){ setMain(cur + 1); });
    countEl = figure.querySelector('.post-photo-count');
    if(countEl){ var tn = countEl.lastChild; if(tn && tn.nodeType === 3) tn.textContent = ''; var sp = document.createElement('span'); countEl.appendChild(sp); countEl = sp; }
    // свайп по главному фото
    var x0 = null, y0 = 0;
    figure.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive:true});
    figure.addEventListener('touchend', function(e){
      if(x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) setMain(cur + (dx < 0 ? 1 : -1));
    }, {passive:true});
    // миниатюра меняет главное фото, а не открывает просмотр
    [].forEach.call(thumbs, function(t, k){
      t.addEventListener('click', function(e){
        if(e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        setMain(k);
      });
    });
    setMain(0);
    preload(1);
  }

  // ---------- просмотр на весь экран ----------
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
    lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
    // свайп влево/вправо — листание, вниз — закрыть
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
    [idx + 1, idx - 1].forEach(preload);
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
    // на странице остаётся то фото, на котором закрыли просмотр
    if(many && mainImg) setMain(idx);
    if(opener && opener.focus) opener.focus();
  }

  document.addEventListener('keydown', function(e){
    if(!lb || !lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') show(idx + 1);
    else if(e.key === 'ArrowLeft') show(idx - 1);
    else if(e.key === 'Tab'){
      var btns = lb.querySelectorAll('button'), first = btns[0], last = btns[btns.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  // клик по главному фото — на весь экран (для постов с одним фото — единственное фото)
  if(mainLink){
    mainLink.addEventListener('click', function(e){
      if(e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      open(many ? cur : 0);
    });
  }
  // без миниатюр других ссылок на фото нет
})();
