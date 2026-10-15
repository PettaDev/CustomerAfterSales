/* Client-only guide progress. No logging, network, cookies or persistent tracking. */
(() => {
  const container=document.querySelector(".brte-guided-checklist");
  if(!container)return;
  const steps=[...container.querySelectorAll('input[type="checkbox"][data-check-step]')];
  const status=container.querySelector(".brte-checklist-status");
  if(!steps.length || !status)return;
  const readLanguage=()=>{try{return localStorage.getItem("aftercare-language")||document.documentElement.lang||"pt-BR";}catch{return document.documentElement.lang||"pt-BR";}};
  const update=()=>{
    const done=steps.filter(step=>step.checked).length;
    const lang=readLanguage();
    const format=window.BRTE_I18N_DATA?.[lang]?.["guide.checklistStatus"]||"{done} de {total} verificações concluídas";
    status.textContent=format.replace("{done}",String(done)).replace("{total}",String(steps.length));
  };
  steps.forEach(step=>step.addEventListener("change",update));
  window.addEventListener("brte:language",update);
  update();
})();
