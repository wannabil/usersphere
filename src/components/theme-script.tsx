/**
 * Inline script to prevent FOUC (Flash of Unstyled Content)
 * This must be rendered in the <head> before any content
 */
export function ThemeScript() {
  // This script runs immediately before page render
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const appliedTheme = theme === 'system' || !theme ? systemTheme : theme;
        
        if (appliedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}

