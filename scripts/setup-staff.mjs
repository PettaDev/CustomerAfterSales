import { createInterface } from "node:readline/promises";
import { scryptSync, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const r = createInterface({ input: process.stdin, output: process.stdout });
const email = await r.question("E-mail da equipe: ");
console.log(
  "A senha digitada abaixo ficará visível neste terminal. Use um terminal privado.",
);
const password = await r.question("Senha (mínimo 12 caracteres): ");
r.close();
if (!email.includes("@") || password.length < 12)
  throw Error("E-mail inválido ou senha curta.");
const salt = randomBytes(16).toString("hex"),
  hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
let env = "";
try {
  env = await readFile(".env", "utf8");
} catch {}
env = env
  .split("\n")
  .filter((l) => !/^STAFF_(EMAIL|PASSWORD_HASH)=/.test(l))
  .join("\n");
await writeFile(
  ".env",
  env + "\nSTAFF_EMAIL=" + email + "\nSTAFF_PASSWORD_HASH=" + hash + "\n",
  { mode: 0o600 },
);
console.log("Acesso configurado no arquivo .env. Reinicie a API.");
