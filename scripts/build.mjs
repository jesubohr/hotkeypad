import { execFileSync } from "node:child_process"
import { cp, mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = new URL("../", import.meta.url)
const output = new URL("../dist/", import.meta.url)

await rm(output, { recursive: true, force: true })
execFileSync(process.execPath, [resolve(fileURLToPath(root), "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"], {
  cwd: fileURLToPath(root),
  stdio: "inherit"
})
await mkdir(new URL("styles/", output), { recursive: true })
await cp(new URL("../src/styles/", import.meta.url), new URL("styles/", output), { recursive: true })
