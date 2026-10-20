# BRTE Collector — publicação no Portal

## Fluxo do cliente

1. Em **Novo atendimento > Software > Enviar evidências**, escolha **Estou sem computador**.
2. Uma nova aba abre \`/collector\` sem substituir o formulário em andamento.
3. O cliente instala o APK **de release assinado** e faz a coleta de vídeo + logs no Android.
4. O BRTE Collector salva o ZIP em \`Downloads/BRTE Collector\`.
5. O cliente retorna à aba original e anexa o ZIP ao caso.

## Antes de liberar o download

O botão fica desativado até haver um APK de produção validado.

1. No Android Studio, gere um APK **release**, assinado com uma chave de atualização segura.
2. Teste a instalação fora do Android Studio, o pareamento ADB local, MediaProjection, Logcat, o estado parcial da coleta OEM e a exportação do ZIP em firmware real.
3. Registre versão, assinatura e hash SHA-256 da versão testada.
4. Salve o instalador em \`public/downloads/brte-collector-release.apk\` (ou use um host confiável e ajuste o código).
5. Em \`src/portal/CollectorDownload.tsx\`, altere \`APK_RELEASE_READY\` para \`true\` **somente após confirmar que o arquivo é servido corretamente**.
6. Revise a página \`/collector\` nos idiomas pt-BR, es-419, en e zh-CN; teste Android e desktop.
7. Após revisão e aprovação, faça merge do PR e promova o deploy na Vercel.

O branch não contém nenhum APK. Não disponibilize ZIP de código-fonte, APK debug ou uma URL quebrada como se fossem um instalador de produção.

## Segurança e UX

- A opção sem computador **não usa Termux como caminho principal**. O guia legado ainda pode existir em outras rotas como alternativa; não removê-lo sem decisão de produto.
- O portal apenas abre a página de download; o upload das evidências **continua manual** no formulário original.
- O usuário não deve precisar reiniciar o atendimento ao instalar o aplicativo.
- Solicite consentimento explícito e mantenha o usuário informado sobre a coleta de registros potencialmente sensíveis.
- Registre que o Android exige permissões e que recursos OEM podem ser indisponíveis conforme firmware.
