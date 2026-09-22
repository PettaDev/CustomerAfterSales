import { createInterface } from "node:readline/promises";
import { scryptSync, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const r = createInterface({ input: process.stdin, output: process.stdout });
const id = (await r.question("ID curto do TFAE (ex.: gustavo, tommy): ")).trim().toLowerCase();
const name = (await r.question("Nome do TFAE: ")).trim();
const market = (await r.question("Mercado (ex.: BR, EC): ")).trim().toUpperCase();
const country = (await r.question("País (ex.: Brasil, Ecuador): ")).trim();
const email = (await r.question("E-mail do TFAE: ")).trim().toLowerCase();
console.log("A senha digitada abaixo ficará visível neste terminal. Use um terminal privado.");
const password = await r.question("Senha (mínimo 12 caracteres): ");
r.close();

if (!/^[a-z0-9_-]{2,40}$/.test(id) || !name || !market || !country || !email.includes("@") || password.length < 12) {
  throw Error("Revise ID, nome, mercado, país, e-mail e senha.");
}

const salt = randomBytes(16).toString("hex");
const passwordHash = salt + ":" + scryptSync(password, salt, 64).toString("hex");

let env = "";
try { env = await readFile(".env", "utf8"); } catch {}

const existingLine = env.split("\n").find((line) => line.startsWith("STAFF_USERS_JSON="));
let users = [];
if (existingLine) {
  try { users = JSON.parse(existingLine.slice("STAFF_USERS_JSON=".length)); } catch {}
}
if (!Array.isArray(users)) users = [];

const profile = { id, name, email, market, country, passwordHash };
users = users.filter((user) => user?.id !== id && String(user?.email || "").toLowerCase() !== email);
users.push(profile);

env = env
  .split("\n")
  .filter((line) => !/^STAFF_USERS_JSON=/.test(line))
  .join("\n")
  .replace(/\n+$/g, "");

await writeFile(
  ".env",
  env + "\nSTAFF_USERS_JSON=" + JSON.stringify(users) + "\n",
  { mode: 0o600 },
);

console.log("TFAE configurado:", name, "-", country, "(" + market + ").");
console.log("Total de perfis configurados:", users.length);
console.log("Reinicie a API para aplicar a configuração.");
