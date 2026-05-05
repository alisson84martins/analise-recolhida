/* lancar.js — lançamento manual de marcações com horário digitado (papel) */
(function (global) {
  const S = () => Recolhida.storage;
  const C = () => Recolhida.classify;
  const els = {};
  const sessao = []; // ids/registros lançados nesta sessão

  function ymdLocal(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function init(){
    els.data    = document.getElementById('lancar-data');
    els.hora    = document.getElementById('lancar-hora');
    els.linha   = document.getElementById('lancar-linha');
    els.tabela  = document.getElementById('lancar-tabela');
    els.carro   = document.getElementById('lancar-carro');
    els.btn     = document.getElementById('btn-lancar');
    els.btn1m   = document.getElementById('btn-lancar-hora-prox');
    els.feed    = document.getElementById('lancar-feed');

    // Defaults: data = hoje, hora = vazia (usuário define a primeira)
    const now = new Date();
    els.data.value = ymdLocal(now);

    els.btn.addEventListener('click', lancar);
    els.btn1m.addEventListener('click', () => avancarHora(1));

    [els.linha, els.tabela, els.carro].forEach(inp =>
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') lancar(); })
    );

    refresh();
  }

  function avancarHora(delta){
    const v = (els.hora.value || '').trim();
    if (!/^\d{2}:\d{2}$/.test(v)){ return; }
    const [hh, mm] = v.split(':').map(Number);
    const dataStr = els.data.value;
    if (!dataStr) return;
    const [y, mo, d] = dataStr.split('-').map(Number);
    const dt = new Date(y, mo-1, d, hh, mm + delta, 0, 0);
    els.data.value = ymdLocal(dt);
    els.hora.value = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  }

  function lancar(){
    const data   = els.data.value;
    const hora   = els.hora.value;
    const linha  = els.linha.value.trim();
    const tabela = els.tabela.value.trim();
    const carro  = els.carro.value.trim();

    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)){
      Recolhida.toast('Informe a data', 'err'); els.data.focus(); return;
    }
    if (!hora || !/^\d{2}:\d{2}$/.test(hora)){
      Recolhida.toast('Informe a hora (HH:MM)', 'err'); els.hora.focus(); return;
    }
    if (!linha){
      Recolhida.toast('Informe a linha', 'err'); els.linha.focus(); return;
    }
    if (!carro){
      Recolhida.toast('Informe o carro', 'err'); els.carro.focus(); return;
    }

    // Constrói timestamp em horário LOCAL para não virar dia em UTC
    const [y, mo, d] = data.split('-').map(Number);
    const [hh, mm]   = hora.split(':').map(Number);
    const ts = new Date(y, mo-1, d, hh, mm, 0, 0).getTime();

    const reg = S().novaMarcacao({ linha, tabela, carro, ts, manual: true });
    sessao.unshift(reg);

    Recolhida.toast(
      reg.classe === 'PENDENTE'
        ? `Lançado · ${reg.hora} · pendente`
        : `Lançado · ${reg.hora} · ${reg.classe}` +
          (reg.desvioMin !== null ? ` (${C().fmtDesvio(reg.desvioMin)})` : ''),
      reg.classe === 'ADIANTADO' ? 'err' : (reg.classe === 'ATRASADO' ? 'warn' : '')
    );

    // Avança a hora 1 min para facilitar lançamento sequencial
    avancarHora(1);

    // Limpa apenas Linha/Tabela/Carro
    els.linha.value = '';
    els.tabela.value = '';
    els.carro.value = '';
    els.linha.focus();

    refresh();
    if (Recolhida.historico) Recolhida.historico.refresh();
    if (Recolhida.marcacao && Recolhida.marcacao.refresh) Recolhida.marcacao.refresh();
  }

  function refresh(){
    if (!sessao.length){
      els.feed.innerHTML = `<div class="muted small">Nenhum lançamento manual nesta sessão.</div>`;
      return;
    }
    const head = `
      <div class="lancar-feed-header">
        <strong>${sessao.length} lançamento${sessao.length>1?'s':''} nesta sessão</strong>
        <button class="ghost-btn small" id="btn-undo-last">Desfazer último</button>
      </div>`;
    const lista = `
      <div class="lancar-list">
        ${sessao.slice(0, 50).map(r => `
          <div class="lancar-item ${r.classe.toLowerCase()}">
            <span class="hora">${r.hora}</span>
            <span class="lt">L ${r.linha} ${r.tabela ? '· T '+r.tabela : '· s/ tab'}</span>
            <span class="carro">#${r.carro}</span>
            <span class="cls">${r.classe}</span>
          </div>
        `).join('')}
      </div>`;
    els.feed.innerHTML = head + lista;
    const btn = document.getElementById('btn-undo-last');
    if (btn) btn.addEventListener('click', undoLast);
  }

  function undoLast(){
    if (!sessao.length) return;
    if (!confirm('Desfazer o último lançamento manual?')) return;
    const r = sessao.shift();
    S().deleteMarcacao(r.id);
    Recolhida.toast('Lançamento removido', 'warn');
    refresh();
    if (Recolhida.historico) Recolhida.historico.refresh();
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.lancar = { init, refresh };
})(window);
