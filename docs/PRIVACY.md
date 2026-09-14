# Privacy implementation notes
Customer consent is mandatory for submitting a case; local screen/log capture has a separate explicit consent checkbox. Automatic upload is shown as a separate option. Uploaded evidence may contain screen content and platform logs; customers must review sensitive content.

Do not collect IMEI by default. Current metadata includes model, brand, platform, Android build and local serial for session routing. Customer cloud session record omits serial. A ZIP may still include serial in technical metadata.

No source archive Captures directory, customer logs, runtime error logs or credentials are committed or deployed. Repository public assets are tutorial material from the owner's existing public guide.

Product owner must define responsible organization/contact, retention period, access/deletion process and authorized staff before accepting real external customer data. No legal compliance certification is implied by this file.
