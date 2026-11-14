// Executa o Python do .venv (se existir) com os argumentos recebidos.
// Uso: node scripts/py.mjs -m pytest -q
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const candidates = [
  join(root, ".venv", "Scripts", "python.exe"),
  join(root, ".venv", "bin", "python"),
];
const python =
  candidates.find((p) => existsSync(p)) ??
  (process.platform === "win32" ? "python" : "python3");

const child = spawn(python, process.argv.slice(2), { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(`Não foi possível executar o Python (${python}): ${err.message}`);
  process.exit(1);
});
