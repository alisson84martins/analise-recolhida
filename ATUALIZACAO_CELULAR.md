# 📱 Atualizar App no Celular

O aplicativo é um **PWA (Progressive Web App)** que funciona offline. Ele **cache os arquivos** no celular para funcionar sem internet. Quando você faz alterações e commita no GitHub, é preciso atualizar o cache no celular.

## ✅ Solução: Duas formas

### **Forma 1: Atualização Automática (NOVO!)**

Agora o app detecta automaticamente quando há atualizações:

1. **Quando há nova versão**, você receberá mensagem: 
   > 🔄 *Nova versão disponível! Recarregue para atualizar.*

2. **O app recarrega automaticamente** após 5 segundos

3. Pronto! Você tem a versão mais recente.

### **Forma 2: Forçar Atualização Manual**

Se quiser atualizar agora **sem esperar**:

#### **Android (Chrome/Edge)**
1. Abra o app no celular
2. Pressione e segure a página
3. Toque em **Recarregar** (ou <kbd>Ctrl+F5</kbd>)
4. **Recarregar não funciona?** Vá para:
   - Menu (**⋮**) → **Developer Tools** (ou DevTools)
   - Abra **Application** → **Service Workers**
   - Clique em **Unregister** para remover a versão antiga
   - Recarregue a página

#### **iPhone/iPad (Safari)**
1. Abra o app
2. Feche completamente o Safari (swipe up from bottom)
3. Reabra o Safari
4. Acesse o app novamente
5. **Ainda não atualizou?**
   - Settings (Configurações) → Safari → Advanced → Website Data
   - Procure pelo domínio do app e **Delete** (apagar)
   - Reabra o app

---

## 🔄 Fluxo de Atualização

### Quando você faz alterações:

```
1. Você edita código (js/cadastros.js, etc)
2. Commita e faz push ao GitHub
3. Faz git pull no celular
4. App detecta nova versão (automático)
5. Notifica você
6. Recarrega automaticamente (ou manual)
```

---

## 💡 Dicas

### **Se o app parece "congelado"**
- Feche completamente e reabra
- Ou force recarregamento: <kbd>Ctrl+F5</kbd> ou <kbd>Cmd+Shift+R</kbd>

### **Para desenvolvimento (sem cache)**
- Abra DevTools (F12)
- Vá para **Application** → **Service Workers**
- Marque **Update on reload**
- Agora cada recarregamento busca arquivos frescos

### **Para desinstalar o PWA**
- No celular: **Menu (⋮) → Apps e notificações → Nome do App → Desinstalar**
- Ou: **Settings → Apps → [Nome] → Uninstall**

---

## 🆘 Problemas?

### **A atualização não aparece**
- ✅ Verifique se fez `git pull` no celular
- ✅ Recarregue algumas vezes (F5)
- ✅ Limpe cache manual (ver Android/iPhone acima)

### **Perdeu dados ao atualizar**
- ✅ Os dados estão em **localStorage** (não no cache)
- ✅ Use **Exportar → Backup JSON** para preservar
- ✅ Se perdeu, veja `RECUPERAR_DADOS.md`

### **App quer atualizar sempre**
- Isso é normal durante desenvolvimento
- Em produção, será menos frequente

---

**Versão do Service Worker:** `recolhida-v4+`

Última atualização: 2026-05-07
