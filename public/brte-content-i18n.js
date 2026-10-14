/* Static BRTE pages remain Portuguese HTML for SEO; translate human-visible content at runtime.
   Never use unsafe HTML insertion or a network translation API. */
(() => {
  const originals = new WeakMap();
  const titles = { "pt-BR": document.title };
  const available = window.BRTE_I18N_DATA || {};
  const isLegal = /^\/(privacy|cookies)\/?$/.test(location.pathname);

  function apply(locale) {
    const language = Object.prototype.hasOwnProperty.call(available, locale) ? locale : "pt-BR";
    const dict = available[language] || {};
    for (const node of document.querySelectorAll("[data-brte-text]")) {
      if (!originals.has(node)) originals.set(node, node.textContent);
      const key = node.getAttribute("data-brte-text");
      node.textContent = dict[key] ?? originals.get(node);
    }
    for (const node of document.querySelectorAll("[data-brte-placeholder]")) {
      if (!originals.has(node)) originals.set(node, node.getAttribute("placeholder"));
      const key = node.getAttribute("data-brte-placeholder");
      node.setAttribute("placeholder", dict[key] ?? originals.get(node));
    }
    const tagline = document.querySelector(".brte-brand-type small");
    if (tagline) {
      if (!originals.has(tagline)) originals.set(tagline, tagline.textContent);
      tagline.textContent = dict["common.brand"] ?? originals.get(tagline);
    }
    const footer = document.querySelector("main footer");
    if (footer) {
      const links = {"/privacy/":"common.privacy","/cookies/":"common.cookies","/ajuda/":"common.help","/pontos-de-apoio/":"common.locations","/":"common.newCase"};
      for (const link of footer.querySelectorAll("a[href]")) {
        const key=links[link.getAttribute("href")];
        if (!key) continue;
        if (!originals.has(link)) originals.set(link, link.textContent);
        link.textContent = dict[key] ?? originals.get(link);
      }
    }
    const prefix=location.pathname.includes("pontos-de-apoio") ? "store" :
      location.pathname==="/ajuda/" || location.pathname==="/ajuda" ? "help" :
      location.pathname.startsWith("/ajuda/") ? "guide."+location.pathname.split("/")[2] : "";
    const localizedTitle=dict[prefix+".title"];
    document.title = localizedTitle ? localizedTitle+" | BRTE" : titles["pt-BR"];
    const input = document.querySelector("#search");
    if (input) {
      for (const card of document.querySelectorAll("#articles .card")) {
        if (!card.dataset.originalSearch) card.dataset.originalSearch=card.dataset.search || "";
        card.dataset.search=language==="pt-BR" ? card.dataset.originalSearch :
          Array.from(card.querySelectorAll("h2,p,.tag")).map(el=>el.textContent).join(" ").toLowerCase()+" "+card.dataset.originalSearch;
      }
      input.dispatchEvent(new Event("input", {bubbles: true}));
    }
    // The legal drafts still have a Portuguese-only legally reviewed source. Do not
    // pretend that translating navigation makes a legally authoritative translation.
    document.documentElement.lang = isLegal ? "pt-BR" : language;
    const note = document.querySelector(".brte-language-note");
    if (note) {
      if (isLegal && language!=="pt-BR") {
        const notices={
          en:"This legal document is currently available in Portuguese. For assistance in English, contact gustavo.petta@transsion.com.",
          "es-419":"Este documento legal está disponible actualmente en portugués. Para ayuda en español, escriba a gustavo.petta@transsion.com.",
          "zh-CN":"本法律文件目前仅提供葡萄牙语版本。如需中文协助，请联系 gustavo.petta@transsion.com。"
        };
        note.textContent=notices[language] || ""; note.hidden=false;
      } else {
        note.hidden=true;
      }
    }
  }
  window.BRTEContentI18n={apply};
})();
