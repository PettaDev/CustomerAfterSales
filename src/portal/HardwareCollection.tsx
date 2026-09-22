import { AlertTriangle, CheckCircle2, FileText, PlugZap, ShieldCheck, UploadCloud } from "lucide-react";

export type HardwareCollectionCopy = {
  title: string;
  intro: string;
  safetyTitle: string;
  safetyText: string;
  safetyRisk: string;
  safetySafe: string;
  safetyRequired: string;
  riskTitle: string;
  riskText: string;
  chargerTitle: string;
  chargerText: string;
  evidenceTitle: string;
  evidenceText: string;
  warrantyTitle: string;
  warrantyText: string;
  validationTitle: string;
  validationText: string;
  chooseFiles: string;
  remove: string;
};

export function hardwareCollectionCopy(language: string, chooseFiles: string, remove: string): HardwareCollectionCopy {
  if (language.startsWith("pt")) return {
    title: "Evidências do problema de hardware",
    intro: "Para hardware, a coleta é manual. Envie fotos e/ou um vídeo curto mostrando claramente o defeito.",
    safetyTitle: "Antes de conectar ou ligar o aparelho",
    safetyText: "Algum destes sinais está acontecendo agora: bateria estufada ou tampa levantando, fumaça ou cheiro estranho, calor extremo, contato recente com líquido ou conector queimado/danificado?",
    safetyRisk: "Sim, existe um desses sinais",
    safetySafe: "Não, nenhum desses sinais",
    safetyRequired: "Responda à pergunta de segurança antes de adicionar as evidências.",
    riskTitle: "Não conecte o carregador nem tente ligar o aparelho",
    riskText: "Pare de usar o aparelho e não pressione, perfure ou manipule uma bateria estufada. Envie somente fotos seguras do estado atual e aguarde a orientação do suporte.",
    chargerTitle: "Mostre o aparelho conectado ao carregador",
    chargerText: "Quando for seguro e aplicável ao problema, grave ou fotografe o aparelho conectado ao carregador e mostre também o cabo e o adaptador. Isso ajuda a evitar diagnósticos incorretos, principalmente em casos de bateria, carregamento ou aparelho que não liga.",
    evidenceTitle: "Fotos e vídeo",
    evidenceText: "Envie imagens nítidas do aparelho e, se possível, um vídeo reproduzindo o problema. Não envie logs técnicos para casos de hardware.",
    warrantyTitle: "Se o aparelho estiver na garantia",
    warrantyText: "Após a confirmação da elegibilidade, o atendimento continuará pelos canais informados no cadastro, incluindo e-mail e WhatsApp, conforme o processo de suporte disponível.",
    validationTitle: "Antes de enviar o aparelho",
    validationText: "O time poderá solicitar algumas validações adicionais para confirmar o defeito e evitar um envio desnecessário. Só envie o aparelho depois de receber as instruções do atendimento.",
    chooseFiles,
    remove,
  };
  if (language.startsWith("es")) return {
    title: "Evidencias del problema de hardware",
    intro: "Para hardware, la recopilación es manual. Sube fotos y/o un video corto que muestre claramente la falla.",
    safetyTitle: "Antes de conectar o encender el dispositivo",
    safetyText: "¿Está ocurriendo alguno de estos signos ahora: batería hinchada o tapa levantada, humo u olor extraño, calor extremo, contacto reciente con líquido o conector quemado/dañado?",
    safetyRisk: "Sí, existe uno de estos signos",
    safetySafe: "No, ninguno de estos signos",
    safetyRequired: "Responde la pregunta de seguridad antes de agregar evidencias.",
    riskTitle: "No conectes el cargador ni intentes encender el dispositivo",
    riskText: "Deja de usar el dispositivo y no presiones, perfores ni manipules una batería hinchada. Envía solo fotos seguras del estado actual y espera las instrucciones de soporte.",
    chargerTitle: "Muestra el dispositivo conectado al cargador",
    chargerText: "Cuando sea seguro y corresponda al problema, graba o fotografía el dispositivo conectado al cargador y muestra también el cable y el adaptador. Esto ayuda a evitar diagnósticos incorrectos, especialmente en casos de batería, carga o dispositivo que no enciende.",
    evidenceTitle: "Fotos y video",
    evidenceText: "Sube imágenes claras del dispositivo y, si es posible, un video reproduciendo la falla. No envíes logs técnicos para casos de hardware.",
    warrantyTitle: "Si el dispositivo está en garantía",
    warrantyText: "Después de confirmar la elegibilidad, la atención continuará por los canales informados en el registro, incluidos correo electrónico y WhatsApp, según el proceso de soporte disponible.",
    validationTitle: "Antes de enviar el dispositivo",
    validationText: "El equipo puede solicitar validaciones adicionales para confirmar la falla y evitar un envío innecesario. Envía el dispositivo solo después de recibir las instrucciones de atención.",
    chooseFiles,
    remove,
  };
  if (language.startsWith("zh")) return {
    title: "硬件问题证据",
    intro: "硬件问题仅使用手动采集。请上传清晰展示故障的照片和/或短视频。",
    safetyTitle: "连接充电器或开机之前",
    safetyText: "设备现在是否出现以下任一情况：电池鼓包或后盖翘起、冒烟或异味、异常高温、近期进液，或充电接口烧蚀/损坏？",
    safetyRisk: "是，出现了其中一种情况",
    safetySafe: "没有这些情况",
    safetyRequired: "添加证据前请先回答安全问题。",
    riskTitle: "请勿连接充电器，也不要尝试开机",
    riskText: "请停止使用设备，不要按压、刺穿或处理鼓包电池。只上传能够安全拍摄的设备现状照片，并等待支持团队的进一步说明。",
    chargerTitle: "请展示设备连接充电器的状态",
    chargerText: "在安全且与问题相关的情况下，请拍摄设备连接充电器时的照片或视频，并同时展示充电线和适配器。这有助于减少误判，尤其适用于电池、充电或无法开机的问题。",
    evidenceTitle: "照片和视频",
    evidenceText: "请上传清晰的设备照片，并尽可能上传复现问题的视频。硬件问题无需上传技术日志。",
    warrantyTitle: "如果设备仍在保修期内",
    warrantyText: "确认符合保修条件后，后续支持将通过登记的联系渠道继续，包括电子邮件和 WhatsApp（以可用支持流程为准）。",
    validationTitle: "寄送设备之前",
    validationText: "团队可能会要求进行额外验证，以确认故障并避免不必要的寄送。只有在收到支持团队的明确说明后再寄送设备。",
    chooseFiles,
    remove,
  };
  return {
    title: "Hardware issue evidence",
    intro: "Hardware collection is manual. Upload photos and/or a short video that clearly shows the fault.",
    safetyTitle: "Before connecting or powering on the device",
    safetyText: "Is any of this happening now: a swollen battery or raised back cover, smoke or unusual smell, extreme heat, recent liquid exposure, or a burnt/damaged charging connector?",
    safetyRisk: "Yes, one of these signs is present",
    safetySafe: "No, none of these signs are present",
    safetyRequired: "Answer the safety question before adding evidence.",
    riskTitle: "Do not connect the charger or try to power on the device",
    riskText: "Stop using the device and do not press, puncture, or handle a swollen battery. Upload only photos that can be taken safely and wait for support instructions.",
    chargerTitle: "Show the device connected to its charger",
    chargerText: "When safe and relevant to the issue, record or photograph the device while it is connected to the charger and show the cable and adapter as well. This helps prevent incorrect conclusions, especially for battery, charging, or no-power issues.",
    evidenceTitle: "Photos and video",
    evidenceText: "Upload clear photos of the device and, when possible, a video reproducing the issue. Do not upload technical logs for hardware cases.",
    warrantyTitle: "If the device is still under warranty",
    warrantyText: "After eligibility is confirmed, support will continue through the contact channels provided in the case, including email and WhatsApp, according to the available support process.",
    validationTitle: "Before sending the device",
    validationText: "The team may request additional checks to confirm the fault and avoid an unnecessary shipment. Send the device only after you receive support instructions.",
    chooseFiles,
    remove,
  };
}

type HardwareSafety = "safe" | "risk" | null;

type Props = {
  copy: HardwareCollectionCopy;
  files: File[];
  safety: HardwareSafety;
  onSafetyChange: (value: Exclude<HardwareSafety, null>) => void;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export default function HardwareCollection({ copy, files, safety, onSafetyChange, onFiles, onRemove }: Props) {
  return <>
    <h2>{copy.title}</h2>
    <p>{copy.intro}</p>

    <div className="hint" role="group" aria-label={copy.safetyTitle}>
      <AlertTriangle size={20}/>
      <div style={{width:"100%"}}><p><strong>{copy.safetyTitle}</strong><br/>{copy.safetyText}</p>
      <div className="choice-row" style={{marginTop:14}}>
        <button type="button" className={`option ${safety==="risk"?"selected":""}`} aria-pressed={safety==="risk"} onClick={()=>onSafetyChange("risk")}><AlertTriangle size={20}/><strong>{copy.safetyRisk}</strong></button>
        <button type="button" className={`option ${safety==="safe"?"selected":""}`} aria-pressed={safety==="safe"} onClick={()=>onSafetyChange("safe")}><CheckCircle2 size={20}/><strong>{copy.safetySafe}</strong></button>
      </div></div>
    </div>

    {safety==="risk"&&<div className="hint" role="alert">
      <AlertTriangle size={20}/>
      <p><strong>{copy.riskTitle}</strong><br/>{copy.riskText}</p>
    </div>}

    {safety==="safe"&&<div className="hint" role="note">
      <PlugZap size={20}/>
      <p><strong>{copy.chargerTitle}</strong><br/>{copy.chargerText}</p>
    </div>}

    {safety&&<><div className="hint" role="note">
      <ShieldCheck size={20}/>
      <p><strong>{copy.warrantyTitle}</strong><br/>{copy.warrantyText}<br/><br/><strong>{copy.validationTitle}</strong><br/>{copy.validationText}</p>
    </div>

    <span className="manual-evidence-title">{copy.evidenceTitle}</span>
    <p>{copy.evidenceText}</p>
    <label className="dropzone">
      <UploadCloud size={34}/>
      <strong>{copy.chooseFiles}</strong>
      <input
        type="file"
        multiple
        accept="image/png,image/jpeg,video/mp4,.png,.jpg,.jpeg,.mp4"
        onChange={(event) => onFiles(Array.from(event.target.files || []))}
      />
    </label>
    {files.map((file, index) => <div className="file-row" key={`${file.name}-${file.size}-${index}`}>
      <FileText size={18}/><span>{file.name}</span><button type="button" onClick={() => onRemove(index)}>{copy.remove}</button>
    </div>)}</>}
  </>;
}
