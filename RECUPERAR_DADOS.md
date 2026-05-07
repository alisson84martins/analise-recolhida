# 🔧 Recuperar Dados — Análise de Recolhida

## Problema: localStorage foi apagado

Seu localStorage foi limpado, mas os dados NÃO foram perdidos! Há um backup em `recolhida_backup_*.json`.

## Solução rápida

### Opção 1: Use a ferramenta de recuperação (RECOMENDADO)

1. Abra o arquivo **`recuperar-dados.html`** no navegador
2. Escolha o arquivo `recolhida_backup_*.json` ou cole seu conteúdo
3. Clique em "Analisar dados"
4. Revise os dados
5. Clique em "Confirmar restauração"
6. Pronto! Volte ao aplicativo

### Opção 2: Importar manualmente pelo app

1. Abra o aplicativo normalmente
2. Vá para **Cadastros** → **Importar JSON do mestre**
3. Escolha `recolhida_backup_*.json`
4. Confirme a importação

Ou:

1. Vá para **Exportar** → **Restaurar de .json**
2. Escolha `recolhida_backup_*.json`
3. Escolha se quer "Substituir" ou "Mesclar"
4. Pronto!

---

## Por que isso aconteceu?

O localStorage pode ser limpado por:
- 🔄 Atualização do navegador após erro
- 🗑️ Limpeza manual de cache/dados do site
- 🔒 Modo privado expirou
- 📱 Dispositivo sincronizando dados

**Isso foi corrigido!** O código agora:
- ✅ Remove BOM (Byte Order Mark) de arquivos JSON
- ✅ Valida estrutura antes de restaurar
- ✅ Oferece melhor feedback de erros
- ✅ Protege contra importação acidental de arquivos inválidos

---

## Dicas para não perder dados

### 1. Faça backup regular
- Vá para **Exportar** → **Backup completo**
- Baixe `recolhida_backup_*.json` regularmente
- Guarde em local seguro (OneDrive, Google Drive, etc)

### 2. Versione os backups
- Renomeie com data: `recolhida_backup_2026-05-07.json`
- Mantenha última semana de backups

### 3. Sincronize entre dispositivos
- Use **Exportar** → **Importar trabalho do celular**
- Mescle dados do celular com o notebook regularmente

---

## Estrutura do backup

O arquivo JSON contém:

```json
{
  "__schema": "recolhida-sambaiba",
  "__version": 1,
  "__exportedAt": "2026-05-07T15:03:39.802Z",
  "linhas": [
    { "codigo": "271 F", "nome": "Linha 271 F" }
  ],
  "tabelas": [
    { "linha": "271 F", "tabela": "1", "horaPrevista": "08:30" }
  ],
  "carros": ["8421", "8422"],
  "marcacoes": [
    { "id": "m_1234567890_abc12", "ts": 1234567890000, ... }
  ]
}
```

- **linhas**: Linhas cadastradas
- **tabelas**: Horários previstos (Linha + Tabela + Hora)
- **carros**: Histórico de carros memorizados
- **marcacoes**: Todas as entradas registradas

---

## Problemas? 

Se ao importar aparecer erro "JSON inválido":

1. ✅ Certifique-se de que o arquivo é um `.json` legítimo
2. ✅ Não edite o arquivo manualmente
3. ✅ Tente novamente com a ferramenta `recuperar-dados.html`
4. ✅ Se persistir, abra o DevTools (F12) e procure pela mensagem de erro no Console

---

**Necessário suporte?** Verifique que esteja usando a versão corrigida do código.
