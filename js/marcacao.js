/* marcacao.js — fluxo de 3 passos no portão */
(function (global) {
  const S = () => Recolhida.storage;
  const C = () => Recolhida.classify;

  const els = {};
  const state = { linha:'', tabela:'', carro:'', lockTabela:false, lockLinha:false };
  let lastReg = null;

  function init(){
    els.stepLinha   = document.getElementById('step-linha');
    els.stepTabela  = document.getElementById('step-tabela');
    els.stepCarro   = document.getElementById('step-carro');
    els.iL = document.getElementById('input-linha');
    els.iT = document.getElementById('input-tabela');
    els.iC = document.getElementById('input-carro');
    els.sL = document.getElementById('suggest-linha');
    els.sT = document.getElementById('suggest-tabela');
    els.sC = document.getElementById('suggest-carro');
    els.btnOK = document.getElementById('btn-ok');
    els.btnUndo = document.getElementById('btn-undo');
    els.last = document.getElementById('last-mark');
    els.lastPill = document.getElementById('last-pill');
    els.lastLT = document.getElementById('last-linha-tabela');
    els.lastCarro = document.getElementById('last-carro');
    els.lastHora = document.getElementById('last-hora');
    els.lastDet = document.getElementById('last-detalhe');
    els.contador = document.getElementById('contador');

    document.getElementById('btn-clear-linha').addEventListener('click', () => { setLinha(''); els.iL.focus(); });
    document.getElementById('btn-clear-tabela').addEventListener('click', () => { setTabela(''); els.iT.focus(); });
    document.getElementById('btn-clear-carro').addEventListener('click', () => { setCarro(''); els.iC.focus(); });

    els.iL.addEventListener('input', onLinhaInput);
    els.iL.addEventListener('keydown', e => { if (e.key === 'Enter') tryAdvanceFromLinha(); });
    els.iT.addEventListener('input', onTabelaInput);
    els.iT.addEventListener('keydown', e => { if (e.key === 'Enter') focusCarro(); });
    els.iC.addEventListener('input', onCarroInput);
    els.iC.addEventListener('keydown', e => { if (e.key === 'Enter') registrar(); });

    els.btnOK.addEventListener('click', registrar);
    els.btnUndo.addEventListener('click', undo);

    refresh();
    updateContadorHoje();
  }

  function activate(stepEl){
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    stepEl.classList.add('active');
  }

  function linhaCadastrada(){
    return !!S().findLinha(state.linha);
  }

  function setLinha(v){
    state.linha = v.trim();
    els.iL.value = v;
    const okLinha = linhaCadastrada();
    // Somente linha cadastrada habilita Tabela E Carro
    els.stepTabela.classList.toggle('disabled', !okLinha);
    els.iT.disabled = !okLinha;
    els.stepCarro.classList.toggle('disabled', !okLinha);
    els.iC.disabled = !okLinha;
    if (!state.linha || !okLinha){
      setTabela('');
      setCarro('');
    }
    refreshSuggestLinha();
    refreshOK();
  }
  function setTabela(v){
    state.tabela = v.trim();
    els.iT.value = v;
    // Tabela NÃO controla mais Carro — Carro depende só de Linha
    refreshSuggestTabela();
    refreshOK();
  }
  function setCarro(v){
    state.carro = v.trim();
    els.iC.value = v;
    refreshSuggestCarro();
    refreshOK();
  }

  function refreshOK(){
    // Tabela é opcional. Basta Linha cadastrada + Carro.
    const ok = !!(state.carro && linhaCadastrada());
    els.btnOK.disabled = !ok;
  }

  function onLinhaInput(){
    const v = els.iL.value.trim();
    state.linha = v;
    const okLinha = linhaCadastrada();
    // Só habilita Tabela e Carro quando a linha existe no cadastro
    els.stepTabela.classList.toggle('disabled', !okLinha);
    els.iT.disabled = !okLinha;
    els.stepCarro.classList.toggle('disabled', !okLinha);
    els.iC.disabled = !okLinha;
    refreshSuggestLinha();
    // Limpa Tabela/Carro quando a linha não é válida
    if (!okLinha){
      setTabela('');
      setCarro('');
    } else {
      // Limpa apenas Tabela (filtro depende da linha). Carro NÃO é zerado.
      setTabela('');
    }
    refreshOK();
  }
  function onTabelaInput(){
    state.tabela = els.iT.value.trim();
    refreshSuggestTabela();
    refreshOK();
  }
  function onCarroInput(){
    state.carro = els.iC.value.trim();
    refreshSuggestCarro();
    refreshOK();
  }

  function tryAdvanceFromLinha(){
    const v = els.iL.value.trim();
    if (!v) return;
    setLinha(v);
    if (!linhaCadastrada()){
      Recolhida.toast('Linha não cadastrada', 'err');
      return;
    }
    focusTabela();
  }
  function focusTabela(){
    activate(els.stepTabela);
    setTimeout(() => els.iT.focus(), 50);
  }
  function focusCarro(){
    if (!linhaCadastrada()) return; // Tabela é opcional; Carro só exige Linha cadastrada
    activate(els.stepCarro);
    setTimeout(() => els.iC.focus(), 50);
  }

  function refreshSuggestLinha(){
    const arr = S().suggestLinhas(state.linha, 12);
    els.sL.innerHTML = arr.map(l =>
      `<span class="chip ${l.codigo.toLowerCase()===state.linha.toLowerCase() ? 'match':''}" data-v="${l.codigo}">${l.codigo}</span>`
    ).join('');
    els.sL.querySelectorAll('.chip').forEach(ch =>
      ch.addEventListener('click', () => {
        setLinha(ch.dataset.v);
        focusTabela();
      })
    );
  }
  function refreshSuggestTabela(){
    if (!linhaCadastrada()){ els.sT.innerHTML=''; return; }
    const arr = S().suggestTabelasParaLinha(state.linha, state.tabela, 14);
    if (!arr.length){
      els.sT.innerHTML = `<span class="chip warn">Sem cadastro — registro ficará pendente</span>`;
      return;
    }
    els.sT.innerHTML = arr.map(t =>
      `<span class="chip ${t.tabela===state.tabela ? 'match':''}" data-v="${t.tabela}" title="prev: ${t.horaPrevista}">${t.tabela} <small style="opacity:.7">·${t.horaPrevista}</small></span>`
    ).join('');
    els.sT.querySelectorAll('.chip[data-v]').forEach(ch =>
      ch.addEventListener('click', () => {
        setTabela(ch.dataset.v);
        focusCarro();
      })
    );
  }
  function refreshSuggestCarro(){
    const arr = S().suggestCarros(state.carro, 8);
    els.sC.innerHTML = arr.map(c =>
      `<span class="chip" data-v="${c}">${c}</span>`
    ).join('');
    els.sC.querySelectorAll('.chip').forEach(ch =>
      ch.addEventListener('click', () => setCarro(ch.dataset.v))
    );
  }

  function previewClasse(){
    if (!state.linha || !state.tabela) return null;
    const t = S().findTabela(state.linha, state.tabela);
    if (!t) return { classe:'PENDENTE', desvio:null, hp:null };
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const d = C().diffMin(`${hh}:${mm}`, t.horaPrevista);
    return { classe: C().classe(d), desvio: d, hp: t.horaPrevista };
  }

  function registrar(){
    if (!linhaCadastrada()) {
      Recolhida.toast('Linha não cadastrada', 'err');
      return;
    }
    if (!state.carro) return; // Tabela opcional
    const reg = S().novaMarcacao({ linha: state.linha, tabela: state.tabela, carro: state.carro });
    lastReg = reg;
    showLast(reg);
    const semTab = !state.tabela;
    Recolhida.toast(
      reg.classe === 'PENDENTE'
        ? (semTab ? 'Registrado sem tabela · pendente' : 'Registrado · classificação pendente')
        : `Registrado · ${reg.classe}` + (reg.desvioMin !== null ? ` (${C().fmtDesvio(reg.desvioMin)})` : ''),
      reg.classe === 'ADIANTADO' ? 'err' : (reg.classe === 'ATRASADO' ? 'warn' : '')
    );
    // Reset campos (sem memória entre marcações)
    state.linha = ''; state.tabela=''; state.carro='';
    els.iL.value = ''; els.iT.value = ''; els.iC.value = '';
    setTabela(''); // reseta dependências
    activate(els.stepLinha);
    setTimeout(() => els.iL.focus(), 80);
    refreshSuggestLinha();
    refreshOK();
    updateContadorHoje();
    // Atualiza histórico se estiver visível
    if (Recolhida.historico) Recolhida.historico.refresh();
  }

  function showLast(reg){
    els.last.classList.remove('hidden');
    const cls = reg.classe.toLowerCase();
    els.lastPill.className = 'last-pill ' + cls;
    els.lastPill.textContent = reg.classe;
    els.lastLT.textContent = `Linha ${reg.linha} · Tabela ${reg.tabela || '(sem tabela)'}`;
    els.lastCarro.textContent = reg.carro;
    els.lastHora.textContent = reg.hora;
    if (reg.desvioMin !== null){
      const t = S().findTabela(reg.linha, reg.tabela);
      els.lastDet.textContent = `Prev. ${t ? t.horaPrevista : '--:--'} · desvio ${C().fmtDesvio(reg.desvioMin)}`;
    } else if (!reg.tabela){
      els.lastDet.textContent = 'Sem tabela — preencha depois no Histórico → Pendentes.';
    } else {
      els.lastDet.textContent = 'Sem cadastro mestre — recalculará automaticamente.';
    }
  }

  function undo(){
    if (!lastReg) return;
    if (!confirm('Desfazer última marcação?')) return;
    S().deleteMarcacao(lastReg.id);
    lastReg = null;
    els.last.classList.add('hidden');
    Recolhida.toast('Marcação removida', 'warn');
    updateContadorHoje();
    if (Recolhida.historico) Recolhida.historico.refresh();
  }

  function updateContadorHoje(){
    const ymd = new Date().toISOString().slice(0,10);
    const n = S().getMarcacoes().filter(m => m.data === ymd).length;
    els.contador.textContent = `${n} marcaç${n===1?'ão':'ões'} hoje`;
  }

  function refresh(){
    refreshSuggestLinha();
    refreshSuggestTabela();
    refreshSuggestCarro();
    refreshOK();
    updateContadorHoje();
    activate(els.stepLinha);
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.marcacao = { init, refresh };
})(window);
