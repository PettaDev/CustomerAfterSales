# Product requirements
Owner: Gustavo / PettaDev

MVP 1: Customer → Form → Hardware/Software → Evidence → Case → TFAE Dashboard.
MVP 2: Customer → PC → Support Bridge → Device Detection → ADB → START/STOP.
MVP 3: scrcpy → Logger Routing → Automatic Upload → Multiple Capture Sessions.

Source priority: chat product owner > supplied prompt > MobileQA RC3 > CustomersGuide reference branch > official documentation > inference.

The customer should complete one main decision at a time. Visual direction: navy background, large cards, restrained borders, green accent, generous space, concise labels. Brand and guide assets come from the existing repository. Portal initially PT-BR; existing guide keeps all seven locales.

Customer case has brand/model/build, hardware/software category, summary, reproduction, expected behavior, contact, country/operator and consent. Evidence can be attached later. Customer tracks using a private access token. TFAE sees statuses, priority, ownership, evidence, sessions and customer-visible updates.

No JIRA integration. No firmware switching. No claim of remote ADB access from Vercel. No additional contributor attribution.

Implementation is an internal validation build, not an externally qualified release. Production services, privacy contact/retention, Windows device tests and a signed end-user installer remain release gates.
