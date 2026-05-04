# Deploy — passo a passo

Tempo total: ~5 minutos. Tudo gratuito.

## Pré-requisito (uma vez só)

Se ainda não tem **Git for Windows** instalado:
- Baixar e instalar: https://git-scm.com/download/win
- Aceitar todas as opções padrão. Reiniciar o terminal depois.

---

## Passo 1 — Inicializar o repositório local

Na pasta `analise-recolhida`, dê **duplo-clique em `init-repo.bat`**.

Esperado: ele cria o `.git`, configura seu nome/email, faz o primeiro commit e te orienta o próximo passo.

---

## Passo 2 — Criar o repositório vazio no GitHub

1. Abrir: https://github.com/new
2. Preencher:
   - **Repository name:** `analise-recolhida`
   - **Description:** `PWA para análise da recolhida da frota Sambaíba — adiantamento como gargalo do portão`
   - **Visibility:** **Public** (precisa ser público para o GitHub Pages gratuito funcionar)
   - **Initialize this repository:** deixe **TUDO desmarcado** (não adicionar README, .gitignore nem licença — já temos)
3. Clicar **Create repository**

Não fazer nada do que o GitHub sugere depois — vamos usar o `push.bat`.

---

## Passo 3 — Enviar o código para o GitHub

Duplo-clique em `push.bat`.

Na primeira vez, o Git vai abrir uma janela do navegador pedindo login no GitHub. Faz login e autoriza — daí em diante fica salvo.

Esperado ao final: mensagem "Push OK!".

---

## Passo 4 — Ativar GitHub Pages

1. Abrir: https://github.com/alisson84martins/analise-recolhida/settings/pages
2. Em **Source**, escolher **Deploy from a branch**
3. **Branch:** `main` · **Folder:** `/ (root)`
4. Clicar **Save**
5. Aguardar 1–2 min. A página vai mostrar:

   > Your site is live at `https://alisson84martins.github.io/analise-recolhida/`

---

## Passo 5 — Instalar como app no celular

1. No Chrome do Android, abrir: https://alisson84martins.github.io/analise-recolhida/
2. Tocar no menu (⋮) → **Adicionar à tela inicial** ou **Instalar app**
3. O app passa a abrir como aplicativo, em tela cheia, e funciona offline

No iPhone (Safari): botão de compartilhar → **Adicionar à Tela de Início**.

---

## Atualizações futuras

Quando quiser publicar uma mudança no app, abrir um terminal na pasta e:

```cmd
git add -A
git commit -m "descrição da mudança"
git push
```

O GitHub Pages atualiza sozinho em 1–2 min. O service worker do PWA também atualiza no próximo abrir do app.

---

## Se algo der errado

| Erro | Solução |
|---|---|
| `git não é reconhecido` | Instalar Git for Windows e reiniciar o terminal |
| `remote already exists` no push | Já tem o remote — `push.bat` cuida disso (remove antes) |
| `403` ou `permission denied` no push | Login expirado: rodar `git push` no terminal e seguir o pop-up de autenticação |
| Pages mostra 404 | Espera 2 min depois do Save; confirme que a branch é `main` e a pasta é `/ (root)` |
| Nome de repo diferente | Edite o `REPO_URL` no topo de `push.bat` |
