import { FileText, PlugZap, ShieldCheck, UploadCloud } from "lucide-react";

export type HardwareCollectionCopy = {
  title: string;
  intro: string;
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

type Props = {
  copy: HardwareCollectionCopy;
  files: File[];
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export default function HardwareCollection({ copy, files, onFiles, onRemove }: Props) {
  return <>
    <h2>{copy.title}</h2>
    <p>{copy.intro}</p>

    <div className="hint" role="note">
      <PlugZap size={20}/>
      <p><strong>{copy.chargerTitle}</strong><br/>{copy.chargerText}</p>
    </div>

    <div className="hint" role="note">
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
    </div>)}
  </>;
}
