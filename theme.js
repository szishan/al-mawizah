(function () {
  'use strict';
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('al-theme'); } catch (_) {}
  root.dataset.theme = stored === 'light' ? 'light' : 'dark';
  function update() {
    var button = document.getElementById('themeToggle');
    if (!button) return;
    var isLight = root.dataset.theme === 'light';
    var bangla = root.lang === 'bn';
    button.textContent = bangla ? (isLight ? 'ডার্ক মোড' : 'লাইট মোড') : (isLight ? 'Dark mode' : 'Light mode');
    button.setAttribute('aria-label', bangla ? (isLight ? 'ডার্ক মোড চালু করুন' : 'লাইট মোড চালু করুন') : (isLight ? 'Switch to dark mode' : 'Switch to light mode'));
  }
  function ready() {
    var button = document.getElementById('themeToggle');
    if (!button) return;
    button.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('al-theme', root.dataset.theme); } catch (_) {}
      update();
    });
    var lang = document.getElementById('lang');
    if (lang) lang.addEventListener('click', function () { queueMicrotask(update); });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
}());


