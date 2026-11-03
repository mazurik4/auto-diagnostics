// Спільний скрипт сторінок сайту: шапка «Острів», статус «відкрито/зачинено», кнопки справа внизу
// й анонімна статистика (ті самі події, що раніше були в script.js головної).
(function(){
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/site\.js.*$/, '');

  // ---------- відкрито чи ні — за київським часом ----------
  function status(){
    try{
      var parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Kyiv', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false}).formatToParts(new Date());
      var pick = function(t){ return (parts.find(function(p){ return p.type === t; }) || {}).value; };
      var day = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[pick('weekday')];
      var mins = (+pick('hour') % 24) * 60 + (+pick('minute'));
      if((day >= 1 && day <= 5 && mins >= 600 && mins < 1020) || (day === 6 && mins >= 600 && mins < 840))
        return {open:true, html:'Майстерня зараз працює', short:'Зараз працює'};
    }catch(e){}
    // тексти як на старому сайті; у смужці на телефоні — коротко, бо поруч логотип
    return {open:false, html:'Поза графіком — <a href="/kontakty.html#zayavka" class="cta-inline">залиште заявку</a>', short:'Поза графіком'};
  }
  function showStatus(){
    var st = status();
    document.querySelectorAll('.dot[data-st]').forEach(function(d){ d.classList.toggle('off', !st.open); });
    document.querySelectorAll('[data-st-text]').forEach(function(n){ n.innerHTML = st.html; });
    document.querySelectorAll('[data-st-short]').forEach(function(n){ n.textContent = st.short; });
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

  // ---------- поля форм (як на старому сайті) ----------
  // Ім'я — лише літери й пробіл. Телефон — «+380 » вписується при кліку, далі не більше 9 цифр.
  // Що не підійшло — прибирається, а під полем на 2,5 с з'являється червоне пояснення.
  var PHONE_PREFIX = '+380 ', PHONE_DIGITS = 9;
  function fieldMsg(input, box, text){
    box.textContent = text; box.classList.add('show'); input.classList.add('input-error');
    clearTimeout(box._t);
    box._t = setTimeout(function(){ box.classList.remove('show'); input.classList.remove('input-error'); }, 2500);
  }
  function fieldClear(input, box){
    clearTimeout(box._t); box.classList.remove('show'); input.classList.remove('input-error');
  }
  function guardFields(nameInput, phoneInput, nameBox, phoneBox){
    nameInput.addEventListener('input', function(){
      var raw = this.value, cleaned = raw.replace(/[^\p{L}\s]/gu, '');
      if(cleaned !== raw){
        var pos = Math.max(0, (this.selectionStart || 0) - (raw.length - cleaned.length));
        this.value = cleaned;
        try{ this.setSelectionRange(pos, pos); }catch(e){}
        fieldMsg(nameInput, nameBox, 'Ім\'я повинно містити лише літери');
      } else fieldClear(nameInput, nameBox);
    });
    phoneInput.addEventListener('focus', function(){
      if(this.value === '') this.value = PHONE_PREFIX;
      var end = this.value.length;
      try{ this.setSelectionRange(end, end); }catch(e){}
    });
    phoneInput.addEventListener('blur', function(){
      if(this.value.trim() === PHONE_PREFIX.trim()){ this.value = ''; fieldClear(phoneInput, phoneBox); }
    });
    phoneInput.addEventListener('input', function(){
      var v = this.value, hadLetters, digits;
      if(v.indexOf(PHONE_PREFIX) === 0){
        var tail = v.slice(PHONE_PREFIX.length);
        hadLetters = /\D/.test(tail); digits = tail.replace(/\D/g, '');
      } else {
        // вставили номер цілком: «+38 (050) 111-22-33», «0501112233», «380501112233»
        hadLetters = /[^\d\s+()\-]/.test(v); digits = v.replace(/\D/g, '');
        if(/^380/.test(digits)) digits = digits.slice(3); else if(digits[0] === '0') digits = digits.slice(1);
      }
      var over = digits.length > PHONE_DIGITS;
      if(over) digits = digits.slice(0, PHONE_DIGITS);
      this.value = PHONE_PREFIX + digits;
      var end = this.value.length;
      try{ this.setSelectionRange(end, end); }catch(e){}
      if(hadLetters) fieldMsg(phoneInput, phoneBox, 'Номер повинен містити лише цифри');
      else if(over) fieldMsg(phoneInput, phoneBox, 'Максимум 9 цифр після +380');
      else fieldClear(phoneInput, phoneBox);
    });
    // «+380 » не стирається клавішами Backspace/Delete
    phoneInput.addEventListener('keydown', function(e){
      var pos = this.selectionStart;
      if((e.key === 'Backspace' && pos <= PHONE_PREFIX.length && this.selectionEnd <= PHONE_PREFIX.length) ||
         (e.key === 'Delete' && pos < PHONE_PREFIX.length)) e.preventDefault();
    });
    return {
      // перевірка перед відправкою: false — є помилка (поле підсвічене й у фокусі)
      validate: function(){
        if(!nameInput.value.trim()){ fieldMsg(nameInput, nameBox, 'Вкажіть ім\'я'); nameInput.focus(); return false; }
        if(phoneInput.value.replace(/\D/g, '').length < 12){ fieldMsg(phoneInput, phoneBox, 'Введіть 9 цифр після +380'); phoneInput.focus(); return false; }
        return true;
      }
    };
  }
  window.siteGuardFields = guardFields;

  // ---------- «Подзвонити» на комп'ютері ----------
  // З комп'ютера дзвонити не можна, тому на пристроях з мишею посилання tel: відкриває вікно:
  // номер, QR-код (набрати з телефона), форма «Передзвонимо самі» і Telegram. Телефони й планшети — як раніше.
  var PHONE_SHOW = '+38 (095) 485-11-66';
  var desktopPointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : {matches:false};
  var cbx = null, cbxOpener = null;

  function buildCallBox(){
    cbx = document.createElement('div');
    cbx.className = 'cbx';
    cbx.setAttribute('role', 'dialog');
    cbx.setAttribute('aria-modal', 'true');
    cbx.setAttribute('aria-labelledby', 'cbxTitle');
    cbx.innerHTML =
      '<div class="cbx-card">' +
        '<button type="button" class="cbx-close" aria-label="Закрити"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '<h2 id="cbxTitle">Зателефонуйте нам</h2>' +
        '<p class="cbx-num">' + PHONE_SHOW + '</p>' +
        '<p class="cbx-hours">Пн–Пт 10:00–17:00 · Сб 10:00–14:00</p>' +
        '<div class="cbx-qr"><img src="' + BASE + 'img/qr-call.svg" width="116" height="116" alt="QR-код: відкриє набір номера на телефоні">' +
          '<span>Наведіть камеру телефона — відкриється набір номера</span></div>' +
        '<div class="cbx-or"><span>або залиште номер</span></div>' +
        '<form class="cbx-form" novalidate>' +
          '<input type="text" name="name" placeholder="Ваше ім\'я" autocomplete="name" aria-label="Ваше ім\'я">' +
          '<div class="form-error"></div>' +
          '<input type="tel" name="phone" placeholder="+380" autocomplete="tel" inputmode="tel" aria-label="Ваш телефон">' +
          '<div class="form-error"></div>' +
          '<button type="submit" class="btn btn-primary">Передзвонимо самі</button>' +
        '</form>' +
        '<p class="cbx-msg" role="status" hidden></p>' +
        '<a class="cbx-tg" href="https://t.me/Autoworkshop_Alex" target="_blank" rel="noopener">Або напишіть у Telegram →</a>' +
      '</div>';
    document.body.appendChild(cbx);
    cbx.addEventListener('click', function(e){ if(e.target === cbx) closeCallBox(); });
    cbx.querySelector('.cbx-close').addEventListener('click', closeCallBox);
    var form = cbx.querySelector('.cbx-form'), msg = cbx.querySelector('.cbx-msg');
    var errs = form.querySelectorAll('.form-error');
    var guard = guardFields(form.elements.name, form.elements.phone, errs[0], errs[1]);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone, btn = form.querySelector('button');
      if(!guard.validate()) return;
      btn.disabled = true; btn.textContent = 'Надсилаємо…'; msg.hidden = true;
      fetch(API_URL + '/api/callback', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name.value.trim(), phone: phone.value.trim(), symptom: ''})
      }).then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        track('form_submit', 'вікно дзвінка');
        form.hidden = true;
        msg.className = 'cbx-msg ok'; msg.textContent = '✓ Дякуємо! Передзвонимо найближчим часом.'; msg.hidden = false;
      }).catch(function(){
        btn.disabled = false; btn.textContent = 'Передзвонимо самі';
        msg.className = 'cbx-msg err'; msg.textContent = 'Не вдалося надіслати. Спробуйте ще раз або напишіть у Telegram.'; msg.hidden = false;
      });
    });
  }

  function openCallBox(opener){
    if(!cbx) buildCallBox();
    cbxOpener = opener;
    document.documentElement.style.overflow = 'hidden';
    cbx.classList.add('open');
    var first = cbx.querySelector('input[name="name"]');
    setTimeout(function(){ (first && !first.closest('[hidden]') ? first : cbx.querySelector('.cbx-close')).focus(); }, 60);
  }

  function closeCallBox(){
    if(!cbx) return;
    cbx.classList.remove('open');
    document.documentElement.style.overflow = '';
    if(cbxOpener && cbxOpener.focus) cbxOpener.focus();
  }

  document.addEventListener('keydown', function(e){
    if(!cbx || !cbx.classList.contains('open')) return;
    if(e.key === 'Escape'){ closeCallBox(); return; }
    if(e.key === 'Tab'){
      // фокус не виходить за межі вікна
      var f = [].filter.call(cbx.querySelectorAll('button, input, a[href]'), function(n){ return !n.disabled && !n.closest('[hidden]'); });
      if(!f.length) return;
      var firstEl = f[0], lastEl = f[f.length - 1];
      if(e.shiftKey && document.activeElement === firstEl){ e.preventDefault(); lastEl.focus(); }
      else if(!e.shiftKey && document.activeElement === lastEl){ e.preventDefault(); firstEl.focus(); }
    }
  });

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
    if(href.indexOf('tel:') === 0){
      track('call_click', clickPlace(a));
      if(desktopPointer.matches && !a.closest('.tabbar')){ e.preventDefault(); openCallBox(a); }
    }
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
