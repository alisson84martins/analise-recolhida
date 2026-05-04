/* app.js — bootstrap, navegação por abas, utilitários globais */
(function (global) {

  // -------- toast util --------
  function toast(msg, kind){
    const wrap = document.querySelector('.toast-wrap') || (() => {
      const w = document.createElement('div'); w.className = 'toast-wrap';
      document.body.appendChild(w); return w;
    })();
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : (kind === 'warn' ? ' warn' : ''));
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  // -------- download utils --------
  function dlBlob(blob, name){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }
  function dlJson(obj, name){
    dlBlob(new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' }), name);
  }

  // -------- relógio --------
  function tickClock(){
    const el = document.getElementById('clock');
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  // -------- nav --------
  function setupTabs(){
    const tabs = document.querySelectorAll('.tab');
    const views = document.querySelectorAll('.view');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const v = t.dataset.view;
      views.forEach(x => x.classList.toggle('active', x.id === 'view-' + v));
      // Atualiza views ao entrar nelas
      if (v === 'historico' && Recolhida.historico) Recolhida.historico.refresh();
      if (v === 'cadastros' && Recolhida.cadastros) Recolhida.cadastros.refresh();
      if (v === 'marcacao' && Recolhida.marcacao) Recolhida.marcacao.refresh();
    }));
  }

  // -------- service worker --------
  function setupSW(){
    if (!('serviceWorker' in navigator)) return;
    // ServiceWorker só funciona via http(s). Em file:// o navegador bloqueia — degrada silenciosamente.
    if (location.protocol !== 'http:' && location.protocol !== 'https:'){
      const el = document.getElementById('status-pwa');
      if (el) el.textContent = 'Modo arquivo · sem instalação PWA (sirva via http para instalar)';
      return;
    }
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.warn('SW falhou:', err);
    });
  }

  // -------- expõe utilitários antes dos demais módulos --------
  global.Recolhida = global.Recolhida || {};
  global.Recolhida.toast = toast;
  global.Recolhida.dl = { blob: dlBlob, json: dlJson };

  // -------- bootstrap --------
  document.addEventListener('DOMContentLoaded', () => {
    tickClock();
    setInterval(tickClock, 15000);
    setupTabs();
    Recolhida.marcacao.init();
    Recolhida.cadastros.init();
    Recolhida.historico.init();
    Recolhida.exportar.init();
    setupSW();
  });

})(window);
