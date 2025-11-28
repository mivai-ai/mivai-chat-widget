// mivai-chat-widget.js
window.addEventListener("load", function () {
  (function () {
    // ==========================
    // CONFIG DALLO <script> (data-*)
    // ==========================

    function findMivaiScript() {
      const scripts = document.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        if ((s.src || "").includes("mivai-chat-widget")) {
          return s;
        }
      }
      return null;
    }

    // ✅ Prima prova a usare il tag <script> che ha caricato questo file
    //    (document.currentScript). In fallback cerca il primo script con "mivai-chat-widget" nell'URL.
    const script = document.currentScript || findMivaiScript();
    const ds = script ? script.dataset : {};

    // URL fisso della Cloud Function
    const API_URL = "https://chat-f6t3w2izza-ew.a.run.app";

    // ProjectId letto dal data- attribute
    const PROJECT_ID = ds.mivaiProjectId || "default-project";

    const CLIENT_NAME = ds.mivaiClientName || "Assistente Hotel";

    const SUBTITLE =
      ds.mivaiSubtitle || "Fai una domanda o verifica una prenotazione ✨";

    const CLIENT_LOGO_URL =
      ds.mivaiClientLogo ||
      "https://via.placeholder.com/80x80.png?text=LOGO";

    // Quick replies: stringa JSON oppure lista separata da |
    let QUICK_REPLIES = [
      "Quali sono gli orari di check-in e check-out?",
      "Come posso verificare la disponibilità?",
      "Avete parcheggio disponibile?",
      "Colazione e pasti sono inclusi?",
    ];
    if (ds.mivaiQuickReplies) {
      try {
        if (ds.mivaiQuickReplies.trim().startsWith("[")) {
          QUICK_REPLIES = JSON.parse(ds.mivaiQuickReplies);
        } else {
          QUICK_REPLIES = ds.mivaiQuickReplies
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("mivAI widget – quick replies non valide, uso default", e);
      }
    }

    // Palette mivAI
    const BG_OUTER = "#050915";
    const BG_CARD = "#0B1730";
    const BG_CARD_TOP = "#12213F";
    const PRIMARY = "#F5C14E"; // oro
    const BLUE_MAIN = "#1E3163"; // blu principale scuro

    const MIVAI_LOGO =
      "https://cdn.prod.website-files.com/68c440493e6f97c7c1211e45/68c44164e687b29e1a46e8dc_Logo%20png%20trasparente-p-1600.png";
    const MIVAI_LINK =
      "https://mivai.it/?utm_source=chatbot&utm_medium=widget&utm_campaign=mivai_brand";

    const PRIVACY_NOTE = "La chat è trascritta e visibile allo staff dell'hotel.";

    // ==========================
    // STILI
    // ==========================
    const style = document.createElement("style");
    style.innerHTML = `
    :root {
      --mivai-primary: ${PRIMARY};
      --mivai-blue: ${BLUE_MAIN};
      --mivai-bg-outer: ${BG_OUTER};
      --mivai-bg-card: ${BG_CARD};
      --mivai-bg-card-top: ${BG_CARD_TOP};
    }

    /* Reset locale per evitare che il CSS del sito modifichi il widget */
    .mivai-chat-window,
    .mivai-chat-window * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      letter-spacing: normal !important;
      text-transform: none !important;
    }

    /* Forza stile input (testo bianco) all'interno del widget */
    .mivai-chat-window .mivai-chat-input,
    .mivai-chat-window .mivai-chat-input:focus {
      background: #10162E !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important; /* Safari/Chrome */
      border-radius: 999px !important;
      border: 1px solid rgba(245,193,78,0.6) !important;
      box-shadow: none !important;
      font-size: 13px !important;
      outline: none !important;
    }

    .mivai-chat-window .mivai-chat-input::placeholder {
      color: #7f87b6 !important;
      opacity: 1 !important;
    }

    /* Label palloncino accanto all'icona */
    .mivai-chat-label {
      background: #0F182F !important;
      color: #F5F6FF !important;
      font-size: 11px !important;
      border-radius: 999px !important;
    }

    /* Bottoni quick replies */
    .mivai-quick-btn {
      font-size: 13px !important;
      font-weight: 500 !important;
      border-radius: 999px !important;
      text-transform: none !important;
      box-shadow: 0 8px 18px rgba(0,0,0,0.35) !important;
    }

    .mivai-chat-launcher-wrap {
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mivai-chat-launcher {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 3px solid var(--mivai-primary);
      outline: none;
      cursor: pointer;
      background: var(--mivai-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 18px 40px rgba(0,0,0,0.65);
      transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      position: relative;
    }
    .mivai-chat-launcher:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 24px 56px rgba(0,0,0,0.8);
      filter: brightness(1.03);
    }
    .mivai-chat-launcher:active {
      transform: scale(0.96);
    }

    .mivai-chat-launcher-bubble {
      width: 30px;
      height: 22px;
      border-radius: 16px;
      background: #ffffff;
      position: relative;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:3px;
    }
    .mivai-chat-launcher-bubble::after {
      content:"";
      position:absolute;
      bottom:-5px;
      right:8px;
      width:9px;
      height:9px;
      background:#ffffff;
      border-radius: 2px 6px 6px 6px;
      transform: rotate(18deg);
    }
    .mivai-chat-launcher-bubble span {
      width:4px;
      height:4px;
      border-radius:50%;
      background: var(--mivai-blue);
      opacity:0.8;
      animation:mivai-typing-dots 1.2s infinite ease-in-out;
    }
    .mivai-chat-launcher-bubble span:nth-child(2){animation-delay:0.18s;}
    .mivai-chat-launcher-bubble span:nth-child(3){animation-delay:0.36s;}

    @keyframes mivai-typing-dots {
      0%, 80%, 100% { transform:translateY(0); opacity:0.4; }
      40% { transform:translateY(-2px); opacity:1; }
    }

    .mivai-chat-label {
      background: #0F182F;
      color: #F5F6FF;
      font-size: 11px;
      padding: 7px 14px;
      border-radius: 999px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.6);
      white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.06);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .mivai-chat-label strong {
      color: var(--mivai-primary);
      font-weight: 600;
    }
    .mivai-chat-label.mivai-hidden {
      opacity: 0;
      transform: translateY(4px);
      pointer-events: none;
    }

    .mivai-chat-window {
      position: fixed;
      right: 20px;
      bottom: 96px;
      width: 420px;
      max-width: calc(100% - 32px);
      background: var(--mivai-bg-outer);
      border-radius: 26px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.9);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      opacity: 0;
      transform: translateY(14px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .mivai-chat-window.mivai-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .mivai-chat-header {
      padding: 14px 18px 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, var(--mivai-blue), var(--mivai-bg-card-top));
    }
    .mivai-chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #111827;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      box-shadow: 0 8px 18px rgba(0,0,0,0.45);
    }
    .mivai-chat-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .mivai-chat-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .mivai-chat-subtitle {
      font-size: 11px;
      opacity: 0.9;
      color: #f3f3ff;
    }
    .mivai-chat-close {
      margin-left: auto;
      cursor: pointer;
      opacity: 0.85;
      color: #f5f5ff;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .mivai-chat-close:hover { opacity: 1; transform: scale(1.05); }

    .mivai-chat-body {
      background: var(--mivai-bg-card);
      padding: 10px 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* LISTA MESSAGGI CON SCROLLBAR PERSONALIZZATA */
    .mivai-chat-messages {
      padding: 4px 2px 4px;
      max-height: 400px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 193, 78, 0.8) transparent;
    }

    .mivai-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    .mivai-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .mivai-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(245, 193, 78, 0.85);
      border-radius: 999px;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
    }

    .mivai-chat-msg {
      margin: 6px 0;
      display: flex;
      animation: mivai-msg-enter 0.22s ease-out;
    }
    .mivai-chat-msg-user {
      justify-content: flex-end;
    }
    .mivai-chat-bubble {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 20px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      box-shadow: 0 10px 26px rgba(0,0,0,0.65);
    }
    .mivai-chat-bubble-user {
      background: radial-gradient(circle at 0 0, #ffffff66, var(--mivai-blue));
      color: #ffffff;
      border-bottom-right-radius: 6px;
    }
    .mivai-chat-bubble-bot {
      background: #141F3A;
      color: #f4f5ff;
      border: 1px solid rgba(255,255,255,0.08);
      border-bottom-left-radius: 6px;
    }

    /* Quick replies come messaggio del bot */
    .mivai-quick-wrapper {
      width: 100%;
      display: flex;
      justify-content: flex-start;
      margin: 6px 0 4px;
    }
    .mivai-quick-inner {
      max-width: 100%;
      background: #141F3A;
      border-radius: 18px;
      padding: 10px 12px 12px;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 10px 26px rgba(0,0,0,0.65);
      color:#f4f5ff;
      font-size: 12px;
    }
    .mivai-quick-title {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .mivai-quick-buttons {
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .mivai-quick-btn {
      border:none;
      border-radius:999px;
      padding:9px 14px;
      background:#ffffff;
      color:#1d2233;
      cursor:pointer;
      text-align:center;
      transition:transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
      width:100%;
    }
    .mivai-quick-btn:hover {
      transform:translateY(-1px);
      box-shadow:0 12px 28px rgba(0,0,0,0.45);
      background:#f5f5ff;
    }
    .mivai-quick-btn:active {
      transform:scale(0.97);
      box-shadow:0 4px 10px rgba(0,0,0,0.3);
    }

    .mivai-chat-footer {
      padding: 10px 14px 10px;
      border-top: 1px solid rgba(255,255,255,0.05);
      background: #050815;
    }
    .mivai-chat-form {
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom: 4px;
    }

    .mivai-chat-send {
      border:none;
      border-radius:999px;
      background:var(--mivai-primary);
      color:#1b1b1b;
      padding:9px 16px;
      cursor:pointer;
      font-size:13px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      transition:transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
      box-shadow:0 12px 26px rgba(0,0,0,0.55);
      font-weight: 600;
    }
    .mivai-chat-send:hover {
      transform:translateY(-1px);
      box-shadow:0 15px 34px rgba(0,0,0,0.7);
      filter: brightness(1.02);
    }
    .mivai-chat-send:active {
      transform:scale(0.96);
      box-shadow:0 4px 12px rgba(0,0,0,0.45);
    }

    .mivai-chat-privacy {
      font-size: 10px;
      color: #9ca3c8;
      text-align: center;
      margin-bottom: 2px;
    }

    .mivai-chat-branding {
      display:flex;
      justify-content:center;
      align-items:center;
    }
    .mivai-chat-branding a {
      display:flex;
      align-items:center;
      justify-content:center;
      padding:2px 0;
    }
    .mivai-chat-branding img {
      height: 36px;
      opacity: 0.95;
      filter: drop-shadow(0 0 4px rgba(0,0,0,0.7));
    }

    .mivai-typing {
      display:flex;
      align-items:center;
      gap:6px;
      margin:6px 0 2px;
      padding-left:4px;
    }
    .mivai-typing-dot {
      width:6px;
      height:6px;
      border-radius:50%;
      background:rgba(255,255,255,0.7);
      animation:mivai-typing 1s infinite ease-in-out;
    }
    .mivai-typing-dot:nth-child(2) { animation-delay:0.18s; }
    .mivai-typing-dot:nth-child(3) { animation-delay:0.36s; }

    .mivai-chat-link {
      color: ${PRIMARY};
      font-weight: 600;
      text-decoration: none;
    }
    .mivai-chat-link:hover {
      text-decoration: underline;
    }

    @keyframes mivai-typing {
      0%, 80%, 100% { transform:translateY(0); opacity:0.4; }
      40% { transform:translateY(-3px); opacity:1; }
    }

    @keyframes mivai-msg-enter {
      from {
        opacity:0;
        transform:translateY(4px) scale(0.98);
      }
      to {
        opacity:1;
        transform:translateY(0) scale(1);
      }
    }

    @media (max-width: 480px) {
      .mivai-chat-window {
        right: 10px;
        bottom: 84px;
        width: calc(100% - 20px);
      }
      .mivai-chat-launcher-wrap {
        right: 10px;
        bottom: 14px;
      }
    }
    `;
    document.head.appendChild(style);

    // ==========================
    // DOM
    // ==========================
    const launcherWrap = document.createElement("div");
    launcherWrap.className = "mivai-chat-launcher-wrap";

    const label = document.createElement("div");
    label.className = "mivai-chat-label";
    label.innerHTML = "<strong>Chatta con noi</strong>";

    const launcher = document.createElement("button");
    launcher.className = "mivai-chat-launcher";
    launcher.innerHTML = `
      <div class="mivai-chat-launcher-bubble">
        <span></span><span></span><span></span>
      </div>
    `;

    launcherWrap.appendChild(label);
    launcherWrap.appendChild(launcher);
    document.body.appendChild(launcherWrap);

    const win = document.createElement("div");
    win.className = "mivai-chat-window";
    win.innerHTML = `
      <div class="mivai-chat-header">
        <div class="mivai-chat-avatar">
          <img src="${CLIENT_LOGO_URL}" alt="Logo cliente" />
        </div>
        <div>
          <div class="mivai-chat-title">${CLIENT_NAME}</div>
          <div class="mivai-chat-subtitle">${SUBTITLE}</div>
        </div>
        <div class="mivai-chat-close" aria-label="Chiudi">✕</div>
      </div>
      <div class="mivai-chat-body">
        <div class="mivai-chat-messages"></div>
      </div>
      <div class="mivai-chat-footer">
        <form class="mivai-chat-form">
          <input class="mivai-chat-input" type="text" placeholder="Scrivi un messaggio..." autocomplete="off" />
          <button class="mivai-chat-send" type="submit">
            <span>Invia</span> <span>➤</span>
          </button>
        </form>
        <div class="mivai-chat-privacy">${PRIVACY_NOTE}</div>
        <div class="mivai-chat-branding">
          <a href="${MIVAI_LINK}" target="_blank" rel="noopener noreferrer">
            <img src="${MIVAI_LOGO}" alt="mivAI" />
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(win);

    const closeBtn = win.querySelector(".mivai-chat-close");
    const messagesEl = win.querySelector(".mivai-chat-messages");
    const formEl = win.querySelector(".mivai-chat-form");
    const inputEl = win.querySelector(".mivai-chat-input");

    let conversationId = "conv-" + Math.random().toString(36).slice(2);
    let isSending = false;
    let typingEl = null;
    let quickWrapper = null;

    // ==========================
    // FUNZIONI
    // ==========================
    function renderQuickReplies() {
      if (!QUICK_REPLIES.length) return;

      quickWrapper = document.createElement("div");
      quickWrapper.className = "mivai-quick-wrapper";

      const inner = document.createElement("div");
      inner.className = "mivai-quick-inner";

      const titleEl = document.createElement("div");
      titleEl.className = "mivai-quick-title";
      titleEl.textContent = "Domande veloci";

      const btnContainer = document.createElement("div");
      btnContainer.className = "mivai-quick-buttons";

      QUICK_REPLIES.forEach((text) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mivai-quick-btn";
        btn.textContent = text;
        btn.addEventListener("click", () => {
          hideQuickReplies();
          handleUserMessage(text);
        });
        btnContainer.appendChild(btn);
      });

      inner.appendChild(titleEl);
      inner.appendChild(btnContainer);
      quickWrapper.appendChild(inner);
      messagesEl.appendChild(quickWrapper);
    }

    function hideQuickReplies() {
      if (quickWrapper && quickWrapper.style.display !== "none") {
        quickWrapper.style.display = "none";
      }
    }

    function toggleWindow() {
      const open = win.classList.contains("mivai-open");
      if (open) {
        win.classList.remove("mivai-open");
        label.classList.remove("mivai-hidden");
      } else {
        win.classList.add("mivai-open");
        label.classList.add("mivai-hidden");
      }
    }

    launcher.addEventListener("click", toggleWindow);
    closeBtn.addEventListener("click", toggleWindow);
    label.addEventListener("click", toggleWindow);

    function appendMessage(text, role) {
      const wrapper = document.createElement("div");
      wrapper.className =
        "mivai-chat-msg " +
        (role === "user" ? "mivai-chat-msg-user" : "mivai-chat-msg-bot");
      const bubble = document.createElement("div");
      bubble.className =
        "mivai-chat-bubble " +
        (role === "user"
          ? "mivai-chat-bubble-user"
          : "mivai-chat-bubble-bot");

      if (role === "bot") {
        // Trasforma "Prenota qui: URL" in link "Clicca qui"
        const match = text.match(/Prenota qui:\s*(https?:\/\/\S+)/i);
        if (match) {
          const before = text.slice(0, match.index).trim();
          if (before) {
            bubble.appendChild(document.createTextNode(before + " "));
          } else {
            bubble.appendChild(
              document.createTextNode("👉 Prenota qui: ")
            );
          }

          const url = match[1];
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Clicca qui";
          link.className = "mivai-chat-link";
          bubble.appendChild(link);

          const after = text
            .slice(match.index + match[0].length)
            .trim();
          if (after) {
            bubble.appendChild(document.createTextNode(" " + after));
          }
        } else {
          bubble.textContent = text;
        }
      } else {
        bubble.textContent = text;
      }

      wrapper.appendChild(bubble);
      messagesEl.appendChild(wrapper);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      if (typingEl) return;
      typingEl = document.createElement("div");
      typingEl.className = "mivai-typing";
      typingEl.innerHTML = `
        <div class="mivai-typing-dot"></div>
        <div class="mivai-typing-dot"></div>
        <div class="mivai-typing-dot"></div>
      `;
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }
      typingEl = null;
    }

    async function sendToBackend(text) {
      showTyping();
      isSending = true;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId,
            projectId: PROJECT_ID,
            pageUrl: window.location.href,
          }),
        });

        const data = await res.json().catch(() => null);
        hideTyping();
        isSending = false;

        if (!res.ok || !data) {
          appendMessage(
            "Ci sono problemi di connessione, riprova tra poco.",
            "bot"
          );
          return;
        }

        if (data.conversationId) {
          conversationId = data.conversationId;
        }

        appendMessage(
          data.reply || "Ops, nessuna risposta ricevuta.",
          "bot"
        );
      } catch (err) {
        console.error(err);
        hideTyping();
        isSending = false;
        appendMessage("Errore di rete, riprova tra poco.", "bot");
      }
    }

    function handleUserMessage(text) {
      const clean = text.trim();
      if (!clean || isSending) return;
      hideQuickReplies();
      appendMessage(clean, "user");
      sendToBackend(clean);
    }

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = "";
      handleUserMessage(text);
    });

    // Primo messaggio + quick replies
    setTimeout(() => {
      appendMessage(
        "Ciao! 👋 Sono l'assistente AI dell'hotel. Come posso aiutarti?",
        "bot"
      );
      renderQuickReplies();
    }, 600);
  })();
});
