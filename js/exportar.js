/* exportar.js — geração de .xlsx com SheetJS (offline) */
(function (global) {
  const S = () => Recolhida.storage;
  const C = () => Recolhida.classify;

  function init(){
    document.getElementById('data-exportar-dia').value = new Date().toISOString().slice(0,10);
    const hoje = new Date();
    const ini = new Date(hoje.getTime() - 6*86400000);
    document.getElementById('data-exportar-ini').value = ini.toISOString().slice(0,10);
    document.getElementById('data-exportar-fim').value = hoje.toISOString().slice(0,10);

    document.getElementById('btn-export-dia').addEventListener('click', exportDia);
    document.getElementById('btn-export-semana').addEventListener('click', exportSemana);
    document.getElementById('btn-backup-json').addEventListener('click', backupJson);
    document.getElementById('file-restore-json').addEventListener('change', restoreJson);

    document.getElementById('btn-limpar-dia').addEventListener('click', limparDia);
    document.getElementById('btn-limpar-tudo').addEventListener('click', limparTudo);
  }

  function exportDia(){
    const ymd = document.getElementById('data-exportar-dia').value;
    if (!ymd){ Recolhida.toast('Escolha a data', 'err'); return; }
    const arr = S().getMarcacoes().filter(m => m.data === ymd);
    if (!arr.length){ Recolhida.toast('Sem marcações nesse dia', 'warn'); return; }

    const wb = XLSX.utils.book_new();

    // Aba Registros
    const cab = ['Data','Hora real','Linha','Tabela','Carro','Hora prevista','Desvio (min)','Classe'];
    const dados = arr.map(m => {
      const t = S().findTabela(m.linha, m.tabela);
      return [
        m.data, m.hora, m.linha, m.tabela, m.carro,
        t ? t.horaPrevista : '',
        m.desvioMin === null ? '' : m.desvioMin,
        m.classe
      ];
    });
    const ws1 = XLSX.utils.aoa_to_sheet([cab, ...dados]);
    ws1['!cols'] = [{wch:12},{wch:10},{wch:10},{wch:10},{wch:10},{wch:14},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Registros');

    // Aba Resumo
    const total = arr.length;
    const adi = arr.filter(m => m.classe==='ADIANTADO').length;
    const pon = arr.filter(m => m.classe==='PONTUAL').length;
    const atr = arr.filter(m => m.classe==='ATRASADO').length;
    const pen = arr.filter(m => m.classe==='PENDENTE').length;
    const den = total - pen;
    const pctAdi = den ? (adi/den*100).toFixed(1) : '0.0';
    const pctPon = den ? (pon/den*100).toFixed(1) : '0.0';
    const pctAtr = den ? (atr/den*100).toFixed(1) : '0.0';

    const resumo = [
      ['Análise de Recolhida — Resumo do dia'],
      ['Data', ymd],
      ['Total registros', total],
      ['Pendentes (sem cadastro)', pen],
      [],
      ['Classe','Quantidade','% sobre classificados'],
      ['ADIANTADO', adi, pctAdi+'%'],
      ['PONTUAL', pon, pctPon+'%'],
      ['ATRASADO', atr, pctAtr+'%'],
      [],
      ['Veredito (hipótese >30% confirma; 15-30% sugere; <15% gargalo é outro)'],
      [
        pctAdi>=30 ? 'CONFIRMADO: adiantamento é gargalo dominante'
        : (pctAdi>=15 ? 'SUGERE adiantamento como contribuição relevante' : 'Adiantamento NÃO é o gargalo principal')
      ]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(resumo);
    ws2['!cols'] = [{wch:30},{wch:18},{wch:24}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

    // Aba Pareto por linha
    const por = {};
    arr.filter(m => m.classe==='ADIANTADO').forEach(m => por[m.linha] = (por[m.linha]||0)+1);
    const pareto = Object.entries(por).map(([l,q])=>({l,q})).sort((a,b)=>b.q-a.q);
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Linha','Adiantamentos','% acumulado'],
      ...(function(){
        const total = pareto.reduce((s,x)=>s+x.q,0) || 1;
        let acc = 0;
        return pareto.map(x => {
          acc += x.q;
          return [x.l, x.q, (acc/total*100).toFixed(1)+'%'];
        });
      })()
    ]);
    ws3['!cols'] = [{wch:14},{wch:18},{wch:16}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Pareto_Linhas');

    XLSX.writeFile(wb, `recolhida_${ymd}.xlsx`);
    Recolhida.toast('Excel do dia exportado');
  }

  function exportSemana(){
    const ini = document.getElementById('data-exportar-ini').value;
    const fim = document.getElementById('data-exportar-fim').value;
    if (!ini || !fim){ Recolhida.toast('Escolha o intervalo','err'); return; }
    const arr = S().getMarcacoes()
      .filter(m => m.data >= ini && m.data <= fim)
      .sort((a,b)=> a.ts-b.ts);

    if (!arr.length){ Recolhida.toast('Sem marcações no período','warn'); return; }

    const wb = XLSX.utils.book_new();

    // Aba COLETA_REAL — formato compatível com a planilha mestre Recolhida_Frota_Analise.xlsx
    // Colunas previstas: Data | Carro | Linha | Tabela | Hora_Real | Hora_Prevista | Desvio_Min | Classe
    const cab = ['Data','Carro','Linha','Tabela','Hora_Real','Hora_Prevista','Desvio_Min','Classe'];
    const linhas = arr.map(m => {
      const t = S().findTabela(m.linha, m.tabela);
      return [
        m.data, m.carro, m.linha, m.tabela, m.hora,
        t ? t.horaPrevista : '',
        m.desvioMin === null ? '' : m.desvioMin,
        m.classe
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([cab, ...linhas]);
    ws['!cols'] = [{wch:12},{wch:10},{wch:10},{wch:10},{wch:10},{wch:14},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'COLETA_REAL');

    // Aba diagnóstico do período
    const total = arr.length;
    const adi = arr.filter(m => m.classe==='ADIANTADO').length;
    const pon = arr.filter(m => m.classe==='PONTUAL').length;
    const atr = arr.filter(m => m.classe==='ATRASADO').length;
    const pen = arr.filter(m => m.classe==='PENDENTE').length;
    const den = total - pen;
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Período', `${ini} → ${fim}`],
      ['Total', total],
      ['Pendentes', pen],
      ['Adiantados', adi, den ? (adi/den*100).toFixed(1)+'%' : ''],
      ['Pontuais', pon, den ? (pon/den*100).toFixed(1)+'%' : ''],
      ['Atrasados', atr, den ? (atr/den*100).toFixed(1)+'%' : '']
    ]);
    ws2['!cols'] = [{wch:18},{wch:14},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

    XLSX.writeFile(wb, `recolhida_semana_${ini}_a_${fim}.xlsx`);
    Recolhida.toast('Semana consolidada exportada');
  }

  function backupJson(){
    const obj = S().exportAll();
    Recolhida.dl.json(obj, `recolhida_backup_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`);
  }
  function restoreJson(e){
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        const modo = confirm('Confirmar restauração:\n\nOK = SUBSTITUIR todos os dados atuais\nCancelar = MESCLAR (preservar atuais)') ? 'replace' : 'merge';
        S().importAll(obj, modo);
        Recolhida.toast('Backup restaurado ('+modo+')');
        if (Recolhida.cadastros) Recolhida.cadastros.refresh();
        if (Recolhida.historico) Recolhida.historico.refresh();
        if (Recolhida.marcacao) Recolhida.marcacao.refresh();
      } catch(err){ Recolhida.toast('JSON inválido: '+err.message,'err'); }
    };
    r.readAsText(f);
    e.target.value = '';
  }

  function limparDia(){
    const ymd = new Date().toISOString().slice(0,10);
    if (!confirm(`Apagar todas as marcações de ${ymd}? Esta ação não tem como ser desfeita.`)) return;
    S().deleteMarcacoesDoDia(ymd);
    Recolhida.toast('Marcações do dia apagadas','warn');
    if (Recolhida.historico) Recolhida.historico.refresh();
    if (Recolhida.marcacao) Recolhida.marcacao.refresh();
  }
  function limparTudo(){
    if (!confirm('APAGAR TUDO?\nMarcações + linhas + tabelas + carros.\nNão tem como desfazer.')) return;
    if (!confirm('Tem certeza? Considere fazer um backup JSON antes.')) return;
    S().clearAll();
    Recolhida.toast('Tudo apagado','warn');
    if (Recolhida.cadastros) Recolhida.cadastros.refresh();
    if (Recolhida.historico) Recolhida.historico.refresh();
    if (Recolhida.marcacao) Recolhida.marcacao.refresh();
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.exportar = { init };
})(window);
