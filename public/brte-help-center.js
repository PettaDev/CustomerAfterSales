/* Client-side category filters for the public, SEO-friendly Help Center.
   All article text stays readable without JavaScript. No search query is sent remotely. */
(() => {
  const input = document.querySelector("#search");
  const grid = document.querySelector("#articles");
  if (!input || !grid) return;
  const cards = Array.from(grid.querySelectorAll(".card"));
  const categories = ["all", "wifi", "app", "network", "battery", "update"];
  const slugs = ["wifi-desconecta","aplicativo-fecha","rede-movel-sms",
    "aquecimento-bateria","atualizacao-sistema"];
  const labels = {
    "pt-BR": {all:"Todos",count:n=>n===1?"1 guia encontrado":n+" guias encontrados"},
    en: {all:"All topics",count:n=>n===1?"1 guide found":n+" guides found"},
    "es-419": {all:"Todos",count:n=>n===1?"1 guía encontrada":n+" guías encontradas"},
    "zh-CN": {all:"全部主题",count:n=>n+" 个指南"},
  };
  const synonyms = {
    wifi:"roteador wireless internet wifi wi-fi conexão desconecta 断网 路由器 red inalámbrica router",
    app:"app aplicativo aplicação fecha fecha sozinho crash erro travar travamento 应用 闪退 aplicación",
    network:"rede móvel 4g 5g sim chip operadora sms dados chamadas sem sinal sin señal red móvil 手机信号",
    battery:"bateria quente calor aquece carregando duração temperatura battery 电池 发热 batería caliente",
    update:"atualização atualização ota software sistema xos android firmware patch update 更新 升级 actualización",
  };
  const toolbar = document.createElement("div");
  toolbar.className = "brte-help-filterbar";
  toolbar.setAttribute("role","group");
  const summary=document.createElement("p");
  summary.className="brte-help-results";
  summary.setAttribute("role","status");
  summary.setAttribute("aria-live","polite");
  grid.parentElement.insertBefore(toolbar,grid);
  grid.parentElement.insertBefore(summary,grid);
  let active="all";

  const readLocale=()=>{
    try { const value=localStorage.getItem("aftercare-language");
      return Object.prototype.hasOwnProperty.call(labels,value)?value:"pt-BR";
    } catch { return "pt-BR"; }
  };
  const normalize=(v)=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

  const filter=()=>{
    const q=normalize(input.value);
    let shown=0;
    cards.forEach((card,i)=>{
      const category=categories[i+1];
      const searchable=normalize([card.dataset.search,card.textContent,synonyms[category]].join(" "));
      const visible=(active==="all"||active===category)&&(!q||searchable.includes(q));
      card.classList.toggle("hidden",!visible);
      if(visible)shown++;
    });
    const empty=document.getElementById("empty");
    if(empty)empty.classList.toggle("hidden",shown!==0);
    summary.textContent=labels[readLocale()].count(shown);
  };

  const render=()=>{
    const lang=readLocale();
    const translations=window.BRTE_I18N_DATA?.[lang]||{};
    toolbar.replaceChildren();
    categories.forEach((category,i)=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="brte-help-filter"+(active===category?" is-active":"");
      button.setAttribute("aria-pressed",String(active===category));
      button.textContent=i===0?labels[lang].all:
        translations["card."+category+".category"] ||
        cards[i-1]?.querySelector(".tag")?.textContent || category;
      button.addEventListener("click",()=>{
        active=category;
        render();
        filter();
      });
      toolbar.appendChild(button);
    });
    filter();
  };
  input.addEventListener("input",filter);
  document.addEventListener("brte:language-changed",render);
  render();
})();
