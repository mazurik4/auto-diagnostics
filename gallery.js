(function(){
  'use strict';

  const API_URL = 'https://backend-cmr4.onrender.com';
  const SLIDER_COUNT = 8;        // скільки найновіших фото в слайдері
  const SLIDER_INTERVAL = 5200;  // автопрокрутка, мс
  const SECTION_PREVIEW = 6;     // скільки фото показуємо в огляді розділу
  const PAGE_SIZE = 12;          // скільки докидаємо при прокрутці в розділі
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root){ return (root || document).querySelector(sel); }
  function el(tag, cls, text){
    const n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }
  function imgUrl(path){ return path && path.indexOf('/') === 0 ? API_URL + path : path; }
  function fmtDate(iso){
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('uk-UA', {day:'numeric', month:'long', year:'numeric'});
  }

  // ---------- меню, прогрес-смуга, кнопка «нагору» ----------
  const burger = $('#burgerBtn');
  const navLinks = $('#navLinks');
  burger.addEventListener('click', function(){
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('open', !open);
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });
  function onScroll(){
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $('#scanbar').style.width = (max > 0 ? top / max * 100 : 0) + '%';
    $('#fabTop').classList.toggle('show', top > 500);
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  $('#currentYear').textContent = new Date().getFullYear();

  // ---------- анонімна статистика (ті самі правила, що на головній) ----------
  let trackingOff = false;
  try {
    if(location.hash === '#notrack') localStorage.setItem('notrack', '1');
    trackingOff = localStorage.getItem('notrack') === '1' || navigator.doNotTrack === '1';
  } catch(e){}

  function track(name, label, extra){
    if(trackingOff) return;
    const payload = {
      name: name,
      label: String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      device: window.innerWidth < 800 ? 'mobile' : 'desktop'
    };
    if(extra){ for(const k in extra){ payload[k] = extra[k]; } }
    try {
      fetch(API_URL + '/api/event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(){});
    } catch(e){}
  }
  function referrerSource(){
    try {
      const utm = new URLSearchParams(location.search).get('utm_source');
      if(utm) return 'utm:' + utm.slice(0, 40);
      if(document.referrer){
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if(host && host !== location.hostname.replace(/^www\./, '')) return host;
      }
    } catch(e){}
    return '';
  }
  (function(){
    let isNew = true;
    try { isNew = !sessionStorage.getItem('sv'); sessionStorage.setItem('sv', '1'); } catch(e){}
    track('view', location.pathname, { ref: isNew ? referrerSource() : '', new_session: isNew });
  })();
  document.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    const place = a.closest('header') ? 'шапка' : a.closest('.mobile-bar') ? 'мобільна панель'
      : a.closest('.gal-cta') ? 'галерея: заклик' : a.closest('footer') ? 'підвал' : 'галерея';
    if(href.indexOf('tel:') === 0) track('call_click', place);
    else if(href.indexOf('t.me/') !== -1) track('tg_click', place);
    else if(a.classList.contains('gal-card--video')) track('gallery_open', 'відео → Google');
  });

  // ---------- стан ----------
  let data = null;
  let photos = [];
  let videos = [];
  let view = 'all';
  let loadObserver = null;

  const countsBox = $('#galCounts');
  const tabsWrap = $('#galTabsWrap');
  const tabsBox = $('#galTabs');
  const content = $('#galContent');

  function catTitle(key){ return (data && data.titles && data.titles[key]) || 'Інше'; }

  // ---------- завантаження ----------
  const wakeTimer = setTimeout(function(){ const w = $('#galWake'); if(w) w.hidden = false; }, 5000);
  load();

  function load(){
    fetch(API_URL + '/api/gallery')
      .then(function(r){ if(!r.ok) throw new Error('http'); return r.json(); })
      .then(init)
      .catch(showError);
  }

  function showError(){
    clearTimeout(wakeTimer);
    content.innerHTML = '';
    const box = el('div', 'gal-state');
    box.appendChild(el('h2', '', 'Не вдалося завантажити галерею'));
    box.appendChild(el('p', '', 'Схоже, сервер ще прокидається або зникло з’єднання. Спробуйте ще раз.'));
    const btn = el('button', 'btn btn-primary', 'Спробувати знову');
    btn.type = 'button';
    btn.addEventListener('click', function(){
      content.innerHTML = '';
      content.appendChild(skeleton());
      load();
    });
    box.appendChild(btn);
    content.appendChild(box);
  }

  function skeleton(){
    const g = el('div', 'gal-grid');
    for(let i = 0; i < 6; i++) g.appendChild(el('div', 'gal-skel'));
    return g;
  }

  function init(d){
    clearTimeout(wakeTimer);
    data = d;
    const items = d.items || [];
    photos = items.filter(function(i){ return i.type === 'PHOTO'; });
    videos = items.filter(function(i){ return i.type === 'VIDEO'; });

    if(!items.length){
      content.innerHTML = '';
      const box = el('div', 'gal-state');
      box.appendChild(el('h2', '', 'Галерея наповнюється'));
      box.appendChild(el('p', '', 'Скоро тут з’являться фото та відео з наших робіт. А поки що — подивіться нас у Google.'));
      const a = el('a', 'btn btn-ghost', 'Відкрити профіль Google');
      a.href = d.profile_url; a.target = '_blank'; a.rel = 'noopener';
      box.appendChild(a);
      content.appendChild(box);
      return;
    }

    buildCounts();
    buildSlider();
    buildTabs();
    renderView(false);
  }

  function buildCounts(){
    countsBox.innerHTML = '';
    [[photos.length, 'фото'], [videos.length, 'відео']].forEach(function(p){
      if(!p[0]) return;
      const c = el('span', 'gal-count');
      c.appendChild(el('b', '', String(p[0])));
      c.appendChild(document.createTextNode(p[1]));
      countsBox.appendChild(c);
    });
  }

  // ---------- вкладки ----------
  function buildTabs(){
    const tabs = [{key:'all', title:'Усе', count:photos.length + videos.length}];
    (data.categories || []).forEach(function(c){ tabs.push({key:c.key, title:c.title, count:c.count}); });
    if(videos.length) tabs.push({key:'video', title:'Відео', count:videos.length});

    tabsBox.innerHTML = '';
    tabs.forEach(function(t){
      const b = el('button', 'gal-tab');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.dataset.key = t.key;
      b.setAttribute('aria-selected', String(t.key === view));
      b.appendChild(document.createTextNode(t.title));
      b.appendChild(el('span', '', String(t.count)));
      b.addEventListener('click', function(){ setView(t.key, true); });
      tabsBox.appendChild(b);
    });
    tabsWrap.hidden = false;
    updateTabsArrows();
  }

  // стрілки та затухання по краях панелі розділів: показуємо лише там, куди ще можна листати
  const tabsPrev = $('#galTabsPrev');
  const tabsNext = $('#galTabsNext');
  function updateTabsArrows(){
    const max = tabsBox.scrollWidth - tabsBox.clientWidth;
    const left = tabsBox.scrollLeft > 4;
    const right = tabsBox.scrollLeft < max - 4;
    tabsBox.classList.toggle('can-left', left);
    tabsBox.classList.toggle('can-right', right);
    tabsPrev.hidden = !left;
    tabsNext.hidden = !right;
  }
  function scrollTabs(dir){
    tabsBox.scrollBy({left: dir * Math.max(160, tabsBox.clientWidth * 0.6), behavior: reduceMotion ? 'auto' : 'smooth'});
  }
  tabsPrev.addEventListener('click', function(){ scrollTabs(-1); });
  tabsNext.addEventListener('click', function(){ scrollTabs(1); });
  tabsBox.addEventListener('scroll', function(){ updateTabsArrows(); }, {passive:true});
  window.addEventListener('resize', updateTabsArrows);
  // клавіатура: ← → переходять між розділами, Home/End — на перший/останній
  tabsBox.addEventListener('keydown', function(e){
    const tabs = Array.prototype.slice.call(tabsBox.querySelectorAll('.gal-tab'));
    const cur = tabs.findIndex(function(t){ return t.getAttribute('aria-selected') === 'true'; });
    let next = -1;
    if(e.key === 'ArrowRight') next = Math.min(tabs.length - 1, cur + 1);
    else if(e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if(e.key === 'Home') next = 0;
    else if(e.key === 'End') next = tabs.length - 1;
    if(next < 0 || next === cur) return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });

  function setView(key, fromUser){
    if(key === view) return;
    view = key;
    $('.gal-tab[aria-selected="true"]', tabsBox) && $('.gal-tab[aria-selected="true"]', tabsBox).setAttribute('aria-selected', 'false');
    const tab = tabsBox.querySelector('.gal-tab[data-key="' + key + '"]');
    if(tab){
      tab.setAttribute('aria-selected', 'true');
      tabsBox.scrollTo({left: tab.offsetLeft - (tabsBox.clientWidth - tab.clientWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth'});
      if(fromUser) track('gallery_tab', tab.firstChild.textContent);
    }
    renderView(fromUser);
  }

  // ---------- вміст розділу ----------
  function currentPhotos(){
    if(view === 'all') return photos;
    return photos.filter(function(p){ return p.category === view; });
  }

  function renderView(scrollToTop){
    if(loadObserver){ loadObserver.disconnect(); loadObserver = null; }
    content.innerHTML = '';

    if(view === 'all'){
      (data.categories || []).forEach(function(c){
        content.appendChild(section(c.title, photos.filter(function(p){ return p.category === c.key; }), c.key));
      });
      if(videos.length) content.appendChild(section('Відео', videos, 'video'));
    } else if(view === 'video'){
      content.appendChild(batchedGrid(videos));
    } else {
      content.appendChild(batchedGrid(photos.filter(function(p){ return p.category === view; })));
    }

    if(scrollToTop){
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = $('#galBrowse').getBoundingClientRect().top + window.scrollY - navH + 1;
      if(window.scrollY > top){ window.scrollTo({top: top, behavior: reduceMotion ? 'auto' : 'smooth'}); }
    }
  }

  function section(title, list, key){
    const box = el('section', 'gal-section');
    const head = el('div', 'gal-section-head');
    const h = el('h2', '', title);
    h.appendChild(el('small', '', String(list.length)));
    head.appendChild(h);
    if(list.length > SECTION_PREVIEW){
      const more = el('button', 'gal-more', 'Усі ' + list.length + ' →');
      more.type = 'button';
      more.addEventListener('click', function(){ setView(key, true); });
      head.appendChild(more);
    }
    box.appendChild(head);
    const grid = el('div', 'gal-grid');
    list.slice(0, SECTION_PREVIEW).forEach(function(item, i){ grid.appendChild(card(item, i)); });
    box.appendChild(grid);
    return box;
  }

  function batchedGrid(list){
    const wrap = el('div', 'gal-section');
    const head = el('div', 'gal-section-head');
    const title = view === 'video' ? 'Відео' : catTitle(view);
    const h = el('h2', '', title);
    h.appendChild(el('small', '', String(list.length)));
    head.appendChild(h);
    wrap.appendChild(head);

    const grid = el('div', 'gal-grid');
    wrap.appendChild(grid);
    let shown = 0;
    const foot = el('div', 'gal-loadmore');
    wrap.appendChild(foot);

    function more(){
      list.slice(shown, shown + PAGE_SIZE).forEach(function(item, i){ grid.appendChild(card(item, i)); });
      shown = Math.min(list.length, shown + PAGE_SIZE);
      foot.innerHTML = '';
      if(shown < list.length){
        const b = el('button', 'btn btn-ghost', 'Показати ще · ' + (list.length - shown));
        b.type = 'button';
        b.addEventListener('click', more);
        foot.appendChild(b);
        if('IntersectionObserver' in window){
          if(loadObserver) loadObserver.disconnect();
          loadObserver = new IntersectionObserver(function(entries){
            if(entries[0].isIntersecting){ loadObserver.disconnect(); more(); }
          }, {rootMargin: '300px'});
          loadObserver.observe(foot);
        }
      }
    }
    more();
    return wrap;
  }

  function card(item, i){
    const isVideo = item.type === 'VIDEO';
    const node = el(isVideo ? 'a' : 'button', 'gal-card' + (isVideo ? ' gal-card--video' : ''));
    node.style.setProperty('--i', i % PAGE_SIZE);
    const title = catTitle(item.category);
    if(isVideo){
      node.href = data.profile_url; node.target = '_blank'; node.rel = 'noopener';
      node.setAttribute('aria-label', 'Відео — дивитися в Google');
    } else {
      node.type = 'button';
      node.setAttribute('aria-label', title + ' — відкрити фото');
      node.addEventListener('click', function(){ openLightbox(currentPhotos(), item.id); });
    }
    const img = el('img');
    img.src = imgUrl(item.thumb_url);
    img.alt = title + (isVideo ? ' — відео з майстерні' : ' — фото з майстерні');
    img.loading = 'lazy';
    img.decoding = 'async';
    node.appendChild(img);
    if(isVideo){
      const b = el('span', 'gal-badge', 'Відео · Google');
      node.appendChild(b);
    } else {
      node.appendChild(el('span', 'gal-tag', title));
    }
    return node;
  }

  // ---------- слайдер з автопрокруткою ----------
  const slider = {
    track: $('#galTrack'), dots: $('#galDots'), progress: $('#galProgress'),
    slides: [], index: 0, timer: null,
    hovered: false, focused: false, touching: false, inView: true, lightbox: false
  };

  function buildSlider(){
    const list = photos.slice(0, SLIDER_COUNT);
    if(!list.length) return;
    $('#galSliderSection').hidden = false;
    slider.track.innerHTML = '';
    slider.dots.innerHTML = '';
    slider.slides = [];

    list.forEach(function(item, i){
      const s = el('button', 'gal-slide');
      s.type = 'button';
      s.setAttribute('aria-label', catTitle(item.category) + ' — відкрити фото ' + (i + 1) + ' з ' + list.length);
      const img = el('img');
      img.src = imgUrl(item.image_url);
      img.alt = catTitle(item.category) + ' — фото з майстерні';
      img.decoding = 'async';
      if(i > 1) img.loading = 'lazy';
      s.appendChild(img);
      const cap = el('div', 'gal-slide-cap');
      cap.appendChild(el('span', 'gal-tag', catTitle(item.category)));
      cap.appendChild(el('span', 'gal-date', fmtDate(item.created_at)));
      s.appendChild(cap);
      s.addEventListener('click', function(){ openLightbox(photos, item.id); });
      slider.track.appendChild(s);
      slider.slides.push(s);

      const d = el('button', 'gal-dot');
      d.type = 'button';
      d.setAttribute('aria-label', 'Фото ' + (i + 1));
      d.addEventListener('click', function(){ goTo(i); });
      slider.dots.appendChild(d);
    });

    if(list.length < 2){ $('.gal-slider-foot').hidden = true; $('#galPrev').hidden = true; $('#galNext').hidden = true; }
    setActive(0);

    let ticking = false;
    slider.track.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){ ticking = false; syncFromScroll(); });
    }, {passive:true});

    $('#galPrev').addEventListener('click', function(){ goTo(slider.index - 1); });
    $('#galNext').addEventListener('click', function(){ goTo(slider.index + 1); });

    const box = $('#galSlider');
    box.addEventListener('mouseenter', function(){ slider.hovered = true; refreshAutoplay(); });
    box.addEventListener('mouseleave', function(){ slider.hovered = false; refreshAutoplay(); });
    // пауза лише від клавіатурного фокуса: після кліку мишкою по стрілці автопрокрутка не повинна "залипати"
    box.addEventListener('focusin', function(e){
      slider.focused = !!(e.target.matches && e.target.matches(':focus-visible'));
      refreshAutoplay();
    });
    box.addEventListener('focusout', function(){ slider.focused = false; refreshAutoplay(); });
    let touchTimer;
    box.addEventListener('touchstart', function(){ slider.touching = true; clearTimeout(touchTimer); refreshAutoplay(); }, {passive:true});
    box.addEventListener('touchend', function(){
      clearTimeout(touchTimer);
      touchTimer = setTimeout(function(){ slider.touching = false; refreshAutoplay(); }, 6000);
    }, {passive:true});
    document.addEventListener('visibilitychange', refreshAutoplay);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){ slider.inView = entries[0].isIntersecting; refreshAutoplay(); }, {threshold: .25}).observe(box);
    }
    refreshAutoplay();
  }

  function setActive(i){
    slider.index = i;
    slider.slides.forEach(function(s, n){ s.classList.toggle('is-active', n === i); });
    slider.dots.querySelectorAll('.gal-dot').forEach(function(d, n){ d.classList.toggle('active', n === i); });
  }

  function syncFromScroll(){
    const mid = slider.track.scrollLeft + slider.track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    slider.slides.forEach(function(s, n){
      const dist = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
      if(dist < bestDist){ bestDist = dist; best = n; }
    });
    if(best !== slider.index){
      setActive(best);
      refreshAutoplay(true); // після будь-якого руху (свайп чи автоперехід) відлік починається заново
    }
  }

  function goTo(i){
    const n = slider.slides.length;
    const idx = (i + n) % n;
    const s = slider.slides[idx];
    slider.track.scrollTo({
      left: s.offsetLeft - (slider.track.clientWidth - s.clientWidth) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  function autoplayAllowed(){
    return !reduceMotion && slider.slides.length > 1 && !slider.hovered && !slider.focused &&
      !slider.touching && slider.inView && !slider.lightbox && !document.hidden;
  }

  function refreshAutoplay(restart){
    clearTimeout(slider.timer);
    const p = slider.progress;
    p.style.setProperty('--gal-interval', SLIDER_INTERVAL + 'ms');
    if(!autoplayAllowed()){
      p.classList.add('paused');
      return;
    }
    p.classList.remove('paused');
    p.classList.remove('run');
    void p.offsetWidth; // перезапуск анімації смуги
    p.classList.add('run');
    slider.timer = setTimeout(function(){ goTo(slider.index + 1); }, SLIDER_INTERVAL);
  }

  // ---------- перегляд на весь екран ----------
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  let lbList = [];
  let lbIndex = 0;
  let lastFocus = null;

  function openLightbox(list, id){
    if(!list.length) return;
    lbList = list;
    lbIndex = Math.max(0, list.findIndex(function(i){ return i.id === id; }));
    lastFocus = document.activeElement;
    lb.classList.add('open');
    document.body.classList.add('lb-open');
    slider.lightbox = true;
    refreshAutoplay();
    showLb();
    $('#lbClose').focus();
    track('gallery_open', catTitle(lbList[lbIndex].category));
  }

  function closeLightbox(){
    lb.classList.remove('open');
    document.body.classList.remove('lb-open');
    slider.lightbox = false;
    refreshAutoplay();
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function stepLb(delta){
    lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
    showLb();
  }

  function showLb(){
    const item = lbList[lbIndex];
    lbImg.alt = catTitle(item.category) + ' — фото з майстерні';
    // одразу показуємо вже завантажене превʼю, а повну якість підміняємо, коли довантажиться
    lbImg.src = imgUrl(item.thumb_url);
    lbImg.classList.add('loading');
    const full = imgUrl(item.image_url);
    const pre = new Image();
    pre.onload = function(){
      if(lbList[lbIndex] === item){ lbImg.src = full; lbImg.classList.remove('loading'); }
    };
    pre.onerror = function(){ lbImg.classList.remove('loading'); };
    pre.src = full;
    $('#lbCaption').textContent = catTitle(item.category) + (item.created_at ? ' · ' + fmtDate(item.created_at) : '');
    $('#lbCounter').textContent = (lbIndex + 1) + ' / ' + lbList.length;
    // підвантажуємо сусідні фото наперед
    [1, -1].forEach(function(d){
      const n = lbList[(lbIndex + d + lbList.length) % lbList.length];
      if(n){ const i = new Image(); i.src = imgUrl(n.image_url); }
    });
  }

  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', function(){ stepLb(-1); });
  $('#lbNext').addEventListener('click', function(){ stepLb(1); });
  lb.addEventListener('click', function(e){
    if(e.target === lb || e.target === $('#lbStage')) closeLightbox();
  });
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    else if(e.key === 'ArrowLeft') stepLb(-1);
    else if(e.key === 'ArrowRight') stepLb(1);
    else if(e.key === 'Tab'){
      // фокус не виходить за межі вікна перегляду
      const btns = [$('#lbClose'), $('#lbPrev'), $('#lbNext')].filter(function(b){ return b.offsetParent !== null; });
      if(!btns.length) return;
      const first = btns[0], last = btns[btns.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', function(e){ touchX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){
    if(touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if(Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1);
  }, {passive:true});
})();
