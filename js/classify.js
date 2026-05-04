/* classify.js — regras de tolerância e classificação */
(function (global) {
  const TOL = 5;

  function hhmmToMin(hhmm){
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h*60 + m;
  }

  // diffMin > 0  → ATRASADO (real depois do previsto)
  // diffMin < 0  → ADIANTADO (real antes do previsto)
  // Ajusta volta de ciclo (>12h é considerado virada)
  function diffMin(realHHMM, prevHHMM){
    const a = hhmmToMin(realHHMM), b = hhmmToMin(prevHHMM);
    if (a === null || b === null) return null;
    let d = a - b;
    if (d >  12*60) d -= 24*60;
    if (d < -12*60) d += 24*60;
    return d;
  }

  function classe(desvioMin){
    if (desvioMin === null || desvioMin === undefined) return 'PENDENTE';
    if (desvioMin < -TOL) return 'ADIANTADO';
    if (desvioMin >  TOL) return 'ATRASADO';
    return 'PONTUAL';
  }

  function fmtDesvio(d){
    if (d === null || d === undefined) return '—';
    const sign = d > 0 ? '+' : (d < 0 ? '-' : '');
    return `${sign}${Math.abs(d)} min`;
  }

  global.Recolhida = global.Recolhida || {};
  global.Recolhida.classify = { TOL, hhmmToMin, diffMin, classe, fmtDesvio };
})(window);
