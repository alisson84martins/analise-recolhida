# Análise de Recolhida — Sambaíba Transportes Urbanos

PWA pessoal usado em pé no portão da Garagem 3 para identificar adiantamentos da recolhida da frota.

## O que é

App offline-first (instalável no celular como PWA) para anotar a hora de chegada de cada carro e **classificar automaticamente** contra a hora prevista da tabela:

- **ADIANTADO** — desvio < −5 min
- **PONTUAL** — entre −5 e +5 min
- **ATRASADO** — desvio > +5 min
- **PENDENTE** — sem cadastro mestre da Linha+Tabela ainda; recalcula sozinho assim que cadastrar

## Decisões fechadas (NÃO reabrir sem motivo)

- Chave de cruzamento: **Linha + Tabela**, NÃO Carro+Linha (carros migram entre tabelas conforme manutenção)
- Tolerância: **±5 min**
- Sem mínimo de amostra no ranking (decisão consciente — porcentagem mostra junto para qualificar)
- Carros buscados pelo manobrista NÃO devem ser registrados (são consequência do gargalo, não causa)
- Persistência local (`localStorage`, prefixo `recolhida_`) — sem servidor
- NÃO integrado ao Gestão de Pátio Sambaíba (risco zero)

## Como usar no portão

1. Aba **Marcação**
2. Toca a Linha (autocomplete por dígito) → toca a Tabela (filtra só as válidas) → toca o Carro → **REGISTRAR ENTRADA**
3. Pílula colorida confirma a classificação na hora

Sem memória entre marcações — cada carro começa do zero.

## Como apresentar (semanal)

1. Aba **Exportar** → "Exportar Semana Consolidada" (gera .xlsx no formato da aba `COLETA_REAL`)
2. Cola na planilha mestre `Recolhida_Frota_Analise.xlsx` em `Coordenador_Sambaíba/`
3. Olha DASHBOARD + PARETO_LINHAS + PARETO_FAIXAS

## Como instalar como PWA no Android

Esta versão precisa estar servida via http(s) — abrir o `index.html` direto no navegador (`file://`) **funciona para teste**, mas o botão "Instalar" só aparece em http(s).

### Opção A — GitHub Pages (recomendado)

```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin git@github.com:alisson84martins/analise-recolhida.git
git branch -M main
git push -u origin main
```

No GitHub: **Settings → Pages → Source: main / root** → publica em `https://alisson84martins.github.io/analise-recolhida/`.

Abre essa URL no Chrome do celular → menu (⋮) → **Adicionar à tela inicial**.

### Opção B — servidor local rápido

```bash
cd analise-recolhida
python -m http.server 8080
```

Abre `http://SEU-IP-LOCAL:8080` no celular conectado na mesma rede.

## Estrutura

```
analise-recolhida/
├── index.html               # shell do app
├── manifest.json            # PWA install
├── service-worker.js        # cache offline
├── css/styles.css
├── js/
│   ├── storage.js           # localStorage + modelos
│   ├── classify.js          # tolerância ±5 e classes
│   ├── marcacao.js          # tela do portão
│   ├── cadastros.js         # linhas e tabelas+hora
│   ├── historico.js         # KPIs, Pareto, ranking
│   ├── exportar.js          # .xlsx via SheetJS
│   └── app.js               # navegação + bootstrap
├── vendor/xlsx.full.min.js  # SheetJS embutido (offline)
├── icons/                   # ícones do PWA
└── data/                    # opcional, JSON versionável
```

## Backup e versionamento

Aba **Exportar → Backup completo (JSON)** baixa um arquivo com tudo. Pode ser commitado em `data/` para histórico.
