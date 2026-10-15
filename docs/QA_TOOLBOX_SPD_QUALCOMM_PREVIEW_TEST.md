# Teste do BRTE Preview — YLog SPD/Unisoc e TranLog Qualcomm

## Objetivo

Implementação **somente em Preview**, extraída da lógica do QA Toolbox fornecido pelo autor. Não muda o Bridge Windows, o backend, o Resend nem o banco. MTK continua com as rotinas anteriores.

### Funcionamento

- **SPD/Unisoc:** `src/portal/spd-ylog.ts` detecta SoC e `com.sprd.logmanager`, abre `LogMainActivity`, busca o menu **Custom** pela árvore `uiautomator dump`, ativa e confirma Mobile/Modem/Connectivity/Other. Calcula o centro do `bounds` de cada botão e toca por ADB, sem coordenadas fixas. Verifica a mudança de START para STOP e a criação de novos `.ylog`; ao finalizar toca STOP e transfere **somente arquivos novos** para um ZIP. Não apaga nem lê para ZIP os logs existentes antes da sessão.
- **Qualcomm:** a automação TranLogManager que já existia continua. A detecção dos switches aceita `resource-id` e `android.widget.Switch`, conforme QA Toolbox. Depois do START espera **8 segundos** antes de tentar `screenrecord`, para evitar falhas do encoder observadas em X6878/SM7635.
- **MTK:** o fluxo DebugLoggerUI com perfil 39 permanece sem alteração.
- **Fallback:** se o YLog não estiver instalado/reconhecido, o navegador usa a coleta genérica ADB Logcat + vídeo (quando disponíveis) e mostra o logger detectado. Se a detecção SPD for positiva, mas a interface não puder ser verificada, a automação apresenta erro em vez de tocar em coordenadas desconhecidas.
- **Recursos:** o ZIP de YLog limita 80 arquivos, 128 MiB por arquivo, 256 MiB acumulados; se exceder, interrompe a transferência com erro. Os logs brutos permanecem no aparelho. Esta implantação não apaga arquivos antigos de diagnóstico.

## Roteiro de homologação no Preview

1. Computador Windows ou Linux com **Chrome/Edge que suporte WebUSB**, cabo de dados, celular ligado/desbloqueado com opções de desenvolvedor e depuração USB permitidas. A coleta WebUSB não opera no próprio navegador móvel nem exige iniciar o Bridge Windows.
2. Entre no Preview da PR; em **Novo atendimento → Software → Computador/Navegador**, conecte o aparelho e autorize ADB no celular. Teste com dados fictícios e **sem finalizar envio de caso**.
3. Confirme o rótulo **Logger detectado**: `YLog (SPD / Unisoc)`, `TranLogManager (Qualcomm)` ou `DebugLoggerUI (MediaTek)`. Se mostrar `ADB Logcat (genérico)`, não considere o OEM automatizado.
4. Clique **Iniciar coleta**; observe se o app YLog/TranLog abre, habilita os quatro switches e chega ao estado STOP. Não toque na interface enquanto a automação prepara os logs.
5. Reproduza um problema inofensivo por 15–30 segundos, clique **Finalizar**, aguarde a cópia. Confirme no sistema a geração de MP4, TXT diagnóstico, Logcat e ZIP OEM. **Não** envie evidências pessoais.
6. Em SPD confira a presença dos quatro switches no YLog e ZIP `brte-ylog-spd-*.zip`. Em Qualcomm confira `brte-debuglogger-qualcomm-*.zip` e que o vídeo foi gerado corretamente. Confirme que os arquivos não estão vazios.
7. Teste, em separado, desconectar/reconectar antes da coleta, negar depuração USB e versões diferentes do app OEM; verifique a mensagem de erro em vez de afirmar falso sucesso.
8. Envie o resultado com **modelo, versão do Android e build, SoC e etapa que falhou**, mas não compartilhe IMEI, serial, logs reais, credenciais ou dados pessoais em tickets públicos.

## Limitações conhecidas

- **Validação estática e CI não substituem dispositivo físico.** O XML do YLog pode variar conforme ROM/idioma e o diretório `/data/ylog` pode não estar legível por ADB em toda firmware.
- O QA Toolbox trabalha em PowerShell/Electron e usa ADB Windows; esta versão adapta a lógica ao ADB via WebUSB no navegador. O binário do QA Toolbox não é instalado nem executado no servidor.
- A automação altera temporariamente o estado dos switches OEM e **não restaura preferências anteriores**, seguindo o QA Toolbox. Apenas iniciar com o YLog parado evita interferir em uma sessão que já esteja ativa.
- Não há garantia de transferência em firmware que restrinja `/data/ylog`, nem de recuperação de arquivos que excedam os limites do navegador. Para grandes evidências será necessário um fluxo via Bridge/PC.
- Nenhum deploy de produção até homologação física SPD e Qualcomm. Nenhuma mudança ao código do Bridge `bridge/core.mjs` nesta PR.

## Referências

- QA Toolbox.zip do autor: `qatool-core/MobileQA.LoggerApp.ps1`, `qatool-core/MobileQA.Session.ps1`
- `src/portal/spd-ylog.ts`, `src/portal/BrowserCapture.tsx`, `src/portal/qualcomm-tranlog.ts`
- `tests/spd-ylog-webusb.test.mjs`.
