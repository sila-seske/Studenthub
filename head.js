// Runs before the app. Keeps the install prompt, the saved theme and analytics in one small file.
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event('sh-installable')); });
try { var savedTheme = JSON.parse(localStorage.getItem('studentPrefs') || '{}').theme; if (savedTheme && savedTheme !== 'system') document.documentElement.dataset.theme = savedTheme; } catch (err) {}
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '<script async src="https://www.googletagmanager.com/gtag/js?id=G-HGTRD8N6TG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-HGTRD8N6TG');
</script>'); // Replace with your Google Analytics Measurement ID. This is the only place it is set in the app.
var gaScript = document.createElement('script'); gaScript.async = true;
gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; document.head.appendChild(gaScript);
