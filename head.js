// TEMPORARY DEBUG BOX: shows script errors on the phone screen. Set SH_DEBUG to false once fixed.
var SH_DEBUG = true;
function showErr(text) {
  if (!document.body) { document.addEventListener('DOMContentLoaded', function () { showErr(text); }); return; }
  var box = document.getElementById('shDebug');
  if (!box) {
    box = document.createElement('div'); box.id = 'shDebug';
    box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#fff;color:#b00020;border:2px solid #b00020;border-radius:12px;padding:10px;font:13px/1.4 monospace;white-space:pre-wrap;max-height:40vh;overflow:auto';
    document.body.appendChild(box);
  }
  box.textContent += text + '\n';
}
if (SH_DEBUG) {
  window.addEventListener('error', function (e) { showErr('ERROR: ' + (e.message || 'unknown') + ' [' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '?') + ']'); });
  window.addEventListener('unhandledrejection', function (e) { showErr('PROMISE: ' + ((e.reason && (e.reason.message || e.reason)) || 'unknown')); });
}
// Runs before the app. Keeps the install prompt, the saved theme and analytics in one small file.
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event('sh-installable')); });
try { var savedTheme = JSON.parse(localStorage.getItem('studentPrefs') || '{}').theme; if (savedTheme && savedTheme !== 'system') document.documentElement.dataset.theme = savedTheme; } catch (err) {}
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-HGTRD8N6TG'); // Google Analytics Measurement ID. Must match the src line below.
var gaScript = document.createElement('script'); gaScript.async = true;
gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-HGTRD8N6TG'; document.head.appendChild(gaScript);
