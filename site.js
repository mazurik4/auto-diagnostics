// Спільний скрипт сторінок сайту: шапка «Острів», статус «відкрито/зачинено», кнопки справа внизу
// й анонімна статистика (ті самі події, що раніше були в script.js головної).
(function(){
  'use strict';

  // ---------- відкрито чи ні — за київським часом ----------
  function status(){
    try{
      var parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Kyiv', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false}).formatToParts(new Date());
      var pick = function(t){ return (parts.find(function(p){ return p.type === t; }) || {}).value; };
      var day = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[pick('weekday')];
      var mins = (+pick('hour') % 24) * 60 + (+pick('minute'));
      if((day >= 1 && day <= 5 && mins >= 600 && mins < 1020) || (day === 6 && mins >= 600 && mins < 840))
        return {open:true, html:'Майстерня зараз працює', short:'Майстерня зараз<br>працює'};
    }catch(e){}
    // тексти як на старому сайті; у смужці на телефоні — у два рядки, бо поруч логотип
    return {open:false, html:'Поза графіком — <a href="/kontakty.html#zayavka" class="cta-inline">залиште заявку</a>', short:'Майстерня зараз<br>не працює'};
  }
  function showStatus(){
    var st = status();
    document.querySelectorAll('.dot[data-st]').forEach(function(d){ d.classList.toggle('off', !st.open); });
    document.querySelectorAll('[data-st-text]').forEach(function(n){ n.innerHTML = st.html; });
    document.querySelectorAll('[data-st-short]').forEach(function(n){ n.innerHTML = st.short; });
  }
  showStatus();
  setInterval(showStatus, 60000);

  // ---------- капсула: «пігулка» під пунктом меню ----------
  var isle = document.querySelector('.isle');
  if(isle){
    var nav = isle.querySelector('nav'), pill = isle.querySelector('.pill');
    var links = nav.querySelectorAll('a');
    var current = nav.querySelector('[aria-current="page"]');
    var moveTo = function(a){
      if(!a){ pill.classList.remove('on'); return; }
      pill.style.left = a.offsetLeft + 'px';
      pill.style.width = a.offsetWidth + 'px';
      pill.classList.add('on');
    };
    links.forEach(function(a){
      a.addEventListener('mouseenter', function(){ moveTo(a); });
      a.addEventListener('focus', function(){ moveTo(a); });
    });
    nav.addEventListener('mouseleave', function(){ moveTo(current); });
    var settle = function(){ moveTo(current); };
    settle();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    // назва ховається після 64px прокрутки й повертається лише вище 24px — щоб шапка не «смикалась»
    var onScroll = function(){
      var y = window.scrollY;
      if(y > 64) isle.classList.add('compact');
      else if(y < 24) isle.classList.remove('compact');
    };
    // після згортання назви пункти зсуваються — перерахувати «пігулку»
    isle.querySelector('.brand .t').addEventListener('transitionend', settle);
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', settle);
    onScroll();
  }

  // ---------- телефон: текст статусу з'являється, коли значок у першому екрані зайшов під смужку ----------
  var bar = document.querySelector('.topbar'), stBox = bar && bar.querySelector('.st');
  if(stBox){
    var anchor = document.querySelector('[data-st-anchor]');
    if(!anchor){ stBox.classList.add('show'); }
    else {
      var check = function(){ stBox.classList.toggle('show', anchor.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom); };
      window.addEventListener('scroll', check, {passive:true});
      check();
    }
  }

  // ---------- кнопка «нагору»: з'являється після 500px прокрутки ----------
  var up = document.querySelector('[data-up]');
  if(up){
    var toggleUp = function(){ up.classList.toggle('show', window.scrollY > 500); };
    window.addEventListener('scroll', toggleUp, {passive:true});
    toggleUp();
    up.addEventListener('click', function(e){
      e.preventDefault();
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:0, behavior: still ? 'auto' : 'smooth'});
    });
  }

  // ---------- анонімна статистика ----------
  // Сторінка зі своєю статистикою (галерея) ставить <body data-own-track>, щоб події не рахувались двічі.
  var API_URL = 'https://backend-cmr4.onrender.com';
  var trackingOff = document.body.hasAttribute('data-own-track');
  try {
    if(location.hash === '#notrack') localStorage.setItem('notrack', '1');
    trackingOff = trackingOff || localStorage.getItem('notrack') === '1' || navigator.doNotTrack === '1';
  } catch(e){}
  function track(name, label, extra){
    if(trackingOff) return;
    var payload = {name: name, label: String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60),
                   device: window.innerWidth < 800 ? 'mobile' : 'desktop'};
    if(extra){ for(var k in extra){ payload[k] = extra[k]; } }
    try {
      fetch(API_URL + '/api/event', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive: true}).catch(function(){});
    } catch(e){}
  }
  window.siteTrack = track;
  function referrerSource(){
    try {
      var utm = new URLSearchParams(location.search).get('utm_source');
      if(utm) return 'utm:' + utm.slice(0, 40);
      if(document.referrer){
        var host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if(host && host !== location.hostname.replace(/^www\./, '')) return host;
      }
    } catch(e){}
    return '';
  }
  var isNewSession = true;
  try { isNewSession = !sessionStorage.getItem('sv'); sessionStorage.setItem('sv', '1'); } catch(e){}
  track('view', location.pathname, { ref: isNewSession ? referrerSource() : '', new_session: isNewSession });

  function clickPlace(el){
    if(el.closest('.hero-actions')) return 'головний екран';
    if(el.closest('.isle')) return 'шапка';
    if(el.closest('.tabbar')) return 'нижня панель';
    if(el.closest('.fabs')) return 'плаваюча кнопка';
    if(el.closest('.visit')) return 'контакти';
    if(el.closest('.cta2, .cta-band, .post-cta')) return 'заклик';
    if(el.closest('footer')) return 'підвал';
    return 'інше';
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href') || '';
    if(href.indexOf('tel:') === 0) track('call_click', clickPlace(a));
    else if(href.indexOf('t.me/') !== -1) track('tg_click', clickPlace(a));
    else if(href.indexOf('maps/dir') !== -1) track('route_click', clickPlace(a));
    else if(a.classList.contains('work-card')) track('news_click', (a.querySelector('.work-card-title') || {}).textContent);
    else if(a.closest('.isle nav, .tabbar')) track('nav_click', href);
  });
  document.addEventListener('toggle', function(e){
    var d = e.target;
    if(d && d.matches && d.matches('.faq details') && d.open) track('faq_open', (d.querySelector('summary') || {}).textContent);
  }, true);

  var y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();
