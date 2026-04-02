const THEME_KEY = 'biblioteca_tema';
// Defining the rotation: dark -> creme -> invertido -> dark
const THEME_CYCLE = ['dark', 'creme', 'invertido'];

export function applyTheme(theme) {
  const html = document.documentElement;

  // Validate theme or default to dark
  const targetTheme = THEME_CYCLE.includes(theme) ? theme : 'dark';

  html.classList.add('theme-transitioning');
  
  // Set the data-theme attribute used in your CSS selectors
  if (targetTheme === 'dark') {
    delete html.dataset.theme; // :root is your dark theme
  } else {
    html.dataset.theme = targetTheme;
  }

  localStorage.setItem(THEME_KEY, targetTheme);
  _updateToggleButtons(targetTheme);
  
  setTimeout(() => html.classList.remove('theme-transitioning'), 300);
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  // Default to 'dark' if no preference is saved
  applyTheme(saved || 'dark');
}

export function toggleTheme() {
  const current = currentTheme();
  const currentIndex = THEME_CYCLE.indexOf(current);
  // Cycle to the next theme in the array
  const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
  applyTheme(THEME_CYCLE[nextIndex]);
}

export function currentTheme() {
  const theme = document.documentElement.dataset.theme;
  return theme || 'dark'; // If no data-theme, it's the :root dark theme
}

function _updateToggleButtons(theme) {
  const labels = {
    'dark': '🌙 Escuro',
    'creme': '🍦 Creme',
    'invertido': '🧱 Terracota'
  };
  
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.textContent = `Tema: ${labels[theme]}`;
  });
}