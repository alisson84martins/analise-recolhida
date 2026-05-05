/* ============================================================
 * storage.js — camada de dados (localStorage prefixo "recolhida_")
 * Modelos:
 *   - linhas:    { codigo: 'CODIGO', nome: 'opcional' }
 *   - tabelas:   { linha:'CODIGO', tabela:'NUM', horaPrevista:'HH:MM' }   chave: linha+tabela
 *   - marcacoes: { id, ts(ms), data 'YYYY-MM-DD', hora 'HH:MM',
 *                  linha, tabela, carro,
 *                  desvioMin (null se pendente), classe ('ADIANTADO'|'PONTUAL'|'ATRASADO'|'PENDENTE') }
 *   - carros:    Set por uso (autocomplete)
 * ============================================================ */
(function (global) {
  const PREFIX = 'recolhida_';
  const K = {
    LINHAS:    PREFIX + 'linhas',
    TABELAS:   PREFIX + 'tabelas',
    MARCACOES: PREFIX + 'marcacoes',
    CARROS:    PREFIX + 'carros',
    META:      PREFIX + 'meta'
  };

  const TOL_MIN = 5; // ±5 min, padrão do projeto

  function _get(key, def){
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch(e){ return def; }
  }
  function _set(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

  // -------- LINHAS --------
  function getLinhas(){ return _get(K.LINHAS, []); }
  function addLinha(codigo, nome){
    codigo = (codigo||'').trim();
    if (!codigo) return false;
    const arr = getLinhas();
    if (arr.find(l => l.codigo.toLowerCase() === codigo.toLowerCase())) return false;
    arr.push({ codigo, nome: (nome||'').trim() });
    arr.sort((a,b) => a.codigo.localeCompare(b.codigo, 'pt-BR', {numeric:true}));
    _set(K.LINHAS, arr);
    return true;
  }
  function removeLinha(codigo){
    _set(K.LINHAS, getLinhas().filter(l => l.codigo !== codigo));
    // Também remove tabelas associadas
    _set(K.TABELAS, getTabelas().filter(t => t.linha !== codigo));
  }
  function findLinha(codigo){
    if (!codigo) return null;
    return getLinhas().find(l => l.codigo.toLowerCase() === codigo.toLowerCase()) || null;
  }
  // Aceita prefixo numérico/alfa: "27" casa "271", "271f", etc.
  function suggestLinhas(prefixo, limit){
    prefixo = (prefixo||'').toLowerCase();
    if (!prefixo) return getLinhas().slice(0, limit||8);
    return getLinhas()
      .filter(l => l.codigo.toLowerCase().startsWith(prefixo))
      .slice(0, limit||8);
  }

  // -------- TABELAS (Linha + Tabela + HoraPrevista) --------
  function getTabelas(){ return _get(K.TABELAS, []); }
  function addTabela(linha, tabela, horaPrevista){
    linha = (linha||'').trim();
    tabela = (tabela||'').trim();
    horaPrevista = (horaPrevista||'').trim(); // HH:MM
    if (!linha || !tabela || !/^\d{2}:\d{2}$/.test(horaPrevista)) return false;
    const arr = getTabelas();
    const i = arr.findIndex(t => t.linha === linha && t.tabela === tabela);
    if (i >= 0) arr[i].horaPrevista = horaPrevista;
    else arr.push({ linha, tabela, horaPrevista });
    arr.sort((a,b) => a.linha.localeCompare(b.linha, 'pt-BR', {numeric:true})
                   || a.tabela.localeCompare(b.tabela, 'pt-BR', {numeric:true}));
    _set(K.TABELAS, arr);
    return true;
  }
  function removeTabela(linha, tabela){
    _set(K.TABELAS, getTabelas().filter(t => !(t.linha===linha && t.tabela===tabela)));
  }
  function findTabela(linha, tabela){
    if (!linha || !tabela) return null;
    return getTabelas().find(t =>
      t.linha.toLowerCase()===String(linha).toLowerCase() &&
      t.tabela===String(tabela)) || null;
  }
  function suggestTabelasParaLinha(linha, prefixo, limit){
    if (!linha) return [];
    prefixo = (prefixo||'');
    return getTabelas()
      .filter(t => t.linha.toLowerCase()===linha.toLowerCase()
                   && t.tabela.startsWith(prefixo))
      .slice(0, limit||10);
  }

  // -------- CARROS (autocomplete por uso) --------
  function getCarros(){ return _get(K.CARROS, []); }
  function rememberCarro(c){
    c = (c||'').trim();
    if (!c) return;
    const arr = getCarros();
    if (!arr.includes(c)){
      arr.push(c);
      arr.sort((a,b) => a.localeCompare(b, 'pt-BR', {numeric:true}));
      _set(K.CARROS, arr);
    }
  }
  function suggestCarros(prefixo, limit){
    prefixo = (prefixo||'');
    if (!prefixo) return [];
    return getCarros().filter(c => c.startsWith(prefixo)).slice(0, limit||6);
  }

  // -------- MARCAÇÕES --------
  function getMarcacoes(){ return _get(K.MARCACOES, []); }
  function _saveMarcacoes(arr){ _set(K.MARCACOES, arr); }

  // ymd em horário LOCAL (evita virada de UTC em turnos noturnos)
  function _ymdLocal(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Aceita ts opcional (lançamento retroativo) e tabela vazia (PENDENTE)
  function novaMarcacao({ linha, tabela, carro, ts, manual }){
    const tsUsed = ts || Date.now();
    const d  = new Date(tsUsed);
    const ymd = _ymdLocal(d);
    const hh  = String(d.getHours()).padStart(2,'0');
    const mm  = String(d.getMinutes()).padStart(2,'0');
    const reg = {
      id: 'm_' + tsUsed + '_' + Math.random().toString(36).slice(2,7),
      ts: tsUsed, data: ymd, hora: hh+':'+mm,
      linha:  String(linha ||'').trim(),
      tabela: String(tabela||'').trim(),
      carro:  String(carro ||'').trim(),
      desvioMin: null,
      classe: 'PENDENTE',
      manual: !!manual
    };
    if (reg.tabela){
      const tab = findTabela(reg.linha, reg.tabela);
      if (tab){
        reg.desvioMin = Recolhida.classify.diffMin(reg.hora, tab.horaPrevista);
        reg.classe    = Recolhida.classify.classe(reg.desvioMin);
      }
    }
    const arr = getMarcacoes();
    arr.push(reg);
    _saveMarcacoes(arr);
    rememberCarro(reg.carro);
    return reg;
  }

  // Atualiza tabela em lote de marcações (linha + tabela antiga, possivelmente vazia)
  // Recalcula classificação automaticamente.
  function updateTabelaEmMarcacoes(linha, tabelaAntiga, novaTabela){
    novaTabela = (novaTabela||'').trim();
    const arr = getMarcacoes();
    let n = 0;
    for (const m of arr){
      if (m.linha === linha && (m.tabela||'') === (tabelaAntiga||'')){
        m.tabela = novaTabela;
        // tenta reclassificar
        const t = novaTabela ? findTabela(m.linha, m.tabela) : null;
        if (t){
          m.desvioMin = Recolhida.classify.diffMin(m.hora, t.horaPrevista);
          m.classe    = Recolhida.classify.classe(m.desvioMin);
        } else {
          m.desvioMin = null;
          m.classe    = 'PENDENTE';
        }
        n++;
      }
    }
    if (n) _saveMarcacoes(arr);
    return n;
  }

  // Atualiza UMA marcação específica pelo id
  function updateMarcacao(id, patch){
    const arr = getMarcacoes();
    const m = arr.find(x => x.id === id);
    if (!m) return false;
    Object.assign(m, patch);
    if (m.tabela){
      const t = findTabela(m.linha, m.tabela);
      if (t){
        m.desvioMin = Recolhida.classify.diffMin(m.hora, t.horaPrevista);
        m.classe    = Recolhida.classify.classe(m.desvioMin);
      } else {
        m.desvioMin = null; m.classe = 'PENDENTE';
      }
    } else {
      m.desvioMin = null; m.classe = 'PENDENTE';
    }
    _saveMarcacoes(arr);
    return true;
  }

  function deleteMarcacao(id){
    _saveMarcacoes(getMarcacoes().filter(m => m.id !== id));
  }
  function deleteMarcacoesDoDia(ymd){
    _saveMarcacoes(getMarcacoes().filter(m => m.data !== ymd));
  }
  function clearAll(){
    [K.LINHAS, K.TABELAS, K.MARCACOES, K.CARROS, K.META].forEach(k => localStorage.removeItem(k));
  }

  // Recalcula classe/desvio das marcações pendentes após cadastro de mestre.
  function recalcPendentes(){
    const arr = getMarcacoes();
    let mudou = 0;
    for (const m of arr){
      if (m.classe === 'PENDENTE' || m.desvioMin === null){
        const t = findTabela(m.linha, m.tabela);
        if (t){
          m.desvioMin = Recolhida.classify.diffMin(m.hora, t.horaPrevista);
          m.classe    = Recolhida.classify.classe(m.desvioMin);
          mudou++;
        }
      }
    }
    if (mudou) _saveMarcacoes(arr);
    return mudou;
  }

  // -------- BACKUP / RESTORE --------
  function exportAll(){
    return {
      __schema: 'recolhida-sambaiba',
      __version: 1,
      __exportedAt: new Date().toISOString(),
      linhas: getLinhas(),
      tabelas: getTabelas(),
      carros: getCarros(),
      marcacoes: getMarcacoes()
    };
  }
  function importAll(obj, mode){
    if (!obj || obj.__schema !== 'recolhida-sambaiba') throw new Error('Arquivo inválido');
    if (mode === 'replace'){
      _set(K.LINHAS, obj.linhas||[]);
      _set(K.TABELAS, obj.tabelas||[]);
      _set(K.CARROS, obj.carros||[]);
      _set(K.MARCACOES, obj.marcacoes||[]);
    } else { // merge
      const linhas = getLinhas();
      (obj.linhas||[]).forEach(l => { if (!linhas.find(x=>x.codigo===l.codigo)) linhas.push(l); });
      _set(K.LINHAS, linhas);
      const tabelas = getTabelas();
      (obj.tabelas||[]).forEach(t => {
        const i = tabelas.findIndex(x => x.linha===t.linha && x.tabela===t.tabela);
        if (i>=0) tabelas[i] = t; else tabelas.push(t);
      });
      _set(K.TABELAS, tabelas);
      const carros = new Set(getCarros());
      (obj.carros||[]).forEach(c => carros.add(c));
      _set(K.CARROS, Array.from(carros));
      const ids = new Set(getMarcacoes().map(m=>m.id));
      const merged = getMarcacoes().slice();
      (obj.marcacoes||[]).forEach(m => { if (!ids.has(m.id)) merged.push(m); });
      _set(K.MARCACOES, merged);
    }
    recalcPendentes();
  }

  // -------- export do mestre apenas (linhas+tabelas) --------
  function exportMaster(){
    return {
      __schema: 'recolhida-sambaiba-master',
      __version: 1,
      linhas: getLinhas(),
      tabelas: getTabelas()
    };
  }
  function importMaster(obj){
    if (!obj || obj.__schema !== 'recolhida-sambaiba-master') throw new Error('Arquivo inválido');
    _set(K.LINHAS, obj.linhas||[]);
    _set(K.TABELAS, obj.tabelas||[]);
    recalcPendentes();
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.storage = {
    K, TOL_MIN,
    getLinhas, addLinha, removeLinha, findLinha, suggestLinhas,
    getTabelas, addTabela, removeTabela, findTabela, suggestTabelasParaLinha,
    getCarros, rememberCarro, suggestCarros,
    getMarcacoes, novaMarcacao, deleteMarcacao, deleteMarcacoesDoDia, clearAll,
    updateTabelaEmMarcacoes, updateMarcacao,
    recalcPendentes,
    exportAll, importAll, exportMaster, importMaster
  };
})(window);
