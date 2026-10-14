/* Private, browser-only troubleshooting progress. No analytics, request, or storage. */
(() => {
 const root=document.querySelector(".brte-guided-checklist");
 if(!root)return;
 const steps=[...root.querySelectorAll('input[type="checkbox"][data-check-step]')];
 const status=root.querySelector(".brte-checklist-status");
 const update=()=>{
   const done=steps.filter(x=>x.checked).length;
   if(status)status.textContent=done+" de "+steps.length+" verificações concluídas";
 };
 steps.forEach(step=>step.addEventListener("change",update));
 update();
})();
