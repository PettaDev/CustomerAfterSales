export type Chipset = "mediatek" | "qualcomm" | "unisoc";

type StepContent = {
  title: string;
  description: string;
  items: string[];
  code?: string;
  image?: string;
  caution?: string;
};
const language = (l: string) => l.startsWith("pt") ? "pt" : l.startsWith("es") ? "es" : l.startsWith("zh") ? "zh" : "en";

const words = {
  pt: {
    app: "Coleta de logs sem computador", subtitle: "Selecione o processador do seu celular para seguir as instruções corretas.", choose: "Qual é o processador do aparelho?", warning: "A marca não determina o processador: modelos Infinix, TECNO e itel podem usar chips diferentes. Se não souber, confira as informações do aparelho ou pergunte ao suporte.",
    switch: "Trocar processador", previous: "Voltar", next: "Próxima etapa", done: "Finalizar guia", start: "Ver instruções", stage: "Etapa", steps: "Etapas", note: "Coleta avançada somente quando solicitada pela equipe de suporte. Os logs podem conter informações pessoais.", support: "Se o logger não abrir ou os arquivos não estiverem acessíveis, envie fotos/vídeo e solicite orientação ao TFAE. Não é necessário root nem desbloquear o bootloader.",
    fallback: "Se a cópia da pasta OEM apresentar 'Permission denied', NÃO faça root, NÃO apague logs e NÃO altere a ROM. Use a alternativa genérica abaixo; informe ao suporte que a pasta técnica estava protegida.", video: "O vídeo antigo foi retirado deste guia porque não permite ler os menus. Consulte os passos escritos e amplie as imagens disponíveis.", image: "Abrir imagem original", backHome: "Voltar ao BRTE", unknown: "Não sei meu processador", unknownInfo: "Não selecione uma plataforma aleatória. Confira o modelo/SoC em Configurações → Sobre o telefone ou fale com o suporte.", tip: "Mantenha o telefone desbloqueado, carregando se necessário, e na mesma rede Wi-Fi. Durante a transferência, não feche Termux ou bloqueie a tela.", paths: "Pasta OEM (pode estar protegida)", generic: "Alternativa genérica, quando os logs OEM não estiverem acessíveis:", success: "Guia concluído. Anexe os arquivos coletados ao atendimento BRTE, junto com o modelo e uma descrição do problema.",
    chips: {mediatek:"MediaTek (MTK)",qualcomm:"Qualcomm (Snapdragon)",unisoc:"SPD / Unisoc"},
    steps: [
      {title:"Prepare o celular",description:"Antes da coleta, confira os requisitos básicos.",items:["Android 11 ou posterior para depuração sem fio.","Pelo menos 30% de bateria e espaço livre para os arquivos.","Celular desbloqueado e conectado a uma rede Wi-Fi confiável."]},
      {title:"Ative as opções do desenvolvedor",description:"Habilite os controles de diagnóstico sem modificar o sistema.",items:["Abra Configurações → Sobre o telefone e toque repetidamente em Número da versão (ou Número da compilação).","Volte às Configurações e procure Opções do desenvolvedor. A posição pode variar entre modelos."]},
      {title:"Instale Termux e ADB",description:"Use Termux no próprio celular, sem computador.",items:["Instale uma versão confiável e atualizada do Termux.","Abra Termux, aguarde a preparação e execute os comandos abaixo, um de cada vez.","Conceda permissão de arquivos quando solicitada."]},
      {title:"Ative a depuração sem fio",description:"Emparelhe o ADB com o próprio telefone.",items:["Em Opções do desenvolvedor, ative Depuração sem fio (Wireless debugging).","Ative tela dividida ou janela flutuante para manter Configurações e Termux abertos.","Na depuração sem fio, toque em Emparelhar dispositivo com código."]},
      {title:"Emparelhe o ADB",description:"Use o IP, a porta de emparelhamento e o código exibidos no aparelho.",items:["Substitua IP, PAIR_PORT e CODE pelos valores exibidos na tela de emparelhamento.","A porta de emparelhamento não é necessariamente a porta de conexão."]},
      {title:"Conecte o ADB",description:"Conecte à porta principal da depuração sem fio.",items:["Volte à tela principal de Depuração sem fio e encontre Endereço IP e porta.","Substitua IP e DEBUG_PORT pelos valores atuais.","Confirme o estado 'device' no comando adb devices."]},
      {title:"Abra o logger correto",description:"Utilize apenas a ferramenta de diagnóstico do chipset escolhido.",items:[]},
      {title:"Inicie, reproduza e pare",description:"Colete evidências do problema com início e fim definidos.",items:[]},
      {title:"Exporte os registros",description:"Tente copiar os logs e confira o acesso à pasta.",items:[]},
      {title:"Envie as evidências",description:"Anexe os arquivos ao atendimento e finalize com segurança.",items:["Copie os arquivos de log válidos e, se possível, uma gravação de tela sem dados sensíveis.","Volte à aba do atendimento BRTE, anexe os arquivos e descreva o passo a passo da falha.","Desative a depuração sem fio depois da coleta."]},
    ],
    vendor: {
      mediatek: {
        access:["Abra DebugLoggerUI, presente em alguns aparelhos MediaTek. O menu e o atalho variam por firmware.","Caso não encontre DebugLoggerUI, o suporte deverá orientar a localização; não use menus de outras plataformas."],
        capture:["No DebugLoggerUI, habilite Mobile Log, Modem Log, Network Log e Connsys, quando disponíveis.","Inicie a gravação, reproduza o problema, volte ao logger e pare a coleta.","Aguarde a finalização antes de tentar copiar os arquivos."],
        export:["A pasta de diagnóstico MediaTek usada no BRTE costuma ser /data/debuglogger.","A exportação pode exigir permissões de sistema; caso negada, use a coleta genérica."],
        path:"/data/debuglogger", package:"com.debug.loggerui",
      },
      qualcomm: {
        access:["Abra TranLogManager se estiver instalado no aparelho Qualcomm.","Se o aplicativo não aparecer, não instale APKs desconhecidos nem tente atalhos de MediaTek."],
        capture:["Ative as categorias Mobile, Modem, Connectivity e Other disponíveis no TranLogManager.","Pressione START e aguarde alguns segundos. Reproduza a falha, depois pressione STOP.","Espere a finalização do logger antes de acessar os arquivos."],
        export:["Em aparelhos compatíveis, TranLogManager usa /data/debuglogger.","Acesso à pasta técnica pode ser bloqueado pelo firmware; use a alternativa genérica se necessário."],
        path:"/data/debuglogger", package:"com.transsion.TranLogManager",
        activity:"com.transsion.TranLogManager/.TranLogManageActivity",
      },
      unisoc: {
        access:["Abra YLog (com.sprd.logmanager), quando disponível no SPD/Unisoc.","No menu Custom, localize as opções AP, Modem, WCN e Other. Os nomes podem variar conforme o firmware."],
        capture:["Habilite as categorias AP, Modem, WCN e Other disponíveis.","Toque em START e espere a gravação iniciar. Reproduza o problema e depois toque em STOP.","Aguarde o YLog encerrar antes de copiar evidências."],
        export:["O YLog usa a pasta técnica /data/ylog em builds compatíveis.","Não apague arquivos antigos. Se a leitura falhar por permissão, use a alternativa genérica."],
        path:"/data/ylog",package:"com.sprd.logmanager",activity:"com.sprd.logmanager/.logui.LogMainActivity",
      },
    },
  },
  en: {
    app:"Collect logs without a computer",subtitle:"Select your phone's chipset to follow the correct instructions.",choose:"Which processor does your phone use?",warning:"The brand does not determine the processor. Infinix, TECNO and itel models can use different chips. Check the device details or ask support if unsure.",switch:"Change chipset",previous:"Previous",next:"Next step",done:"Finish guide",start:"View instructions",stage:"Step",steps:"Steps",note:"Only perform advanced collection when requested by support. Logs may contain personal data.",support:"If the logger fails to open or the files cannot be read, submit screenshots/video and ask the TFAE for guidance. Root access or bootloader unlocking is not required.",fallback:"If the OEM folder reports 'Permission denied', do NOT root the phone, delete old logs or change firmware. Use the generic fallback and tell support that the technical folder was protected.",video:"The old video is not included because its menus are unreadable. Follow the written steps and enlarge the available images.",image:"Open original image",backHome:"Return to BRTE",unknown:"I don't know my chipset",unknownInfo:"Do not guess. Find the processor in Settings → About phone or ask support.",tip:"Keep the phone unlocked and connected to Wi-Fi. Do not close Termux or lock the screen during transfer.",paths:"OEM folder (may be restricted)",generic:"Generic fallback when OEM logs are inaccessible:",success:"Guide completed. Attach the collected files, model and issue description to your BRTE case.",
    chips:{mediatek:"MediaTek (MTK)",qualcomm:"Qualcomm (Snapdragon)",unisoc:"SPD / Unisoc"},
    steps:[
      {title:"Prepare your phone",description:"Check the basic requirements before starting.",items:["Android 11 or newer for wireless debugging.","At least 30% battery and enough free storage.","Keep the phone unlocked on a trusted Wi-Fi network."]},
      {title:"Enable Developer options",description:"Enable diagnostic controls without modifying the system.",items:["Open Settings → About phone, and repeatedly tap Build number.","Return to Settings and find Developer options. Menu paths vary by model."]},
      {title:"Install Termux and ADB",description:"Use Termux directly on your phone.",items:["Install a trusted, up-to-date Termux version.","Open Termux, allow initial setup and run the commands one at a time.","Grant file access when prompted."]},
      {title:"Enable wireless debugging",description:"Pair ADB with the phone itself.",items:["Turn on Wireless debugging in Developer options.","Use split screen or a floating window to keep Settings and Termux visible.","Select Pair device with pairing code."]},
      {title:"Pair ADB",description:"Use the pairing IP, port and code shown on the phone.",items:["Replace IP, PAIR_PORT and CODE with the pairing values on screen.","The pairing port is different from the main debugging port."]},
      {title:"Connect ADB",description:"Connect to the main wireless debugging port.",items:["Return to the Wireless debugging screen and find the IP address and port.","Replace IP and DEBUG_PORT with the current values.","Ensure the device shows as 'device' in adb devices."]},
      {title:"Open the correct logger",description:"Use only the logger for your selected chipset.",items:[]},
      {title:"Record and stop",description:"Reproduce the issue between the logger's start and stop.",items:[]},
      {title:"Export the evidence",description:"Attempt to copy the diagnostic logs.",items:[]},
      {title:"Submit evidence",description:"Upload available evidence safely.",items:["Keep valid logs and, where possible, a screen recording without sensitive information.","Return to the BRTE case tab and attach your files and reproduction steps.","Turn off wireless debugging after collection."]},
    ],
    vendor:{
      mediatek:{access:["Open DebugLoggerUI on supported MediaTek phones; its location varies by firmware.","Ask support if it is unavailable instead of using another chipset's menus."],capture:["Enable Mobile, Modem, Network and Connsys logging where present.","Start logging, reproduce the issue, return to DebugLoggerUI and stop.","Wait for finalization before copying files."],export:["Compatible MediaTek builds often use /data/debuglogger.","Firmware permissions may block access; use the generic fallback in that case."],path:"/data/debuglogger",package:"com.debug.loggerui"},
      qualcomm:{access:["Open TranLogManager when installed on a Qualcomm phone.","Do not install unknown APKs or follow MediaTek shortcuts if it is missing."],capture:["Enable Mobile, Modem, Connectivity and Other logging if available.","Press START and wait a few seconds, reproduce the issue, then press STOP.","Wait for logger finalization before exporting."],export:["Compatible TranLogManager builds use /data/debuglogger.","The firmware may restrict the OEM folder; use the generic fallback if necessary."],path:"/data/debuglogger",package:"com.transsion.TranLogManager",activity:"com.transsion.TranLogManager/.TranLogManageActivity"},
      unisoc:{access:["Open YLog (com.sprd.logmanager) if provided on SPD/Unisoc.","In Custom, find the AP, Modem, WCN and Other categories; labels vary by firmware."],capture:["Enable AP, Modem, WCN and Other where available.","Press START, wait for logging, reproduce the issue, and press STOP.","Wait for YLog to finish before copying evidence."],export:["Compatible YLog builds use /data/ylog.","Do not remove older files. If access is denied, use the generic fallback."],path:"/data/ylog",package:"com.sprd.logmanager",activity:"com.sprd.logmanager/.logui.LogMainActivity"},
    },
  },
} as const;

const es = {
  ...words.en, app:"Coleta de logs sin computadora",subtitle:"Elige el procesador de tu teléfono para seguir los pasos correctos.",choose:"¿Qué procesador tiene tu teléfono?",
  warning:"La marca no determina el procesador. Infinix, TECNO e itel pueden usar chips diferentes. Revisa los datos del dispositivo o pregunta a soporte.",
  switch:"Cambiar procesador", previous:"Anterior", next:"Siguiente paso",done:"Finalizar guía",start:"Ver instrucciones",stage:"Paso",steps:"Pasos",
  note:"Realiza la recopilación avanzada solo cuando soporte la solicite. Los registros pueden contener datos personales.",
  support:"Si la herramienta no abre o los archivos están protegidos, envía fotos o vídeo y pide ayuda al TFAE. No necesitas root ni desbloquear el bootloader.",
  fallback:"Si aparece 'Permission denied', NO hagas root, NO borres registros anteriores ni modifiques el sistema. Usa la alternativa genérica e informa a soporte.",
  video:"Se retiró el vídeo antiguo porque los menús no eran legibles. Consulta los pasos y las imágenes ampliables.",
  image:"Abrir imagen",backHome:"Volver a BRTE",unknown:"No sé qué procesador tengo",
  unknownInfo:"No elijas al azar. Comprueba el procesador en Ajustes → Acerca del teléfono o pregunta a soporte.",
  tip:"Mantén el teléfono desbloqueado, conectado a Wi-Fi y con batería. No cierres Termux ni bloquees la pantalla durante la transferencia.",
  paths:"Carpeta OEM (puede estar protegida)",generic:"Alternativa genérica si los archivos OEM están protegidos:",
  success:"Guía completada. Adjunta los registros, el modelo y los detalles del problema a tu atención de BRTE.",
  chips:words.en.chips,
  steps:[
    {title:"Prepara el teléfono",description:"Comprueba los requisitos antes de empezar.",items:["Android 11 o posterior para depuración inalámbrica.","Al menos 30 % de batería y espacio libre.","Mantén el teléfono desbloqueado en una red Wi-Fi de confianza."]},
    {title:"Activa opciones de desarrollador",description:"Habilita controles sin modificar el sistema.",items:["En Ajustes → Acerca del teléfono, toca varias veces Número de compilación.","Busca Opciones de desarrollador en Ajustes; la ubicación depende del modelo."]},
    {title:"Instala Termux y ADB",description:"Utiliza Termux directamente en el móvil.",items:["Instala una versión actualizada y fiable de Termux.","Ábrela y ejecuta cada comando por separado.","Permite el acceso a los archivos cuando se solicite."]},
    {title:"Activa depuración inalámbrica",description:"Empareja ADB con el mismo teléfono.",items:["Activa Depuración inalámbrica en Opciones de desarrollador.","Usa pantalla dividida para abrir Ajustes y Termux.","Selecciona Emparejar dispositivo mediante código."]},
    {title:"Empareja ADB",description:"Usa la IP, el puerto y el código que muestra el dispositivo.",items:["Sustituye IP, PAIR_PORT y CODE por los valores mostrados.","El puerto de emparejamiento es distinto al puerto principal."]},
    {title:"Conecta ADB",description:"Usa el puerto de depuración inalámbrica.",items:["Vuelve a la pantalla principal de Depuración inalámbrica.","Sustituye IP y DEBUG_PORT por los valores actuales.","Comprueba que aparezca 'device' en adb devices."]},
    {title:"Abre el logger correcto",description:"Usa exclusivamente la herramienta de tu procesador.",items:[]},
    {title:"Graba y detén",description:"Reproduce el problema entre START y STOP.",items:[]},
    {title:"Exporta los archivos",description:"Intenta copiar los registros técnicos.",items:[]},
    {title:"Envía evidencias",description:"Adjunta los archivos disponibles de forma segura.",items:["Guarda los registros y, si es posible, un vídeo sin datos sensibles.","Vuelve a la pestaña de BRTE, adjunta los archivos y explica el problema.","Desactiva la depuración inalámbrica al terminar."]},
  ],
  vendor:{
    mediatek:{...words.en.vendor.mediatek,access:["Abre DebugLoggerUI en teléfonos MediaTek compatibles; el menú varía.","Si no aparece, pregunta a soporte y no utilices menús de otros procesadores."],capture:["Activa Mobile, Modem, Network y Connsys si existen.","Inicia la captura, reproduce el problema y pulsa STOP.","Espera a que finalice antes de copiar."],export:["La carpeta habitual es /data/debuglogger.","Puede estar protegida por el sistema: usa la alternativa genérica si falla."]},
    qualcomm:{...words.en.vendor.qualcomm,access:["Abre TranLogManager si está instalado en un Qualcomm.","Si falta, no instales APK desconocidas ni sigas instrucciones MediaTek."],capture:["Activa Mobile, Modem, Connectivity y Other disponibles.","Pulsa START, espera, reproduce el problema y pulsa STOP.","Espera a que el logger termine antes de exportar."],export:["TranLogManager suele guardar archivos en /data/debuglogger.","Si la carpeta está protegida, usa la alternativa genérica."]},
    unisoc:{...words.en.vendor.unisoc,access:["Abre YLog (com.sprd.logmanager) si está disponible.","En Custom, localiza AP, Modem, WCN y Other según tu firmware."],capture:["Activa AP, Modem, WCN y Other cuando aparezcan.","Pulsa START, reproduce el fallo y pulsa STOP.","Espera a que YLog se detenga antes de copiar."],export:["La carpeta YLog suele ser /data/ylog.","No borres los archivos antiguos. Si falla el acceso, usa la alternativa genérica."]},
  },
};
const zh = {
  ...words.en, app:"无需电脑收集日志",subtitle:"选择手机处理器，查看正确的日志采集步骤。",choose:"您的手机使用哪种处理器？",
  warning:"品牌不能决定芯片类型。Infinix、TECNO 和 itel 不同型号可能使用不同芯片。如不确定，请查看设备信息或询问客服。",
  switch:"更换处理器",previous:"上一步",next:"下一步",done:"完成指南",start:"查看步骤",stage:"步骤",steps:"操作步骤",
  note:"仅在支持团队要求时进行高级采集。日志可能包含个人信息。",
  support:"如果日志工具无法打开或文件没有权限，请提交截图/视频并联系技术支持。无需 Root 或解锁引导加载程序。",
  fallback:"出现 Permission denied 时，不要 Root、不要删除旧日志、不要修改系统。改用下面的通用日志方式并告知支持团队。",
  video:"旧视频中的菜单无法看清，因此已从指南中撤下。请查看文字步骤及可放大的截图。",
  image:"打开原图",backHome:"返回 BRTE",unknown:"我不知道处理器型号",
  unknownInfo:"不要随意选择。请在设置 → 关于手机中确认处理器信息，或联系支持团队。",
  tip:"保持手机解锁并连接 Wi-Fi；传输时不要关闭 Termux 或锁屏。",
  paths:"OEM 文件夹（可能受系统保护）",generic:"无法读取 OEM 文件时的通用替代方案：",
  success:"指南已完成。请将日志文件、设备型号和故障说明上传到 BRTE 服务单。",
  chips:words.en.chips,
  steps:[
    {title:"准备手机",description:"开始之前检查基本要求。",items:["无线调试需要 Android 11 或更新版本。","确保电量至少 30%，并预留存储空间。","保持手机解锁，连接可信 Wi-Fi。"]},
    {title:"开启开发者选项",description:"开启调试功能，无需修改系统。",items:["打开设置 → 关于手机，连续点击版本号。","返回设置，找到开发者选项；不同机型位置可能不同。"]},
    {title:"安装 Termux 和 ADB",description:"直接在手机上使用 Termux。",items:["安装可信来源的新版 Termux。","打开 Termux，依次执行下面的命令。","提示时授予文件访问权限。"]},
    {title:"开启无线调试",description:"将 ADB 与当前手机配对。",items:["在开发者选项中开启无线调试。","使用分屏同时显示设置和 Termux。","选择使用配对码配对设备。"]},
    {title:"ADB 配对",description:"使用手机显示的 IP、端口和配对码。",items:["将 IP、PAIR_PORT、CODE 替换为屏幕上的值。","配对端口与主调试端口可能不同。"]},
    {title:"连接 ADB",description:"连接到无线调试主端口。",items:["返回无线调试主页面，查看 IP 地址和端口。","将 IP、DEBUG_PORT 替换为当前值。","运行 adb devices，应显示 device。"]},
    {title:"打开对应日志工具",description:"只使用与处理器匹配的日志工具。",items:[]},
    {title:"开始并停止采集",description:"在开始和停止之间复现问题。",items:[]},
    {title:"导出日志文件",description:"尝试复制诊断日志。",items:[]},
    {title:"提交证据",description:"安全上传可访问的日志文件。",items:["保存有效日志，尽量避免个人敏感信息出现在录屏中。","返回 BRTE 服务单页面，上传文件并描述复现步骤。","完成后关闭无线调试。"]},
  ],
  vendor:{
    mediatek:{...words.en.vendor.mediatek,access:["在支持的 MediaTek 设备上打开 DebugLoggerUI，菜单因固件而异。","找不到时请联系支持，不要使用其他芯片的步骤。"],capture:["如有对应选项，启用 Mobile、Modem、Network 和 Connsys。","开始日志采集，复现故障后停止。","等待日志文件写入完成再复制。"],export:["兼容设备通常使用 /data/debuglogger。","如果目录受系统权限限制，请使用通用替代方案。"]},
    qualcomm:{...words.en.vendor.qualcomm,access:["如果 Qualcomm 设备预装 TranLogManager，请打开它。","如果没有，不要安装来历不明的 APK 或套用 MediaTek 菜单。"],capture:["启用可用的 Mobile、Modem、Connectivity、Other。","点击 START，等待后复现故障，再点击 STOP。","等待工具完成写入。"],export:["兼容设备通常使用 /data/debuglogger。","目录可能受权限限制，失败时请使用通用替代方案。"]},
    unisoc:{...words.en.vendor.unisoc,access:["若设备预装 YLog（com.sprd.logmanager），请打开它。","在 Custom 中找到 AP、Modem、WCN、Other 等选项。"],capture:["启用可用的 AP、Modem、WCN、Other。","点击 START，复现故障后点击 STOP。","等待 YLog 停止再复制文件。"],export:["兼容设备通常使用 /data/ylog。","不要删除旧文件；若无法访问，请使用通用替代方案。"]},
  },
};

export function chipsetGuideCopy(lang: string) {
  const code = language(lang);
  return code === "pt" ? words.pt : code === "es" ? es : code === "zh" ? zh : words.en;
}

export function chipsetGuideSteps(lang: string, chipset: Chipset): StepContent[] {
  const c = chipsetGuideCopy(lang);
  const vendor = c.vendor[chipset];
  const common = c.steps.map(step => ({
    title: step.title, description: step.description, items: [...step.items],
  })) as StepContent[];
  common[2].code = "pkg update && pkg install android-tools\ntermux-setup-storage";
  common[4].code = "adb pair IP:PAIR_PORT CODE";
  common[5].code = "adb connect IP:DEBUG_PORT\nadb devices";
  common[6].items = [...vendor.access];
  if ("activity" in vendor) common[6].code = "adb shell am start -n " + vendor.activity;
  common[7].items = [...vendor.capture];
  common[8].items = [...vendor.export];
  common[8].code = "adb pull " + vendor.path + " ~/storage/downloads/BRTE-" + chipset;
  return common;
}
