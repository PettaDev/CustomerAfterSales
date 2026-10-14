/* BRTE localized help search/filter. No personal input is sent or stored. */
(() => {
 const search=document.getElementById("search");
 const cards=[...document.querySelectorAll("#articles .card[data-topic-id]")];
 const filters=[...document.querySelectorAll(".brte-topic-filters button[data-topic]")];
 const empty=document.getElementById("empty");
 const count=document.getElementById("results-count");
 if(!search || !cards.length || !count) return;
 let topic="all";
 const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();
 const update=()=>{
   const term=normalize(search.value);
   let total=0;
   for(const card of cards){
     const haystack=normalize((card.dataset.search||"")+" "+card.textContent);
     const visible=(topic==="all"||card.dataset.topicId===topic)&&haystack.includes(term);
     card.classList.toggle("hidden",!visible);
     if(visible)total++;
   }
   const lang=localStorage.getItem("aftercare-language")||"pt-BR";
   const table=window.BRTE_I18N_DATA?.[lang]||{};
   const key=total===1?"help.resultOne":"help.resultMany";
   const fallback=total===1?"{count} guia encontrado":"{count} guias encontrados";
   count.textContent=(table[key]||fallback).replace("{count}",String(total));
   if(empty)empty.classList.toggle("hidden",total!==0);
 };
 filters.forEach(button=>button.addEventListener("click",()=>{
   topic=button.dataset.topic||"all";
   filters.forEach(option=>option.setAttribute("aria-pressed",String(option===button)));
   update();
 }));
 search.addEventListener("input",update);
 window.addEventListener("brte:language",update);
 update();
})();
