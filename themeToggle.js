export function setupThemeToggle() {
  const toggleButton = document.getElementById('toggleTheme');
  const htmlElement = document.documentElement;

  // Check for saved theme preference or system preference
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    toggleButton.checked = true; // Set checkbox to checked for dark mode
  } else {
    toggleButton.checked = false; // Ensure checkbox is unchecked for light mode
  }

  toggleButton.addEventListener('click', () => {
    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      htmlElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  });
}