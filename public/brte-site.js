/* Navbar behavior shared by the HTML-only, crawler-friendly Q&A pages. */
(() => {
  const root = document.documentElement;
  const translations = {
    "pt-BR": { help:"Central de Ajuda", track:"Acompanhar caso", open:"Abrir atendimento", light:"Ativar tema claro", dark:"Ativar tema escuro", openMenu:"Abrir menu", closeMenu:"Fechar menu", languageNote:"Os artigos desta Central de Ajuda estão disponíveis em português." },
    "en": { help:"Help Center", track:"Track my case", open:"Open a case", light:"Use light theme", dark:"Use dark theme", openMenu:"Open menu", closeMenu:"Close menu", languageNote:"These support articles are currently available in Portuguese." },
    "es-419": { help:"Centro de Ayuda", track:"Seguir mi caso", open:"Nuevo caso", light:"Activar tema claro", dark:"Activar tema oscuro", openMenu:"Abrir menú", closeMenu:"Cerrar menú", languageNote:"Estos artículos de ayuda están disponibles actualmente en portugués." },
    "zh-CN": { help:"帮助中心", track:"查询服务单", open:"新建服务单", light:"切换浅色模式", dark:"切换深色模式", openMenu:"打开菜单", closeMenu:"关闭菜单", languageNote:"当前帮助文章以葡萄牙语提供。" },
  };
  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private browsing */ } };
  const browser = navigator.language.toLowerCase();
  const defaultLanguage = browser.startsWith("pt") ? "pt-BR" : browser.startsWith("es") ? "es-419" : browser.startsWith("zh") ? "zh-CN" : "en";
  const choice = read("aftercare-language");
  let language = Object.hasOwn(translations, choice) ? choice : defaultLanguage;
  let theme = read("brte-theme") === "dark" ? "dark" : "light";
  const menu = document.getElementById("brte-primary-nav");
  const menuButton = document.querySelector(".brte-menu-toggle");
  const languageSelect = document.getElementById("brte-language-select");
  const themeButton = document.querySelector(".brte-theme-toggle");
  const themeSymbol = document.querySelector(".brte-theme-symbol");
  const translation = () => translations[language] || translations.en;
  function updateLabels() {
    const t = translation();
    for (const el of document.querySelectorAll("[data-nav-key]")) {
      const key = el.getAttribute("data-nav-key");
      if (Object.hasOwn(t, key)) el.textContent = t[key];
    }
    if (languageSelect) languageSelect.value = language;
    const note = document.querySelector(".brte-language-note");
    if (note) note.textContent = t.languageNote;
    updateTheme();
    if (menuButton) menuButton.setAttribute("aria-label", menuButton.getAttribute("aria-expanded") === "true" ? t.closeMenu : t.openMenu);
  }
  function updateTheme() {
    root.dataset.brteTheme = theme;
    const t = translation();
    if (themeButton) {
      themeButton.setAttribute("aria-label", theme === "light" ? t.dark : t.light);
      themeButton.title = theme === "light" ? t.dark : t.light;
    }
    if (themeSymbol) themeSymbol.textContent = theme === "light" ? "☾" : "☀";
  }
  function closeMenu() {
    menu?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (menuButton) menuButton.setAttribute("aria-label", translation().openMenu);
  }
  root.dataset.brteTheme = theme;
  updateLabels();
  languageSelect?.addEventListener("change", (event) => {
    const value = event.target.value;
    if (!Object.hasOwn(translations, value)) return;
    language = value;
    write("aftercare-language", language);
    updateLabels();
  });
  themeButton?.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    write("brte-theme", theme);
    updateTheme();
  });
  menuButton?.addEventListener("click", () => {
    const opened = menu?.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", opened ? "true" : "false");
    menuButton.setAttribute("aria-label", opened ? translation().closeMenu : translation().openMenu);
  });
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !event.target.parentElement?.closest(".brte-site-header")) closeMenu();
  });
})();
