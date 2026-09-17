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
