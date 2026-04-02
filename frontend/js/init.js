// Ponto de entrada: eventos globais e inicialização

import { App } from './app.js';
import { initTheme, toggleTheme } from './theme.js';

// expõe App globalmente (necessário para os handlers onclick inline no HTML)
window.App = App;
window.toggleTheme = toggleTheme;

// aplica o tema salvo antes de qualquer renderização
initTheme();

// fecha o dropdown do chip se o usuário clicar fora
document.addEventListener('click', event => {
  const chipWrap = document.getElementById('user-chip-wrap');
  if (chipWrap && !chipWrap.contains(event.target))
    document.getElementById('chip-dd')?.classList.remove('open');

  const drawer = document.getElementById('mobile-nav-drawer');
  const hamburger = document.getElementById('hamburger-btn');
  if (drawer && hamburger && !drawer.contains(event.target) && !hamburger.contains(event.target))
    drawer.classList.remove('open');
});

// dá enter para logar
document.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const loginBtn = document.getElementById('login-submit-btn');
  if (loginBtn && !loginBtn.disabled) loginBtn.click();
});

// inicializa o app
App.init();