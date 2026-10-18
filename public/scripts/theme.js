(function () {
  try {
    var saved = localStorage.getItem('classify_theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
