(function(){
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
    ["Рекомендації","Пояснюємо, що саме несправне, і що варто зробити далі, з фото та коментарями."]
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

  // ---------- render services ----------
  let grid = document.getElementById('svcGrid');
  services.forEach(function(s, i){
    let card = document.createElement('div');
    card.className = 'svc-card';
    let id = 'svc-desc-' + i;
    card.innerHTML =
      '<button class="svc-btn" aria-expanded="false" aria-controls="'+id+'">' +
        '<span class="svc-num">'+String(i+1).padStart(2,'0')+'</span>' +
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
  let sections = ['about','services','process','contacts'].map(function(id){ return document.getElementById(id); });
  let navA = document.querySelectorAll('[data-nav]');
  function onScroll(){
    let scrollTop = window.scrollY;
    let docHeight = document.documentElement.scrollHeight - window.innerHeight;
    let pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    document.getElementById('scanbar').style.width = pct + '%';

    let current = null;
    sections.forEach(function(sec){
      if(!sec) return;
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
    let now = new Date();
    let day = now.getDay(); // 0 Sun .. 6 Sat
    let mins = now.getHours()*60 + now.getMinutes();
    let open = false;
    if(day >= 1 && day <= 5){ open = mins >= 10*60 && mins < 17*60; }
    else if(day === 6){ open = mins >= 10*60 && mins < 14*60; }

    let badgeDot = document.getElementById('badgeDot');
    let badgeText = document.getElementById('badgeText');
    let heroDot = document.getElementById('heroDot');
    let heroText = document.getElementById('heroStatusText');

    badgeDot.classList.toggle('off', !open);
    heroDot.classList.toggle('off', !open);
    let msg = open
    ? 'Майстерня зараз працює'
    : 'Поза графіком — <a href="#callback" class="cta-inline">залиште заявку</a>';
    badgeText.innerHTML = msg;
    heroText.innerHTML = msg;
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  // ---------- scope waveform animation ----------
  let path = document.getElementById('scopePath');
  let t = 0;
  function draw(){
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
      body: JSON.stringify({name: name, phone: phone})
    })
      .catch(function(err){
        // если сервер недоступен — не страшно, заявка всё равно уйдёт в Telegram ниже
        console.warn('Не вдалося зберегти заявку на сервері:', err);
      })
      .finally(function(){
        submitBtn.disabled = false;
      });

    // 2) параллельно открываем Telegram — как и раньше, для мгновенного уведомления
    document.getElementById('cbSuccess').style.display = 'block';
    let text = encodeURIComponent('Замовлення дзвінка з сайту.\nІм\'я: '+name+'\nТелефон: '+phone);
    setTimeout(function(){
      window.open('https://t.me/Autoworkshop_Alex?text=' + text, '_blank');
    }, 700);
  });

  // ---------- год в футере — подставляется автоматически ----------
  let yearEl = document.getElementById('currentYear');
  if(yearEl){
    yearEl.textContent = new Date().getFullYear();
  }
})();
