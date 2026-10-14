/* Anonymous, optional article ratings; never sends personal details or a search query. */
(() => {
 const widget=document.querySelector(".brte-guide-feedback[data-article]");
 if(!widget)return;
 const voteButtons=Array.from(widget.querySelectorAll("[data-helpful]"));
 const question=widget.querySelector(".brte-feedback-question");
 const detail=widget.querySelector(".brte-feedback-detail");
 const status=widget.querySelector(".brte-feedback-status");
 const i18n={
  "pt-BR":{question:"Esta orientação ajudou?",detail:"Sua resposta nos ajuda a melhorar os guias. Nenhum dado pessoal é solicitado.",
    yes:"Sim, ajudou",no:"Ainda preciso de ajuda",thanks:"Obrigado! Sua avaliação foi registrada.",error:"Não foi possível registrar agora. Você ainda pode abrir um atendimento.",already:"Sua avaliação já foi recebida.",case:"Abrir atendimento"},
  en:{question:"Was this guide helpful?",detail:"Your feedback helps improve the guides. No personal details are requested.",
    yes:"Yes, it helped",no:"I still need help",thanks:"Thank you! Your feedback was recorded.",error:"Could not send feedback now. You can still open a case.",already:"Your rating was already received.",case:"Open a support case"},
  "es-419":{question:"¿Le resultó útil esta guía?",detail:"Su respuesta nos ayuda a mejorar las guías. No solicitamos datos personales.",
    yes:"Sí, me ayudó",no:"Todavía necesito ayuda",thanks:"¡Gracias! Registramos su respuesta.",error:"No pudimos registrar la respuesta. Aún puede abrir un caso.",already:"Su evaluación ya fue recibida.",case:"Abrir un caso"},
  "zh-CN":{question:"这份指南对您有帮助吗？",detail:"您的反馈有助于改进指南，无需提供个人信息。",
    yes:"有帮助",no:"仍需要帮助",thanks:"感谢您的反馈！已成功记录。",error:"暂时无法提交反馈。您仍可创建服务单。",already:"已收到您的评价。",case:"创建服务单"}
 };
 const getLocale=()=>{try{const v=localStorage.getItem("aftercare-language");return Object.hasOwn(i18n,v)?v:"pt-BR";}catch{return "pt-BR"}};
 function translate(){
   const t=i18n[getLocale()];
   question.textContent=t.question;detail.textContent=t.detail;
   voteButtons[0].textContent=t.yes;voteButtons[1].textContent=t.no;
   const caseLink=widget.querySelector(".brte-feedback-case");
   if(caseLink)caseLink.textContent=t.case+" ↗";
   const state=status.dataset.state;
   if(state)status.textContent=t[state]||"";
 }
 const slug=widget.dataset.article;
 async function submit(helpful){
   voteButtons.forEach(x=>x.disabled=true);
   const locale=getLocale(),t=i18n[locale];
   status.setAttribute("role","status");
   try{
     const response=await fetch("/api/help-feedback",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({slug,helpful,language:locale})
     });
     if(!response.ok){
       status.dataset.state=response.status===429?"already":"error";
       status.textContent=t[status.dataset.state];
       if(response.status!==429)voteButtons.forEach(x=>x.disabled=false);
       return;
     }
     status.dataset.state="thanks";
     status.textContent=t.thanks;
     widget.querySelector(".brte-feedback-case")?.classList.toggle("hidden",helpful);
   }catch{
     status.dataset.state="error";status.textContent=t.error;
     voteButtons.forEach(x=>x.disabled=false);
   }
 }
 voteButtons.forEach(button=>button.addEventListener("click",()=>submit(button.dataset.helpful==="true")));
 document.addEventListener("brte:language-changed",translate);
 translate();
})();
