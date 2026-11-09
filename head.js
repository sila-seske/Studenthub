// Runs before the app. Holds the saved theme, the install prompt and Google Analytics.
try { var savedTheme = JSON.parse(localStorage.getItem('studentPrefs') || '{}').theme; if (savedTheme && savedTheme !== 'system') document.documentElement.dataset.theme = savedTheme; } catch (err) {}
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-HGTRD8N6TG');
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event('sh-installable')); });
