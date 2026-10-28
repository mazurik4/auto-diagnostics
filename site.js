// Спільний скрипт внутрішніх сторінок: меню, прогрес-смуга, кнопка «нагору».
(function(){
  'use strict';
  function $(sel){ return document.querySelector(sel); }

  const burger = $('#burgerBtn');
  const navLinks = $('#navLinks');
  if(burger && navLinks){
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
  }

  function onScroll(){
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const bar = $('#scanbar'), fab = $('#fabTop');
    if(bar) bar.style.width = (max > 0 ? top / max * 100 : 0) + '%';
    if(fab) fab.classList.toggle('show', top > 500);
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
