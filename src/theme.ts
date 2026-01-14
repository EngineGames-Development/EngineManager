const themeButtons = document.querySelectorAll('#theme-toggle, #footer-theme-toggle');

let currentTheme = localStorage.getItem('theme') || 'system';

export function applyTheme(theme : string) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeButtons.forEach(btn => btn.textContent = '☀️');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeButtons.forEach(btn => btn.textContent = '🌙');
  } else {
    document.documentElement.setAttribute('data-theme', '');
    themeButtons.forEach(btn => btn.textContent = '🌓');
  }
  localStorage.setItem('theme', theme);
  currentTheme = theme;
}

export function setupThemeToggle() {
  themeButtons.forEach(btn => {
   btn.addEventListener('click', () => {
    if (currentTheme === 'system') applyTheme('dark');
    else if (currentTheme === 'dark') applyTheme('light');
    else applyTheme('system');
   });
  });
}