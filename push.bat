@echo off
REM ============================================================
REM  Conecta repo local ao GitHub e publica
REM  Rode DEPOIS de ter criado o repo em github.com/new
REM ============================================================
setlocal

cd /d "%~dp0"

set "REPO_URL=https://github.com/alisson84martins/analise-recolhida.git"

echo.
echo === Conectando remote: %REPO_URL% ===
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo === Push para GitHub ===
git push -u origin main
if errorlevel 1 (
  echo.
  echo ERRO no push. Possiveis causas:
  echo  - Repo nao existe no GitHub: crie em https://github.com/new
  echo  - Autenticacao: na primeira vez o GitHub abre janela para login
  echo  - Nome do repo diferente: edite REPO_URL no topo deste .bat
  pause
  exit /b 1
)

echo.
echo ================================================================
echo  Push OK!
echo.
echo  ULTIMO PASSO: ativar GitHub Pages
echo  1) Abra https://github.com/alisson84martins/analise-recolhida/settings/pages
echo  2) Em "Source": selecione "Deploy from a branch"
echo  3) Branch: main  /  pasta: / (root)
echo  4) Clique Save
echo  5) Aguarde 1-2 min e abra:
echo     https://alisson84martins.github.io/analise-recolhida/
echo.
echo  No celular: Chrome -> menu -> "Adicionar a tela inicial"
echo ================================================================
pause
