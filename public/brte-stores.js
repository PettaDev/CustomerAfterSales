/* Progressive-enhancement store locator. Current address stays in static HTML for SEO
   and offline resilience. Future approved stores are read from locations.json. */
(() => {
 const root=document.querySelector(".brte-points");
 const staticCard=root?.querySelector(".points-detail");
 if(!staticCard)return;
 const allTexts={
  "pt-BR":{search:"Buscar por cidade, bairro, endereço ou loja",placeholder:"Ex.: São Paulo, Galeria Pagé",
   state:"Estado",brand:"Marca",all:"Todas",results:n=>n===1?"1 local cadastrado":n+" locais cadastrados",
   empty:"Nenhum ponto de apoio encontrado para esses filtros.",services:"Serviços disponíveis sujeitos a confirmação",
   address:"Endereço informado pela equipe — confirme antes de visitar",maps:"Ver no Google Maps ↗",visit:"Confirmar antes de visitar"},
  en:{search:"Search by city, neighborhood, address or store",placeholder:"e.g. São Paulo, Galeria Pagé",
   state:"State",brand:"Brand",all:"All",results:n=>n===1?"1 location listed":n+" locations listed",
   empty:"No support locations match your filters.",services:"Available services must be confirmed",
   address:"Address provided by our team — confirm before visiting",maps:"View on Google Maps ↗",visit:"Confirm before visiting"},
  "es-419":{search:"Buscar por ciudad, barrio, dirección o tienda",placeholder:"Ej.: São Paulo, Galeria Pagé",
   state:"Estado",brand:"Marca",all:"Todas",results:n=>n===1?"1 ubicación registrada":n+" ubicaciones registradas",
   empty:"No encontramos puntos que coincidan.",services:"Los servicios disponibles deben confirmarse",
   address:"Dirección proporcionada por el equipo — confirme antes de visitar",maps:"Ver en Google Maps ↗",visit:"Confirme antes de visitar"},
  "zh-CN":{search:"按城市、社区、地址或门店搜索",placeholder:"例如：São Paulo、Galeria Pagé",
   state:"州",brand:"品牌",all:"全部",results:n=>n+" 个支持地点",
   empty:"未找到符合条件的地点。",services:"服务内容需事先确认",
   address:"地址由团队提供，前往前请确认",maps:"在 Google 地图中查看 ↗",visit:"前往前请先确认"},
 };
 const normalized=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const currentLocale=()=>{try{let l=localStorage.getItem("aftercare-language");return Object.hasOwn(allTexts,l)?l:"pt-BR"}catch{return "pt-BR"}};
 const toolbar=document.createElement("section");
 toolbar.className="brte-stores-filters";
 const top=document.createElement("div");top.className="brte-stores-filter-grid";
 const searchWrap=document.createElement("label");
 const searchTitle=document.createElement("span");
 const search=document.createElement("input");
 search.type="search";search.id="brte-store-search";search.autocomplete="off";
 searchWrap.append(searchTitle,search);
 const stateWrap=document.createElement("label");
 const stateTitle=document.createElement("span");
 const stateSelect=document.createElement("select");
 stateSelect.id="brte-store-state";
 stateWrap.append(stateTitle,stateSelect);
 const brandWrap=document.createElement("label");
 const brandTitle=document.createElement("span");
 const brandSelect=document.createElement("select");
 brandSelect.id="brte-store-brand";
 brandWrap.append(brandTitle,brandSelect);
 top.append(searchWrap,stateWrap,brandWrap);
 const count=document.createElement("p");count.className="brte-stores-count";count.setAttribute("role","status");count.setAttribute("aria-live","polite");
 const empty=document.createElement("p");empty.className="brte-stores-empty";empty.hidden=true;
 toolbar.append(top,count,empty);
 staticCard.before(toolbar);
 const list=document.createElement("div");list.className="brte-stores-list";staticCard.before(list);
 list.append(staticCard);
 let records=[{id:"br-sp-page-001",label:"Loja Infinix — Galeria Pagé",brand:"infinix",city:"São Paulo",state:"SP",
  country:"BR",addressLine:"Rua Comendador Afonso Kherlakian, 79",venue:"Galeria Pagé",units:"Lojas 11/12",
  district:"Centro Histórico",postalCode:"01023-040"}];
 staticCard.dataset.locationId=records[0].id;
 const cards=new Map([[records[0].id,staticCard]]);
 const cleanStore=record=>{
  if(!record||typeof record!=="object")return null;
  const mandatory=["id","label","brand","city","state","country","addressLine"];
  if(mandatory.some(k=>typeof record[k]!=="string"||!record[k].trim()))return null;
  if(!["infinix","tecno","itel"].includes(record.brand)||record.country!=="BR")return null;
  if(!/^[a-z0-9-]{5,90}$/.test(record.id))return null;
  return record;
 };
 function element(tag,cls,value){
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(value!=null)n.textContent=value;return n;
 }
 function dynamicCard(record){
  const tr=allTexts[currentLocale()];
  const card=element("article","points-detail");
  card.dataset.locationId=record.id;
  const visual=element("div","points-visual");
  const img=element("img");img.alt=record.brand;img.width=280;img.height=70;
  // Only allow approved same-origin image paths; never arbitrary external media.
  img.src=typeof record.photo==="string" && /^\/store-photos\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)$/.test(record.photo)
    ? record.photo : "/brandmarks/"+record.brand+".svg";
  visual.append(img,element("span","points-placeholder",record.photo?"":tr.services));
  const info=element("div","points-info");
  info.append(element("span","points-kicker",record.city+" · "+record.state));
  info.append(element("h2","",record.label));
  const address=element("address");
  address.append(element("strong","",record.addressLine));
  for(const piece of [record.venue,record.floor,record.units,record.district,record.city+" — "+record.state,record.postalCode])
   if(piece)address.append(element("span","points-address-sub",piece));
  info.append(address);
  const state=element("div","points-state");state.setAttribute("role","note");
  state.append(element("strong","",tr.address),element("span","",tr.services));info.append(state);
  const buttons=element("div","points-buttons");
  const map=element("a","points-map",tr.maps);map.target="_blank";map.rel="noopener noreferrer";
  map.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(
    [record.addressLine,record.venue,record.city,record.state,"Brasil"].filter(Boolean).join(", "));
  buttons.append(map);
  info.append(buttons);card.append(visual,info);return card;
 }
 function updateSelect(select,items,allText){
   const choice=select.value;
   select.replaceChildren();
   const all=element("option","",allText);all.value="";select.append(all);
   items.forEach(k=>{const opt=element("option","",k==="infinix"?"Infinix":k==="tecno"?"TECNO":k==="itel"?"itel":k);opt.value=k;select.append(opt)});
   select.value=items.includes(choice)?choice:"";
 }
 function render(){
  const t=allTexts[currentLocale()];
  searchTitle.textContent=t.search;search.placeholder=t.placeholder;stateTitle.textContent=t.state;
  brandTitle.textContent=t.brand;empty.textContent=t.empty;
  const states=[...new Set(records.map(x=>x.state))].sort();
  const brands=[...new Set(records.map(x=>x.brand))].sort();
  updateSelect(stateSelect,states,t.all);updateSelect(brandSelect,brands,t.all);
  const query=normalized(search.value);
  let visible=0;
  records.forEach(record=>{
    let node=cards.get(record.id);
    if(!node)return;
    const field=[record.city,record.state,record.addressLine,record.venue,record.units,record.district,
      record.postalCode,record.label,record.brand].join(" ");
    const match=(!query||normalized(field).includes(query)) &&
       (!stateSelect.value||record.state===stateSelect.value) &&
       (!brandSelect.value||record.brand===brandSelect.value);
    node.hidden=!match;
    if(match)visible++;
    if(node!==staticCard){
      node.querySelector(".points-state strong").textContent=t.address;
      node.querySelector(".points-state span").textContent=t.services;
      node.querySelector(".points-map").textContent=t.maps;
      const placeholder=node.querySelector(".points-placeholder");
      if(placeholder && !record.photo)placeholder.textContent=t.services;
    }
  });
  count.textContent=t.results(visible);empty.hidden=visible!==0;
 }
 const refresh=async()=>{
  try{
    const response=await fetch("/pontos-de-apoio/locations.json",{headers:{Accept:"application/json"}});
    if(!response.ok)return;
    const data=await response.json();
    if(!Array.isArray(data.locations))return;
    const unique=new Map();
    data.locations.forEach(entry=>{const valid=cleanStore(entry);if(valid)unique.set(valid.id,valid)});
    if(!unique.has("br-sp-page-001"))unique.set(records[0].id,records[0]);
    records=[...unique.values()];
    for(const record of records){
      if(cards.has(record.id))continue;
      const card=dynamicCard(record);
      cards.set(record.id,card);list.append(card);
    }
    render();
  }catch{ /* Static first store remains available even without API/JSON. */ }
 };
 search.addEventListener("input",render);
 stateSelect.addEventListener("change",render);
 brandSelect.addEventListener("change",render);
 document.addEventListener("brte:language-changed",render);
 render();
 void refresh();
})();
