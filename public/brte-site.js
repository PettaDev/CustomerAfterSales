/* Navbar behavior shared by the HTML-only, crawler-friendly Q&A pages. */
(() => {
  const root = document.documentElement;
  const translations = {
    "pt-BR": { help:"Central de Ajuda", locations:"Pontos de apoio", track:"Acompanhar caso", open:"Novo atendimento", light:"Ativar tema claro", dark:"Ativar tema escuro", openMenu:"Abrir menu", closeMenu:"Fechar menu", footerNavigation:"Atendimento", footerInformation:"Informações", footerSupport:"Pós-venda e suporte ao cliente", footerPrivacy:"Privacidade", footerCookies:"Cookies", footerTeam:"Área da equipe / TFAE", footerCredit:"Desenvolvido por Gustavo Petta - TL & TFAE at Transsion", languageNote:"Os artigos desta Central de Ajuda estão disponíveis em português." },
    "en": { help:"Help Center", locations:"Support locations", track:"Track my case", open:"Open a case", light:"Use light theme", dark:"Use dark theme", openMenu:"Open menu", closeMenu:"Close menu", footerNavigation:"Support", footerInformation:"Information", footerSupport:"After-sales customer support", footerPrivacy:"Privacy", footerCookies:"Cookies", footerTeam:"Team area / TFAE", footerCredit:"Developed by Gustavo Petta - TL & TFAE at Transsion", languageNote:"These support articles are currently available in Portuguese." },
    "es-419": { help:"Centro de Ayuda", locations:"Puntos de apoyo", track:"Seguir mi caso", open:"Nuevo caso", light:"Activar tema claro", dark:"Activar tema oscuro", openMenu:"Abrir menú", closeMenu:"Cerrar menú", footerNavigation:"Atención", footerInformation:"Información", footerSupport:"Posventa y soporte al cliente", footerPrivacy:"Privacidad", footerCookies:"Cookies", footerTeam:"Área del equipo / TFAE", footerCredit:"Desarrollado por Gustavo Petta - TL & TFAE at Transsion", languageNote:"Estos artículos de ayuda están disponibles actualmente en portugués." },
    "zh-CN": { help:"帮助中心", locations:"线下支持点", track:"查询服务单", open:"新建服务单", light:"切换浅色模式", dark:"切换深色模式", openMenu:"打开菜单", closeMenu:"关闭菜单", footerNavigation:"客户服务", footerInformation:"信息", footerSupport:"售后客户支持", footerPrivacy:"隐私政策", footerCookies:"Cookie 政策", footerTeam:"团队专区 / TFAE", footerCredit:"由 Gustavo Petta 开发 · Transsion TL & TFAE", languageNote:"当前帮助文章以葡萄牙语提供。" },
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
  const themeButton = document.querySelector(".brte-theme-toggle");
  const themeSymbol = document.querySelector(".brte-theme-symbol");
  const translation = () => translations[language] || translations.en;
  function updateLabels() {
    const t = translation();
    document.querySelectorAll(".brte-unified-footer .brte-footer-navigation").forEach((nav, index) => {
      nav.setAttribute("aria-label", index === 0 ? t.footerNavigation : t.footerInformation);
    });
    for (const el of document.querySelectorAll("[data-nav-key]")) {
      const key = el.getAttribute("data-nav-key");
      if (Object.hasOwn(t, key)) el.textContent = t[key];
    }
    const currentLanguage = document.querySelector(".brte-language-current");
    const label = {"pt-BR":"Português",en:"English","es-419":"Español","zh-CN":"简体中文"}[language];
    if (currentLanguage) currentLanguage.textContent=label;
    const details=document.querySelector(".brte-language-menu");
    for (const option of document.querySelectorAll(".brte-language-options [data-lang]")) {
      const selected=option.dataset.lang===language;
      option.setAttribute("aria-current", selected ? "true" : "false");
      const check=option.querySelector("span");
      if(check)check.textContent=selected?"✓":"";
    }
    const summary=details?.querySelector("summary");
    if(summary) summary.setAttribute("aria-label", language==="pt-BR"?"Idioma":language==="es-419"?"Idioma":language==="zh-CN"?"语言":"Language");
    window.BRTEContentI18n?.apply(language);
    window.dispatchEvent(new CustomEvent("brte:language", { detail: { language } }));
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
  document.querySelectorAll(".brte-language-options [data-lang]").forEach(button=>{
    button.addEventListener("click",()=>{
      const value=button.dataset.lang;
      if (!Object.hasOwn(translations,value))return;
      language=value;
      write("aftercare-language",language);
      document.querySelector(".brte-language-menu")?.removeAttribute("open");
      updateLabels();
    });
  });
  document.addEventListener("click",(event)=>{
    const dropdown=document.querySelector(".brte-language-menu");
    if (dropdown && !dropdown.contains(event.target))dropdown.removeAttribute("open");
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
