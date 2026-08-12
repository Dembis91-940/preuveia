/* Voice widget — Poseidon v1.0 — Vapi web SDK
 * Bouton 🎙️ flottant : lance une conversation vocale avec l'assistant du site.
 * Config : window.VOICE_CONFIG = { publicKey, assistantId, accent }
 */
(function () {
  if (window.__voiceLoaded) return;
  window.__voiceLoaded = true;

  var cfg = window.VOICE_CONFIG || {};
  if (!cfg.assistantId || !cfg.publicKey) return; // non configuré : rien à afficher

  var ACCENT = cfg.accent || '#111827';

  /* ---------- Bouton ---------- */
  var btn = document.createElement('div');
  btn.id = 'vb-btn';
  btn.innerHTML = '<span>🎙️</span>';
  btn.style.cssText = 'position:fixed;bottom:20px;right:92px;width:58px;height:58px;border-radius:50%;background:' + ACCENT + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:99998;transition:transform .15s;';
  btn.title = 'Parler à notre assistant vocal';
  btn.onmouseenter = function () { btn.style.transform = 'scale(1.08)'; };
  btn.onmouseleave = function () { btn.style.transform = 'scale(1)'; };
  document.body.appendChild(btn);

  /* ---------- Statut ---------- */
  var status = document.createElement('div');
  status.id = 'vb-status';
  status.style.cssText = 'position:fixed;bottom:90px;right:92px;background:#111827;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;display:none;z-index:99998;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:240px;text-align:center;';
  status.innerHTML = '🎙️ Je vous écoute… <button id="vb-stop" style="display:block;margin:8px auto 0;background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 16px;cursor:pointer;font-size:12px;">Arrêter</button>';
  document.body.appendChild(status);

  var vapi = null;
  var busy = false;

  function loadSDK(cb) {
    if (window.VapiSDK && window.VapiSDK.default) { cb(); return; }
    var s = location.pathname.split('/').filter(Boolean);
    var n = Math.max(0, s.length - 2), p = '';
    while (n--) { p += '../'; }
    var el = document.createElement('script');
    el.src = p + 'assets/vapi-bundle.js';
    el.onload = function () {
      if (window.VapiSDK && window.VapiSDK.default) { cb(); }
      else { status.textContent = 'Erreur de chargement vocal (SDK).'; }
    };
    el.onerror = function () { status.textContent = 'Erreur de chargement vocal.'; };
    document.head.appendChild(el);
  }

  function setActive(active) {
    btn.style.background = active ? '#ef4444' : ACCENT;
    btn.style.animation = active ? 'vb-pulse 1.2s infinite' : 'none';
    status.style.display = active ? 'block' : 'none';
  }
  var style = document.createElement('style');
  style.textContent = '@keyframes vb-pulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,.5);} 70%{box-shadow:0 0 0 16px rgba(239,68,68,0);} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0);} }';
  document.head.appendChild(style);

  function stopCall() {
    try { if (vapi) vapi.stop(); } catch (e) {}
    setActive(false);
    busy = false;
  }

  btn.onclick = function () {
    if (busy) { stopCall(); return; }
    busy = true;
    loadSDK(function () {
      try {
        vapi = new window.VapiSDK.default(cfg.publicKey);
        vapi.on('call-start', function () { setActive(true); });
        vapi.on('call-end', function () { setActive(false); busy = false; });
        vapi.on('speech-update', function (m) {
          if (m && m.status === 'speaking') status.style.display = 'none';
          else if (m && m.status === 'listening') status.style.display = 'block';
        });
        vapi.start(cfg.assistantId);
      } catch (e) {
        busy = false;
        status.textContent = 'Impossible de démarrer la conversation.';
        status.style.display = 'block';
      }
    });
  };

  var stopBtn = document.getElementById('vb-stop');
  if (stopBtn) stopBtn.onclick = stopCall;
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'vb-stop') stopCall();
  });
})();
