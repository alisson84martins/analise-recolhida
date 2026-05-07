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
    els.graficoData = document.getElementById('historico-grafico-data');
    els.graficoCanvas = document.getElementById('historico-grafico-hora');
    els.graficoMeta = document.getElementById('historico-grafico-meta');
    els.btnGraficoEnviar = document.getElementById('btn-historico-grafico-enviar');

    if (els.graficoData) els.graficoData.value = ymdLocal(new Date());

    els.filtroPeriodo.addEventListener('change', refresh);
    if (els.graficoData) els.graficoData.addEventListener('change', refresh);
    if (els.btnGraficoEnviar) els.btnGraficoEnviar.addEventListener('click', enviarGrafico);
    window.addEventListener('resize', () => renderGraficoHora(S().getMarcacoes()));
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
    renderGraficoHora(all);
  }

  function ymdLocal(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function horaToIndex(hhmm){
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return -1;
    const h = parseInt(hhmm.slice(0,2), 10);
    return Number.isFinite(h) && h >= 0 && h <= 23 ? h : -1;
  }

  function calcularComparativoHora(all, ymd){
    const real = Array(24).fill(0);
    const previsto = Array(24).fill(0);

    all.filter(m => m.data === ymd).forEach(m => {
      const h = horaToIndex(m.hora);
      if (h >= 0) real[h]++;
    });

    S().getTabelas().forEach(t => {
      const h = horaToIndex(t.horaPrevista);
      if (h >= 0) previsto[h]++;
    });

    return { real, previsto };
  }

  function renderGraficoHora(all){
    if (!els.graficoCanvas || !els.graficoMeta) return;
    const ymd = (els.graficoData && els.graficoData.value) || ymdLocal(new Date());
    const { real, previsto } = calcularComparativoHora(all, ymd);

    const totalReal = real.reduce((s,v) => s + v, 0);
    const totalPrevisto = previsto.reduce((s,v) => s + v, 0);
    const diff = totalReal - totalPrevisto;
    const sinal = diff > 0 ? '+' : '';
    els.graficoMeta.textContent = `Data ${formatDateBR(ymd)} · Real: ${totalReal} · Previsto: ${totalPrevisto} · Diferença: ${sinal}${diff}`;

    drawGraficoComparativo(els.graficoCanvas, real, previsto);
  }

  function drawGraficoComparativo(canvas, real, previsto){
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(640, canvas.clientWidth || 640);
    const cssH = 320;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);

    const w = cssW;
    const h = cssH;
    const pad = { top: 28, right: 20, bottom: 40, left: 36 };
    const gw = w - pad.left - pad.right;
    const gh = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1d272e';
    ctx.fillRect(0, 0, w, h);

    const maxV = Math.max(1, ...real, ...previsto);
    const groupW = gw / 24;
    const barW = Math.max(2, Math.min(10, groupW * 0.34));

    ctx.strokeStyle = 'rgba(152,164,173,0.25)';
    ctx.lineWidth = 1;
    for (let i=0; i<=4; i++){
      const y = pad.top + (gh * i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#98a4ad';
    ctx.font = '11px Segoe UI';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i=0; i<=4; i++){
      const val = Math.round(maxV - (maxV * i / 4));
      const y = pad.top + (gh * i / 4);
      ctx.fillText(String(val), pad.left - 6, y);
    }

    for (let hIdx=0; hIdx<24; hIdx++){
      const cx = pad.left + hIdx*groupW + groupW/2;
      const vPrev = previsto[hIdx];
      const vReal = real[hIdx];
      const hp = gh * (vPrev / maxV);
      const hr = gh * (vReal / maxV);

      ctx.fillStyle = '#6aaad4';
      ctx.fillRect(cx - barW - 1, pad.top + gh - hp, barW, hp);

      ctx.fillStyle = '#1f8a4c';
      ctx.fillRect(cx + 1, pad.top + gh - hr, barW, hr);
    }

    ctx.fillStyle = '#98a4ad';
    ctx.font = '10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let hIdx=0; hIdx<24; hIdx+=2){
      const x = pad.left + hIdx*groupW + groupW/2;
      ctx.fillText(String(hIdx).padStart(2,'0'), x, h - pad.bottom + 8);
    }

    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6aaad4';
    ctx.fillRect(pad.left, 10, 12, 12);
    ctx.fillStyle = '#f4f6f7';
    ctx.fillText('Previsto (tabelas)', pad.left + 18, 16);
    ctx.fillStyle = '#1f8a4c';
    ctx.fillRect(pad.left + 150, 10, 12, 12);
    ctx.fillStyle = '#f4f6f7';
    ctx.fillText('Real (marcacoes)', pad.left + 168, 16);
  }

  async function enviarGrafico(){
    if (!els.graficoCanvas) return;
    const ymd = (els.graficoData && els.graficoData.value) || ymdLocal(new Date());
    const nome = `recolhidas_por_hora_${ymd}.png`;

    const blob = await new Promise(resolve => els.graficoCanvas.toBlob(resolve, 'image/png'));
    if (!blob){ Recolhida.toast('Falha ao gerar o grafico', 'err'); return; }

    const { real, previsto } = calcularComparativoHora(S().getMarcacoes(), ymd);
    const totalReal = real.reduce((s,v) => s + v, 0);
    const totalPrevisto = previsto.reduce((s,v) => s + v, 0);
    const texto = `Recolhidas por hora (${formatDateBR(ymd)}) - Real: ${totalReal} | Previsto: ${totalPrevisto}`;

    try {
      if (navigator.share && typeof File !== 'undefined'){
        const file = new File([blob], nome, { type: 'image/png' });
        if (!navigator.canShare || navigator.canShare({ files:[file] })){
          await navigator.share({
            title: `Grafico recolhidas por hora - ${ymd}`,
            text: texto,
            files: [file]
          });
          Recolhida.toast('Grafico enviado');
          return;
        }
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }

    Recolhida.dl.blob(blob, nome);
    Recolhida.toast('Compartilhamento indisponivel, arquivo baixado', 'warn');
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
      els.pendentes.innerHTML = `<div class="muted small">Nenhum registro pendente.</div>`;
      return;
    }
    const por = {};
    pen.forEach(m => {
      const tabKey = m.tabela || '';
      const k = m.linha + '|' + tabKey;
      por[k] = por[k] || { linha:m.linha, tabela:tabKey, qtd:0, ids:[] };
      por[k].qtd++;
      por[k].ids.push(m.id);
    });
    // Ordena: sem tabela primeiro (mais urgentes), depois por quantidade
    const grupos = Object.values(por).sort((a,b) =>
      (a.tabela ? 1 : 0) - (b.tabela ? 1 : 0) || b.qtd - a.qtd
    );
    // Gera datalist com linhas cadastradas
    const linhasDisp = S().getLinhas().map(l => l.codigo).join('|');
    const dataListId = 'pendentes-linhas-list';
    const dataListHTML = `<datalist id="${dataListId}">${S().getLinhas().map(l => `<option value="${l.codigo}">`).join('')}</datalist>`;
    
    els.pendentes.innerHTML = dataListHTML + grupos.map((r, i) => {
      const tabLabel = r.tabela ? `Tabela <strong>${r.tabela}</strong>` : `<em class="muted">sem tabela</em>`;
      return `
      <div class="pend-item">
        <div>Linha <strong>${r.linha}</strong> · ${tabLabel} · <span class="muted">${r.qtd} marcaç${r.qtd===1?'ão':'ões'}</span></div>
        <div class="pend-action">
          <input type="text" inputmode="text" autocomplete="off"
                 list="${dataListId}"
                 placeholder="Nova linha (ex: 119 C)"
                 data-pend-idx="${i}" />
          <button class="primary small" data-pend-apply="${i}">Corrigir linha</button>
          <button class="warn small" data-pend-delete="${i}">Excluir</button>
        </div>
      </div>`;
    }).join('');

    els.pendentes.querySelectorAll('button[data-pend-apply]').forEach(b => {
      b.addEventListener('click', () => {
        const i = +b.dataset.pendApply;
        const grupo = grupos[i];
        const inp = els.pendentes.querySelector(`input[data-pend-idx="${i}"]`);
        const novaLinha = (inp.value || '').trim();
        if (!novaLinha){ Recolhida.toast('Digite a nova linha', 'err'); inp.focus(); return; }
        
        // Valida se a linha está cadastrada
        const linhaEncontrada = S().findLinha(novaLinha);
        if (!linhaEncontrada){
          Recolhida.toast(`Linha "${novaLinha}" não está cadastrada. Cadastre primeiro em Cadastros.`, 'err');
          inp.focus();
          return;
        }
        
        let n = 0;
        grupo.ids.forEach(id => {
          if (S().updateMarcacao(id, { linha: novaLinha })) n++;
        });
        const t = grupo.tabela ? S().findTabela(novaLinha, grupo.tabela) : null;
        if (t){
          Recolhida.toast(`${n} marcaç${n>1?'ões':'ão'} corrigida${n>1?'s':''} para linha ${novaLinha} (T${grupo.tabela} → ${t.horaPrevista})`);
        } else {
          Recolhida.toast(`${n} marcaç${n>1?'ões':'ão'} corrigida${n>1?'s':''} para linha ${novaLinha} · sem tabela cadastrada para reclassificar`, 'warn');
        }
        refresh();
      });
    });

    els.pendentes.querySelectorAll('button[data-pend-delete]').forEach(b => {
      b.addEventListener('click', () => {
        const i = +b.dataset.pendDelete;
        const grupo = grupos[i];
        if (!confirm(`Excluir ${grupo.qtd} marcaç${grupo.qtd===1?'ão':'ões'} pendente${grupo.qtd===1?'':'s'} de Linha ${grupo.linha}${grupo.tabela ? ` / Tabela ${grupo.tabela}` : ''}?`)) return;
        grupo.ids.forEach(id => S().deleteMarcacao(id));
        Recolhida.toast('Marcaçã' + (grupo.qtd > 1 ? 'ões' : 'ão') + ' pendente' + (grupo.qtd > 1 ? 's' : '') + ' excluída' + (grupo.qtd > 1 ? 's' : ''), 'warn');
        refresh();
      });
    });
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
