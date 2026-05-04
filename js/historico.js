/* historico.js — KPIs do dia, tabela diária, Pareto por linha, Ranking de tabelas */
(function (global) {
  const S = () => Recolhida.storage;
  const C = () => Recolhida.classify;
  const els = {};

  function init(){
    els.filtroPeriodo = document.getElementById('filtro-periodo');
    els.resumoDia = document.getElementById('resumo-dia');
    els.tabDiariaBody = document.querySelector('#tab-diaria tbody');
    els.paretoLinhas = document.getElementById('pareto-linhas');
    els.rankingTabelasBody = document.querySelector('#ranking-tabelas tbody');
    els.pendentes = document.getElementById('pendentes');

    els.filtroPeriodo.addEventListener('change', refresh);
    refresh();
  }

  function rangeFromFilter(){
    const v = els.filtroPeriodo.value;
    const today = new Date(); today.setHours(0,0,0,0);
    if (v === 'hoje'){
      return { ini: today, fim: new Date(today.getTime() + 86399999), label:'hoje' };
    }
    if (v === 'all'){
      return { ini: new Date(0), fim: new Date(), label:'todo histórico' };
    }
    const dias = parseInt(v, 10) || 7;
    const ini = new Date(today.getTime() - (dias-1)*86400000);
    return { ini, fim: new Date(today.getTime() + 86399999), label: `${dias} dias` };
  }

  function inRange(m, ini, fim){ return m.ts >= ini.getTime() && m.ts <= fim.getTime(); }

  function refresh(){
    const all = S().getMarcacoes();
    const { ini, fim } = rangeFromFilter();
    const filtradas = all.filter(m => inRange(m, ini, fim));

    renderResumoDia(all);
    renderTabelaDiaria(filtradas);
    renderParetoLinhas(filtradas);
    renderRankingTabelas(filtradas);
    renderPendentes(all);
  }

  function renderResumoDia(all){
    const ymd = new Date().toISOString().slice(0,10);
    const hoje = all.filter(m => m.data === ymd);
    const total = hoje.length;
    const adi = hoje.filter(m => m.classe==='ADIANTADO').length;
    const pon = hoje.filter(m => m.classe==='PONTUAL').length;
    const atr = hoje.filter(m => m.classe==='ATRASADO').length;
    const pen = hoje.filter(m => m.classe==='PENDENTE').length;
    const pctAdi = total ? Math.round(adi/total*100) : 0;
    els.resumoDia.innerHTML = `
      <div class="kpi"><div class="v">${total}</div><div class="l">Total hoje</div></div>
      <div class="kpi adiant"><div class="v">${adi}</div><div class="l">Adiantados</div></div>
      <div class="kpi pont"><div class="v">${pon}</div><div class="l">Pontuais</div></div>
      <div class="kpi atras"><div class="v">${atr}</div><div class="l">Atrasados</div></div>
      <div class="kpi"><div class="v">${pctAdi}%</div><div class="l">% Adiant.</div></div>
      <div class="kpi"><div class="v">${pen}</div><div class="l">Pendentes</div></div>
    `;
  }

  function renderTabelaDiaria(filt){
    // agrupa por data
    const por = {};
    filt.forEach(m => {
      por[m.data] = por[m.data] || { total:0, adi:0, pon:0, atr:0, pen:0 };
      por[m.data].total++;
      if (m.classe==='ADIANTADO') por[m.data].adi++;
      else if (m.classe==='PONTUAL') por[m.data].pon++;
      else if (m.classe==='ATRASADO') por[m.data].atr++;
      else por[m.data].pen++;
    });
    const datas = Object.keys(por).sort().reverse();
    if (!datas.length){
      els.tabDiariaBody.innerHTML = `<tr><td colspan="6" class="muted small">Sem registros no período.</td></tr>`;
      return;
    }
    els.tabDiariaBody.innerHTML = datas.map(d => {
      const x = por[d];
      const den = x.total - x.pen; // % calculado sobre os classificados
      const pct = den ? Math.round(x.adi/den*100) : 0;
      const cls = pct>=30 ? 'bad' : (pct>=15 ? 'warn' : 'ok');
      return `<tr>
        <td>${formatDateBR(d)}</td>
        <td class="num">${x.total}</td>
        <td class="num">${x.adi}</td>
        <td class="num">${x.pon}</td>
        <td class="num">${x.atr}</td>
        <td class="num pct ${cls}">${pct}%</td>
      </tr>`;
    }).join('');
  }

  function renderParetoLinhas(filt){
    const adis = filt.filter(m => m.classe==='ADIANTADO');
    if (!adis.length){
      els.paretoLinhas.innerHTML = `<div class="muted small">Sem adiantamentos no período.</div>`;
      return;
    }
    const por = {};
    adis.forEach(m => { por[m.linha] = (por[m.linha]||0) + 1; });
    const arr = Object.entries(por).map(([linha,qtd]) => ({linha, qtd}))
      .sort((a,b)=>b.qtd-a.qtd).slice(0, 10);
    const max = arr[0].qtd;
    els.paretoLinhas.innerHTML = arr.map(r => `
      <div class="bar-row">
        <div class="lbl">${r.linha}</div>
        <div class="bar"><span style="width:${(r.qtd/max*100).toFixed(1)}%"></span></div>
        <div class="qty">${r.qtd}</div>
      </div>
    `).join('');
  }

  function renderRankingTabelas(filt){
    const por = {};
    filt.forEach(m => {
      if (m.classe === 'PENDENTE') return; // fora do ranking até classificar
      const k = m.linha + '|' + m.tabela;
      por[k] = por[k] || { linha:m.linha, tabela:m.tabela, total:0, adi:0, somaDesvio:0, ult:0 };
      por[k].total++;
      if (m.classe==='ADIANTADO') por[k].adi++;
      if (m.desvioMin !== null) por[k].somaDesvio += m.desvioMin;
      if (m.ts > por[k].ult) por[k].ult = m.ts;
    });
    let arr = Object.values(por);
    // Ordenar por adiantamentos absolutos (decisão consciente)
    arr.sort((a,b) => b.adi - a.adi || b.total - a.total);
    if (!arr.length){
      els.rankingTabelasBody.innerHTML = `<tr><td colspan="8" class="muted small">Sem dados classificados no período.</td></tr>`;
      return;
    }
    els.rankingTabelasBody.innerHTML = arr.map((r,i) => {
      const pct = r.total ? Math.round(r.adi/r.total*100) : 0;
      const cls = pct>=30 ? 'bad' : (pct>=15 ? 'warn' : 'ok');
      const desvioMedio = r.total ? Math.round(r.somaDesvio/r.total) : 0;
      return `<tr>
        <td>${i+1}</td>
        <td>${r.linha}</td>
        <td><strong>${r.tabela}</strong></td>
        <td class="num">${r.total}</td>
        <td class="num">${r.adi}</td>
        <td class="num pct ${cls}">${pct}%</td>
        <td class="num">${C().fmtDesvio(desvioMedio)}</td>
        <td class="muted small">${formatDateTimeBR(r.ult)}</td>
      </tr>`;
    }).join('');
  }

  function renderPendentes(all){
    const pen = all.filter(m => m.classe === 'PENDENTE');
    if (!pen.length){
      els.pendentes.innerHTML = `<div class="muted small">Nenhum registro pendente. </div>`;
      return;
    }
    const por = {};
    pen.forEach(m => {
      const k = m.linha + '|' + m.tabela;
      por[k] = por[k] || { linha:m.linha, tabela:m.tabela, qtd:0 };
      por[k].qtd++;
    });
    els.pendentes.innerHTML = Object.values(por).map(r => `
      <div class="pend-item">
        <div>Linha <strong>${r.linha}</strong> · Tabela <strong>${r.tabela}</strong></div>
        <div class="muted">${r.qtd} marcaç${r.qtd===1?'ão':'ões'}</div>
      </div>
    `).join('');
  }

  function formatDateBR(ymd){
    const [y,m,d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }
  function formatDateTimeBR(ts){
    if (!ts) return '—';
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.historico = { init, refresh };
})(window);
