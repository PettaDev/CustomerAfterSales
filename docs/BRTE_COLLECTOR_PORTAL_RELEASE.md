# BRTE Collector v0.8 — homologação do Portal e publicação do APK

## Situação em 2026-10-20

PR [#47](https://github.com/PettaDev/CustomerAfterSales/pull/47), branch feat/collector-mobile-download-20261020, permanece **Draft/Preview**. Ainda não existe instalador anexado ao PR. O componente CollectorDownload.tsx mantém APK_RELEASE_PATH = "/downloads/brte-collector-release.apk" e APK_RELEASE_READY = false. **Não ativar** o download com URL inexistente, APK debug ou ZIP de código-fonte.

## Fluxo preservado

1. Novo atendimento → Software → Evidências → Estou sem computador abre /collector em nova aba, mantendo o formulário original.
2. Cliente instala o BRTE Collector, realiza pareamento sem fio, grava vídeo e Logcat, reproduz o defeito, finaliza a coleta e gera ZIP em Downloads/BRTE Collector.
3. Retorna à **aba original** e escolhe o ZIP. O envio permanece MANUAL, sem API automática APK → Portal.
4. O rascunho do formulário móvel passa a ser salvo por até quatro horas em sessionStorage, com restauração após recarregamento da mesma aba. Não são armazenados ZIPs, vídeos, tokens, consentimento nem IMEI/endereço. O cliente **precisa escolher o arquivo novamente** se a aba recarregar. A persistência depende da sessão do navegador e não garante recuperação após encerrar a sessão do navegador.
5. A coleta pelo computador/WebUSB não foi modificada. Os limites originais continuam: 15 anexos, até 1 GiB por arquivo e 3 GiB no total, com confirmação explícita.

A opção sem computador NÃO usa Termux como caminho principal; o guia avançado pode existir separadamente na Central de Ajuda.

## Checklist do APK assinado (ainda pendente de envio)

1. Receber APK de **release assinado**, não APK debug e não ZIP do projeto Kotlin.
2. Verificar identidade com Android Build Tools: applicationId/package, versionName, versionCode, minSdk, targetSdk e arquiteturas se aplicável.
3. Verificar assinatura do instalador e fingerprint SHA-256 do certificado; comparar com release anterior, se existir. **Não compartilhar keystore nem senha de assinatura**.
4. Calcular **SHA-256 do arquivo APK** e registrar tamanho, versão, package, fingerprint da assinatura e origem do build. Hash do arquivo ≠ hash da assinatura.
5. Instalar fora do Android Studio em aparelhos reais: pareamento sem fio via notificação, permissão MediaProjection, coleta vídeo + Logcat, stop, ZIP, Downloads/BRTE Collector, botão localizar/compartilhar.
6. Homologar individualmente firmware/dispositivo MediaTek, Qualcomm e SPD/Unisoc. DebugLoggerUI/TranLogManager/YLog podem ser restritos pelo firmware; **não anunciar 100% de compatibilidade sem testes físicos**.
7. Escolher hospedagem: avaliar tamanho do APK e limites Vercel antes de gravá-lo em public/downloads; para binário grande, usar armazenamento de objetos/CDN pública confiável, preferencialmente com versão imutável e link oficial HTTPS estável.
8. No Preview, validar HTTPS, resposta 200, tamanho, checksum do binário efetivamente baixado em aparelho Android e instalação. Conferir Content-Type application/vnd.android.package-archive se configurável.
9. Só então atualizar APK_RELEASE_PATH e APK_RELEASE_READY=true em PR; validar a interface nos 4 idiomas, mobile e desktop.
10. Executar CI, auditoria e testes, documentar hash/assinatura e solicitar aprovação explícita antes do merge de produção.

### Exemplo de validação no Windows / Android SDK

~~~powershell
# SHA-256 do arquivo binário
Get-FileHash .\brte-collector-release.apk -Algorithm SHA256

# Use a versão instalada do Android Build Tools
.\apksigner.bat verify --verbose --print-certs .\brte-collector-release.apk
.\aapt.exe dump badging .\brte-collector-release.apk

# Em aparelho de homologação autorizado
adb install -r .\brte-collector-release.apk
~~~

A chave de assinatura deve ser preservada com segurança para permitir atualizações posteriores. Não orientar desativação do Play Protect nem solicitar root.

## Metadados necessários no envio do APK

- Instalador .apk original e origem de compilação (commit/tag do app Kotlin).
- Identidade do pacote, versão/código e Android mínimo previstos (a confirmar pelo próprio binário).
- Relação de aparelhos e firmwares MTK/Qualcomm/SPD testados e limitações conhecidas.
- Quando existirem: vídeos oficiais de instalação, pareamento, coleta e exportação em qualidade original.

## Privacidade e qualidade

O cliente deve revisar a evidência antes de compartilhá-la. Logs podem conter informações pessoais ou de dispositivo. Não criar links públicos para ZIPs de clientes nem copiá-los para analytics. Não usar o banco de produção para homologação. Nenhuma evidência é enviada sem ação e confirmação do cliente. Os vídeos tutoriais futuros não devem aparecer como players vazios nem arquivos inventados. A branch conserva o Portal e WebUSB existentes e **não altera produção**.
