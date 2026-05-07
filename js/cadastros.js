/* cadastros.js — gerência das Linhas e Tabelas+HoraPrevista */
(function (global) {
  const S = () => Recolhida.storage;
  const els = {};

  function init(){
    els.cadLinha = document.getElementById('cad-linha');
    els.cadLinhaNome = document.getElementById('cad-linha-nome');
    els.btnCadLinha = document.getElementById('btn-cad-linha');
    els.tabLinhas = document.querySelector('#tab-linhas tbody');

    els.cadTabLinha = document.getElementById('cad-tab-linha');
    els.cadTabNum = document.getElementById('cad-tab-num');
    els.cadTabHora = document.getElementById('cad-tab-hora');
    els.btnCadTab = document.getElementById('btn-cad-tab');
    els.tabTabelas = document.querySelector('#tab-tabelas tbody');

    els.btnExportMaster = document.getElementById('btn-export-master');
    els.fileImportMaster = document.getElementById('file-import-master');

    els.btnCadLinha.addEventListener('click', onAddLinha);
    els.btnCadTab.addEventListener('click', onAddTabela);
    els.btnExportMaster.addEventListener('click', onExportMaster);
    els.fileImportMaster.addEventListener('change', onImportMaster);

    els.cadLinha.addEventListener('keydown', e => { if (e.key==='Enter') onAddLinha(); });
    els.cadTabHora.addEventListener('keydown', e => { if (e.key==='Enter') onAddTabela(); });

    refresh();
  }

  function onAddLinha(){
    const cod = els.cadLinha.value.trim();
    const nome = els.cadLinhaNome.value.trim();
    if (!cod){ Recolhida.toast('Informe o código da linha', 'err'); return; }
    if (!S().addLinha(cod, nome)){
      Recolhida.toast('Linha já cadastrada', 'warn');
      return;
    }
    els.cadLinha.value=''; els.cadLinhaNome.value='';
    Recolhida.toast('Linha adicionada');
    refresh();
  }

  function onAddTabela(){
    const linha = els.cadTabLinha.value;
    const tab = els.cadTabNum.value.trim();
    const hora = els.cadTabHora.value;
    if (!linha){ Recolhida.toast('Selecione a linha', 'err'); return; }
    if (!tab){ Recolhida.toast('Informe a tabela', 'err'); return; }
    if (!hora){ Recolhida.toast('Informe a hora prevista', 'err'); return; }
    if (!S().addTabela(linha, tab, hora)){
      Recolhida.toast('Não foi possível salvar', 'err');
      return;
    }
    const recalculadas = S().recalcPendentes();
    if (recalculadas) Recolhida.toast(`Tabela salva · ${recalculadas} pendentes recalculadas`);
    else Recolhida.toast('Tabela salva');
    els.cadTabNum.value = ''; els.cadTabHora.value = '';
    refresh();
    if (Recolhida.historico) Recolhida.historico.refresh();
    if (Recolhida.marcacao) Recolhida.marcacao.refresh();
  }

  function onExportMaster(){
    const obj = S().exportMaster();
    Recolhida.dl.json(obj, `recolhida-mestre_${new Date().toISOString().slice(0,10)}.json`);
  }

  function onImportMaster(e){
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        let texto = String(r.result || '').trim();
        // Remove BOM se presente
        if (texto.charCodeAt(0) === 0xFEFF) {
          texto = texto.slice(1);
        }
        const obj = JSON.parse(texto);
        S().importMaster(obj);
        Recolhida.toast('Mestre importado');
        refresh();
        if (Recolhida.historico) Recolhida.historico.refresh();
        if (Recolhida.marcacao) Recolhida.marcacao.refresh();
      } catch(err){ 
        console.error('Erro ao importar mestre:', err);
        Recolhida.toast('JSON inválido: '+err.message, 'err'); 
      }
    };
    r.onerror = () => {
      Recolhida.toast('Falha ao ler arquivo', 'err');
    };
    r.readAsText(f);
    e.target.value = '';
  }

  function refresh(){
    const linhas = S().getLinhas();
    els.tabLinhas.innerHTML = linhas.map(l => `
      <tr>
        <td><strong>${l.codigo}</strong></td>
        <td>${l.nome||''}</td>
        <td><button class="ghost-btn small" data-rm="${l.codigo}">Excluir</button></td>
      </tr>
    `).join('') || `<tr><td colspan="3" class="muted small">Nenhuma linha cadastrada.</td></tr>`;
    els.tabLinhas.querySelectorAll('button[data-rm]').forEach(b =>
      b.addEventListener('click', () => {
        if (!confirm(`Excluir linha ${b.dataset.rm} e suas tabelas?`)) return;
        S().removeLinha(b.dataset.rm);
        refresh();
      })
    );

    els.cadTabLinha.innerHTML = '<option value="">Linha…</option>' +
      linhas.map(l => `<option value="${l.codigo}">${l.codigo}${l.nome?' — '+l.nome:''}</option>`).join('');

    const tabs = S().getTabelas();
    els.tabTabelas.innerHTML = tabs.map(t => `
      <tr>
        <td>${t.linha}</td>
        <td><strong>${t.tabela}</strong></td>
        <td>${t.horaPrevista}</td>
        <td><button class="ghost-btn small" data-rm-l="${t.linha}" data-rm-t="${t.tabela}">Excluir</button></td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="muted small">Nenhuma tabela cadastrada.</td></tr>`;
    els.tabTabelas.querySelectorAll('button[data-rm-l]').forEach(b =>
      b.addEventListener('click', () => {
        S().removeTabela(b.dataset.rmL, b.dataset.rmT);
        refresh();
      })
    );
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.cadastros = { init, refresh };
})(window);
