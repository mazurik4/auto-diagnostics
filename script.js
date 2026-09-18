(function(){
  // ---------- anchor links: smooth-scroll without changing the URL ----------
  document.addEventListener('click', function(e){
    let link = e.target.closest('a[href^="#"]');
    if(!link) return;
    let href = link.getAttribute('href');
    if(!href || href === '#') return;
    e.preventDefault();
    let targetId = href.slice(1);
    if(targetId === 'top'){
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    let target = document.getElementById(targetId);
    if(!target) return;
    let header = document.querySelector('header');
    let headerHeight = header ? header.getBoundingClientRect().height : 0;
    let top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });

  // ---------- data ----------
  let services = [
    ["Комп'ютерна діагностика","Зчитування кодів помилок і параметрів з блоку керування (ECU) та CAN-шини сучасним автосканером."],
    ["Відновлення сажових фільтрів","Регенерація та очищення сажового фільтра (DPF) дизельних двигунів без зняття або зі зняттям."],
    ["Діагностика датчиків","Перевірка сигналів датчиків двигуна в реальному часі осцилографом — точніше за просте зчитування коду."],
    ["Діагностика системи запалювання","Перевірка котушок запалювання, свічок та якості іскроутворення під навантаженням."],
    ["Діагностика системи охолодження","Контроль термостата, помпи, вентилятора та герметичності контуру охолодження."],
    ["Ендоскопія циліндрів","Візуальний огляд циліндро-поршневої групи та клапанів бороскопом без розбирання двигуна."],
    ["Перевірка витоку струму","Пошук паразитного споживання електроенергії, яке розряджає акумулятор у стоянці."],
    ["Герметичність випускної/впускної системи","Тест системи димогенератором для пошуку підсмоктування повітря або витоків."],
    ["Перевірка міток ГРМ","Безрозбірна перевірка встановлення міток газорозподільного механізму осцилографом."],
    ["Перевірка тиску палива","Вимірювання тиску в паливній рампі манометром для оцінки роботи насоса і форсунок."],
    ["Перевірка тиску оливи","Контроль тиску мастила в системі — індикатор зношеності двигуна."]
  ];

  let process = [
    ["Підключення обладнання","Автосканер та вимірювальні прилади підключаються до діагностичних роз'ємів автомобіля."],
    ["Зчитування параметрів","Знімаємо коди помилок та поточні показники систем із блоків керування."],
    ["Перевірка систем наживо","Дивимось на роботу вузлів у реальному часі, а не лише на збережені коди."],
    ["Аналіз причин","Співставляємо симптоми, показники та історію — знаходимо першопричину, а не симптом."],
    ["Вирішення проблем та рекомендації","Відновлюємо те, що можна відновити. Пояснюємо, що саме несправне, і що варто зробити далі, з фото та коментарями."]
  ];

  let why = [
    "Професійне діагностичне обладнання",
    "Реальний пошук несправностей, а не заміна навмання",
    "Досвід роботи з автоелектрикою",
    "Акуратна та відповідальна робота",
    "Фото та звіти виконаних робіт",
    "Консультація перед ремонтом"
  ];

  let checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';

  let svcIcons = [
    '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    '<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 10v4"/>',
    '<path d="M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2"/>',
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    '<path d="m12 14 4-4"/><path d="M3.3 17a10 10 0 1 1 17.4 0"/>',
    '<path d="M12 2.7s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12z"/>'
  ];
  function svgIcon(path){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>'; }

  // ---------- render services ----------
  let grid = document.getElementById('svcGrid');
  services.forEach(function(s, i){
    let card = document.createElement('div');
    card.className = 'svc-card';
    let id = 'svc-desc-' + i;
    card.innerHTML =
      '<button class="svc-btn" aria-expanded="false" aria-controls="'+id+'">' +
        '<span class="svc-top"><span class="svc-ico">'+svgIcon(svcIcons[i])+'</span><span class="svc-num">'+String(i+1).padStart(2,'0')+'</span></span>' +
        '<span class="svc-title">'+s[0]+'<span class="plus">+</span></span>' +
        '<span class="svc-desc" id="'+id+'"><p>'+s[1]+'</p></span>' +
      '</button>';
    grid.appendChild(card);
  });
  grid.addEventListener('click', function(e){
    let btn = e.target.closest('.svc-btn');
    if(!btn) return;
    let desc = btn.querySelector('.svc-desc');
    let open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    desc.style.maxHeight = open ? '0px' : desc.scrollHeight + 'px';
  });

  // ---------- render process ----------
  let procList = document.getElementById('processList');
  process.forEach(function(p, i){
    let row = document.createElement('div');
    row.className = 'step';
    row.innerHTML =
      '<div class="step-num">'+String(i+1).padStart(2,'0')+'</div>' +
      '<div><div class="step-title">'+p[0]+'</div><div class="step-desc">'+p[1]+'</div></div>';
    procList.appendChild(row);
  });
  // таймлайн "загоряється" по мірі прокрутки
  let stepIO = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('lit'); stepIO.unobserve(en.target); }
    });
  }, {threshold:.6});
  procList.querySelectorAll('.step').forEach(function(s){ stepIO.observe(s); });

  // ---------- render why-us ----------
  let whyGrid = document.getElementById('whyGrid');
  why.forEach(function(w){
    let c = document.createElement('div');
    c.className = 'why-card';
    c.innerHTML = checkIcon + '<span>'+w+'</span>';
    whyGrid.appendChild(c);
  });

  // ---------- mobile nav ----------
  let burger = document.getElementById('burgerBtn');
  let navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', function(){
    let open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('open', !open);
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      burger.setAttribute('aria-expanded','false');
      navLinks.classList.remove('open');
    });
  });

  // ---------- active nav on scroll + scan progress bar ----------
  let sections = ['about','services','process','news','contacts'].map(function(id){ return document.getElementById(id); });
  let navA = document.querySelectorAll('[data-nav]');
  function onScroll(){
    let scrollTop = window.scrollY;
    let docHeight = document.documentElement.scrollHeight - window.innerHeight;
    let pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    document.getElementById('scanbar').style.width = pct + '%';

    let current = null;
    sections.forEach(function(sec){
      if(!sec || !sec.offsetParent) return; // пропускаємо приховані секції (напр. #news без новин)
      let rect = sec.getBoundingClientRect();
      if(rect.top < 120) current = sec.id;
    });
    navA.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });

    document.getElementById('fabTop').classList.toggle('show', scrollTop > 500);
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // ---------- reveal on scroll ----------
  let reveals = document.querySelectorAll('.reveal');
  let io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold:.15});
  reveals.forEach(function(el){ io.observe(el); });

  // ---------- open/closed status ----------
  function updateOpenStatus(){
    // рахуємо за київським часом, а не за часом браузера відвідувача
    let parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Kyiv', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false}).formatToParts(new Date());
    let pick = function(t){ let p = parts.find(function(x){ return x.type === t; }); return p ? p.value : ''; };
    let day = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[pick('weekday')];
    let mins = (parseInt(pick('hour'),10) % 24)*60 + parseInt(pick('minute'),10);
    let open = false;
    if(day >= 1 && day <= 5){ open = mins >= 10*60 && mins < 17*60; }
    else if(day === 6){ open = mins >= 10*60 && mins < 14*60; }

    let badgeDot = document.getElementById('badgeDot');
    let badgeText = document.getElementById('badgeText');
    let heroDot = document.getElementById('heroDot');
    let heroText = document.getElementById('heroStatusText');

    badgeDot.classList.toggle('off', !open);
    heroDot.classList.toggle('off', !open);
    let statusMsg = open
    ? 'Майстерня зараз працює'
    : 'Поза графіком — <a href="#callback" class="cta-inline">залиште заявку</a>';
    badgeText.innerHTML = statusMsg;
    heroText.innerHTML = statusMsg;
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  // ---------- scope waveform animation ----------
  let path = document.getElementById('scopePath');
  let t = 0;
  let scopeVisible = true;
  let scopeEl = document.querySelector('.scope');
  if(scopeEl && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){ scopeVisible = en[0].isIntersecting; }, {threshold:0}).observe(scopeEl);
  }
  function draw(){
    if(!scopeVisible){ requestAnimationFrame(draw); return; } // не малюємо, поки осцилограф поза екраном
    t += 0.045;
    let d = 'M0,85 ';
    for(let x = 0; x <= 400; x += 8){
      let y = 85
        + Math.sin(x*0.045 + t) * 22
        + Math.sin(x*0.11 + t*1.7) * 10
        + (Math.sin(t*3 + x*0.3) > 0.96 ? -14 : 0);
      d += 'L'+x+','+y.toFixed(1)+' ';
    }
    path.setAttribute('d', d);
    requestAnimationFrame(draw);
  }
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    requestAnimationFrame(draw);
  }
  function tick(){
    let n = new Date();
    document.getElementById('scopeTime').textContent =
      String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0');
  }
  tick(); setInterval(tick, 1000);

  // ---------- защита префикса +380 в поле телефона ----------
  // ---------- поле имени: только буквы и пробел ----------
  let nameInput = document.getElementById('cbName');
  let nameError = document.getElementById('cbNameError');
  let nameErrorTimeout;

  function showNameError(msg){
    nameError.textContent = msg;
    nameError.classList.add('show');
    nameInput.classList.add('input-error');
    clearTimeout(nameErrorTimeout);
    nameErrorTimeout = setTimeout(function(){
      nameError.classList.remove('show');
      nameInput.classList.remove('input-error');
    }, 2500);
  }
  function hideNameError(){
    clearTimeout(nameErrorTimeout);
    nameError.classList.remove('show');
    nameInput.classList.remove('input-error');
  }

  nameInput.addEventListener('input', function(){
    var raw = this.value;
    // разрешены только буквы (кириллица/латиница) и пробел
    var hadInvalid = /[^\p{L}\s]/u.test(raw);
    var cleaned = raw.replace(/[^\p{L}\s]/gu, '');

    if(cleaned !== raw){
      var pos = this.selectionStart - (raw.length - cleaned.length);
      this.value = cleaned;
      this.setSelectionRange(pos, pos);
    }

    if(hadInvalid){
      showNameError('Ім\'я повинно містити лише літери');
    } else {
      hideNameError();
    }
  });

  let phoneInput = document.getElementById('cbPhone');
  let phoneError = document.getElementById('cbPhoneError');
  let PHONE_PREFIX = '+380 ';
  let PHONE_DIGITS_LIMIT = 9;
  let phoneErrorTimeout;

  function showPhoneError(msg){
    phoneError.textContent = msg;
    phoneError.classList.add('show');
    phoneInput.classList.add('input-error');
    clearTimeout(phoneErrorTimeout);
    phoneErrorTimeout = setTimeout(function(){
      phoneError.classList.remove('show');
      phoneInput.classList.remove('input-error');
    }, 2500);
  }
  function hidePhoneError(){
    clearTimeout(phoneErrorTimeout);
    phoneError.classList.remove('show');
    phoneInput.classList.remove('input-error');
  }

  phoneInput.addEventListener('focus', function(){
  if(this.value === ''){
    this.value = PHONE_PREFIX;   // вставляем "+380 " как настоящий текст при клике
  }
  var pos = this.value.length;
  this.setSelectionRange(pos, pos);
});

phoneInput.addEventListener('blur', function(){
  if(this.value.trim() === PHONE_PREFIX.trim()){
    this.value = '';              // если ничего не ввели — возвращаем пустое поле (placeholder)
    hidePhoneError();
  }
});

  phoneInput.addEventListener('focus', function(){
    // курсор сразу после префикса, если поле ещё пустое
    if(this.value === PHONE_PREFIX){
      var pos = this.value.length;
      this.setSelectionRange(pos, pos);
    }
  });

  phoneInput.addEventListener('input', function(){
    // всё, что введено после префикса
    let tail = this.value.indexOf(PHONE_PREFIX) === 0
      ? this.value.slice(PHONE_PREFIX.length)
      : this.value.replace(/^\+?3?8?0?\s?/, '');

    let hadLetters = /\D/.test(tail);          // были нецифровые символы
    let digitsOnly = tail.replace(/\D/g, '');   // только цифры
    let overLimit = digitsOnly.length > PHONE_DIGITS_LIMIT;

    if(overLimit){ digitsOnly = digitsOnly.slice(0, PHONE_DIGITS_LIMIT); }

    this.value = PHONE_PREFIX + digitsOnly;
    let pos = this.value.length;
    this.setSelectionRange(pos, pos);

    if(hadLetters){
      showPhoneError('Номер повинен містити лише цифри');
    } else if(overLimit){
      showPhoneError('Максимум 9 цифр після +380');
    } else {
      hidePhoneError();
    }
  });

  phoneInput.addEventListener('keydown', function(e){
    // запрещаем Backspace/Delete стирать сам префикс
    let pos = this.selectionStart;
    if((e.key === 'Backspace' && pos <= PHONE_PREFIX.length) ||
       (e.key === 'Delete' && pos < PHONE_PREFIX.length)){
      e.preventDefault();
    }
  });

  // ---------- callback form ----------
  // Адрес бэкенда: пока используем прямой Render-адрес, после подключения
  // домена к бэкенду поменяйте на https://api.autoworkshop.com.ua если поменяю поддомен на api.autoworkshop.com.ua
  let API_URL = 'https://backend-cmr4.onrender.com';

  let form = document.getElementById('callbackForm');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    let name = document.getElementById('cbName').value.trim();
    let phone = document.getElementById('cbPhone').value.trim();
    if(!name || phone.replace(/\D/g,'').length < 12){
      document.getElementById('cbPhone').focus();
      return;
    }

    let submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    // 1) сохраняем заявку в базу данных на сервере
    fetch(API_URL + '/api/callback', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: name, phone: phone, symptom: selectedSymptom})
    })
      .catch(function(err){
        // если сервер недоступен — не страшно, заявка всё равно уйдёт в Telegram ниже
        console.warn('Не вдалося зберегти заявку на сервері:', err);
      })
      .finally(function(){
        submitBtn.disabled = false;
      });

    // 2) параллельно открываем Telegram — для мгновенного уведомления.
    // Открываем сразу в обработчике клика: с задержкой setTimeout браузеры часто блокируют такое окно.
    document.getElementById('cbSuccess').style.display = 'block';
    let text = encodeURIComponent('Замовлення дзвінка з сайту.\nІм\'я: '+name+'\nТелефон: '+phone + (selectedSymptom ? '\nСимптом: '+selectedSymptom : ''));
    window.open('https://t.me/Autoworkshop_Alex?text=' + text, '_blank');
  });

  // ---------- підбір за симптомом ----------
  let selectedSymptom = '';
  let symptoms = [
    {label:'Не заводиться', icon:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', note:'Причин може бути кілька: живлення, запалювання, паливо або датчики. Перевіряємо по черзі, а не наосліп.', checks:[0,3,9,6]},
    {label:'Горить індикатор', icon:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', note:'Check Engine, ABS, Airbag, ESP або DPF — зчитуємо коди та дивимось живі дані, щоб знайти справжню причину.', checks:[0,2,1]},
    {label:'Розряджається акумулятор', icon:'<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 10v4"/>', note:'Часто це паразитний струм у стоянці. Знаходимо, який саме вузол «їсть» заряд.', checks:[6,0]},
    {label:'Двигун працює нестабільно', icon:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', note:'Троїть, «плаває» холостий хід або смикається? Перевіряємо запалювання, паливо, підсмоктування повітря та датчики.', checks:[3,2,7,9,5]},
    {label:'Втрата потужності', icon:'<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>', note:'Авто не тягне або дим з вихлопу — дивимось фільтри, тиск палива та герметичність системи.', checks:[1,9,7,2]},
    {label:'Перегрів двигуна', icon:'<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>', note:'Перевіряємо термостат, помпу, вентилятор і герметичність контуру охолодження.', checks:[4,0]},
    {label:'Перед купівлею авто', icon:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', note:'Огляд «зсередини»: помилки в ECU, стан циліндрів, тиск оливи та мітки ГРМ — щоб не купити проблеми.', checks:[0,5,10,8]},
    {label:'Не знаю, що саме', icon:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5"/>', note:'Нічого страшного — опишіть, що помітили, і ми підберемо перевірки. Почнемо з комп\'ютерної діагностики.', checks:[0,2]}
  ];
  let symChips = document.getElementById('symChips');
  let symResult = document.getElementById('symResult');
  let symPicked = document.getElementById('symPicked');
  function setSymptom(label){
    selectedSymptom = label;
    document.getElementById('symPickedText').textContent = label ? 'Симптом: ' + label : '';
    symPicked.hidden = !label;
  }
  if(symChips){
    symptoms.forEach(function(s){
      let b = document.createElement('button');
      b.type = 'button';
      b.className = 'sym-chip';
      b.setAttribute('role','tab');
      b.setAttribute('aria-selected','false');
      b.innerHTML = svgIcon(s.icon) + '<span></span>';
      b.querySelector('span').textContent = s.label;
      b.addEventListener('click', function(){
        symChips.querySelectorAll('.sym-chip').forEach(function(x){ x.setAttribute('aria-selected', String(x === b)); });
        document.getElementById('symTitle').textContent = s.label;
        document.getElementById('symNote').textContent = s.note;
        let tags = document.getElementById('symTags');
        tags.innerHTML = '';
        s.checks.forEach(function(i){
          let t = document.createElement('span');
          t.className = 'sym-tag';
          t.textContent = services[i][0];
          tags.appendChild(t);
        });
        symResult.hidden = false;
        symResult.style.animation = 'none'; void symResult.offsetWidth; symResult.style.animation = '';
        setSymptom(s.label);
      });
      symChips.appendChild(b);
    });
  }
  document.getElementById('symPickedClear').addEventListener('click', function(){ setSymptom(''); });

  // ---------- news carousel (новини з Google-профілю, додаються через адмінку) ----------
  (function(){
    let section = document.getElementById('news');
    let track = document.getElementById('newsTrack');
    let dotsWrap = document.getElementById('newsDots');
    let prevBtn = document.querySelector('.news-arrow-prev');
    let nextBtn = document.querySelector('.news-arrow-next');
    if(!section || !track) return;

    let GBP_URL = 'https://www.google.com/maps?cid=15792600053340114773';

    fetch(API_URL + '/api/news')
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(renderNews)
      .catch(function(){});

    function renderNews(items){
      if(!items || !items.length) return;

      items.forEach(function(item){
        let a = document.createElement('a');
        a.className = 'news-card';
        a.href = GBP_URL;
        a.target = '_blank';
        a.rel = 'noopener';

        let imgWrap = document.createElement('div');
        imgWrap.className = 'news-card-img';
        let imgEl = document.createElement('img');
        imgEl.src = item.image_url.indexOf('/') === 0 ? API_URL + item.image_url : item.image_url;
        imgEl.alt = '';
        imgEl.loading = 'lazy';
        imgWrap.appendChild(imgEl);

        let body = document.createElement('div');
        body.className = 'news-card-body';

        let date = document.createElement('span');
        date.className = 'news-card-date';
        date.textContent = formatDate(item.created_at);

        let text = document.createElement('p');
        text.className = 'news-card-text';
        text.textContent = item.text;

        let link = document.createElement('span');
        link.className = 'news-card-link';
        link.textContent = 'Читати в Google Профілі →';

        body.appendChild(date);
        body.appendChild(text);
        body.appendChild(link);
        a.appendChild(imgWrap);
        a.appendChild(body);
        track.appendChild(a);
      });

      section.classList.add('has-items');
      let navItem = document.querySelector('.nav-news-item');
      if(navItem) navItem.style.display = '';

      buildDots();
      initAutoplay();
    }

    function formatDate(iso){
      let d = new Date(iso);
      if(isNaN(d.getTime())) return '';
      return d.toLocaleDateString('uk-UA', {day:'numeric', month:'long'});
    }

    function cardWidth(){
      let card = track.querySelector('.news-card');
      if(!card) return 0;
      let style = getComputedStyle(track);
      let gap = parseFloat(style.columnGap || style.gap) || 18;
      return card.getBoundingClientRect().width + gap;
    }
    function cardCount(){
      return track.querySelectorAll('.news-card').length;
    }
    // скільки карток одночасно вміщається у видиму область
    function visibleCount(){
      let w = cardWidth();
      return w ? Math.max(1, Math.round(track.clientWidth / w)) : 1;
    }
    // останній індекс, до якого реально можна доскролити (щоб точки не "залипали" на кінці)
    function maxIndex(){
      return Math.max(0, cardCount() - visibleCount());
    }
    function currentIndex(){
      let w = cardWidth();
      let idx = w ? Math.round(track.scrollLeft / w) : 0;
      return Math.min(idx, maxIndex());
    }
    function scrollToIndex(i){
      let w = cardWidth();
      let clamped = Math.max(0, Math.min(i, maxIndex()));
      track.scrollTo({ left: clamped * w, behavior: 'smooth' });
    }
    function updateDots(){
      let idx = currentIndex();
      dotsWrap.querySelectorAll('.news-dot').forEach(function(d, i){
        d.classList.toggle('active', i === idx);
      });
    }
    function buildDots(){
      dotsWrap.innerHTML = '';
      let n = maxIndex() + 1;
      for(let i = 0; i < n; i++){
        let b = document.createElement('button');
        b.type = 'button';
        b.className = 'news-dot' + (i === 0 ? ' active' : '');
        b.setAttribute('aria-label', 'Позиція ' + (i + 1));
        b.addEventListener('click', function(){ scrollToIndex(i); });
        dotsWrap.appendChild(b);
      }
      updateDots();
    }

    let scrollTimer;
    track.addEventListener('scroll', function(){
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateDots, 80);
    });
    let resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildDots, 150);
    });

    prevBtn.addEventListener('click', function(){ scrollToIndex(currentIndex() - 1); });
    nextBtn.addEventListener('click', function(){ scrollToIndex(currentIndex() + 1); });

    let autoplayTimer = null;
    function initAutoplay(){
      stopAutoplay();
      autoplayTimer = setInterval(function(){
        let next = currentIndex() + 1;
        scrollToIndex(next > maxIndex() ? 0 : next);
      }, 4500);
    }
    function stopAutoplay(){
      if(autoplayTimer) clearInterval(autoplayTimer);
    }
    [track, prevBtn, nextBtn].forEach(function(el){
      el.addEventListener('mouseenter', stopAutoplay);
      el.addEventListener('mouseleave', initAutoplay);
      el.addEventListener('touchstart', stopAutoplay, {passive:true});
      // на телефоні після дотику відновлюємо автоплей із паузою (mouseleave там не спрацьовує)
      el.addEventListener('touchend', function(){ stopAutoplay(); setTimeout(initAutoplay, 8000); }, {passive:true});
    });
  })();

  // ---------- год в футере — подставляется автоматически ----------
  let yearEl = document.getElementById('currentYear');
  if(yearEl){
    yearEl.textContent = new Date().getFullYear();
  }
})();
