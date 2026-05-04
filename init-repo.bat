@echo off
REM ============================================================
REM  Inicializa repo Git local + faz primeiro commit do app
REM  Análise de Recolhida — Sambaíba
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo === Limpando .git parcial (se existir) ===
if exist ".git" (
  rmdir /s /q ".git"
)

echo.
echo === git init + config ===
git init -b main
if errorlevel 1 (
  echo ERRO: Git nao encontrado. Instale Git for Windows: https://git-scm.com/download/win
  pause
  exit /b 1
)

git config user.name "Alisson Martins"
git config user.email "alisson84martins@gmail.com"

echo.
echo === Adicionando arquivos e fazendo primeiro commit ===
git add -A
git commit -m "feat: PWA Analise de Recolhida - primeira versao"
if errorlevel 1 (
  echo ERRO no commit. Verifique mensagens acima.
  pause
  exit /b 1
)

echo.
echo ================================================================
echo  Repo local pronto.
echo.
echo  PROXIMO PASSO: criar repo no GitHub
echo  1) Abra https://github.com/new
echo  2) Nome: analise-recolhida
echo  3) Visibilidade: Public  (necessario para GitHub Pages gratuito)
echo  4) NAO marque "Add a README" nem .gitignore (ja temos)
echo  5) Clique "Create repository"
echo.
echo  Depois cole no terminal (ou rode push.bat):
echo.
echo     git remote add origin https://github.com/alisson84martins/analise-recolhida.git
echo     git push -u origin main
echo.
echo ================================================================
pause
