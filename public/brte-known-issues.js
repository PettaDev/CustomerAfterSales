(() => {
 const message=document.getElementById("known-language");
 if(!message)return;
 const notes={
   en:"This known-issue notice is currently available in Portuguese. Contact the BRTE team for assistance in English.",
   "es-419":"Este aviso sobre problemas conocidos está disponible actualmente en portugués. Contacte al equipo BRTE para recibir ayuda en español.",
   "zh-CN":"此已知问题公告目前仅提供葡萄牙语版本。如需中文协助，请联系 BRTE 支持团队。"
 };
 const update=()=>{
   let language="pt-BR";
   try { language=localStorage.getItem("aftercare-language")||"pt-BR"; } catch {}
   message.hidden=language==="pt-BR";
   message.textContent=notes[language]||"";
 };
 document.addEventListener("brte:language-changed",update);
 update();
})();
