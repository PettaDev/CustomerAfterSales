import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomerIntlV2 from "./CustomerIntlV2";
import { portalText as tx } from "./portal-i18n";

type DeviceCopy = {
  modelHelp: string;
  modelPlaceholder: string;
  softwareHelp: string;
  softwarePlaceholder: string;
};

function deviceCopy(language: string): DeviceCopy {
  if (language.startsWith("pt")) return {
    modelHelp: "Informe o nome comercial ou o código do modelo que aparece no aparelho.",
    modelPlaceholder: "Ex.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "No aparelho, acesse Configurações > Modelo > Número da Versão e copie o número exibido.",
    softwarePlaceholder: "Ex.: X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  if (language.startsWith("es")) return {
    modelHelp: "Indica el nombre comercial o el código de modelo que aparece en el dispositivo.",
    modelPlaceholder: "Ej.: Infinix GT 30 Pro (X6873)",
    softwareHelp: "En el dispositivo, ve a Ajustes > Modelo > Número de versión y copia el número mostrado.",
    softwarePlaceholder: "Ej.: X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  if (language.startsWith("zh")) return {
    modelHelp: "请输入设备上显示的商品名称或型号代码。",
    modelPlaceholder: "例如：Infinix GT 30 Pro (X6873)",
    softwareHelp: "请在设备中打开 设置 > 型号 > 版本号，并复制显示的版本号。",
    softwarePlaceholder: "例如：X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
  return {
    modelHelp: "Enter the commercial device name or model code shown on the phone.",
    modelPlaceholder: "e.g. Infinix GT 30 Pro (X6873)",
    softwareHelp: "On the device, open Settings > Model > Version number and copy the version shown.",
    softwarePlaceholder: "e.g. X6873-16.3.0.150SP06(OP005PF001AZ)",
  };
}

function applyGuide(copy: DeviceCopy) {
  const form = document.querySelector(".form-card");
  if (!form) return;

  const configure = (field: "model" | "software", originalPlaceholder: string, help: string, placeholder: string) => {
    const selector = `input[data-device-field="${field}"]`;
    let input = form.querySelector<HTMLInputElement>(selector);
    if (!input) {
      input = Array.from(form.querySelectorAll<HTMLInputElement>("input")).find(
        (candidate) => candidate.placeholder === originalPlaceholder,
      ) || null;
    }
    if (!input) return;

    input.dataset.deviceField = field;
    input.placeholder = placeholder;

    const previous = input.previousElementSibling as HTMLElement | null;
    let helper = previous?.dataset.deviceHelp === field ? previous : null;
    if (!helper) {
      helper = document.createElement("small");
      helper.dataset.deviceHelp = field;
      helper.style.display = "block";
      helper.style.marginTop = "5px";
      helper.style.lineHeight = "1.5";
      input.before(helper);
    }
    helper.textContent = help;
  };

  configure("model", tx("model"), copy.modelHelp, copy.modelPlaceholder);
  configure("software", tx("software"), copy.softwareHelp, copy.softwarePlaceholder);
}

export default function CustomerIntlDeviceGuide({ navigate }: { navigate: (p: string) => void }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";

  useEffect(() => {
    const copy = deviceCopy(language);
    const refresh = () => applyGuide(copy);
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return <CustomerIntlV2 navigate={navigate} />;
}
