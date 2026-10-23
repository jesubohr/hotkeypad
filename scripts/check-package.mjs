import assert from "node:assert/strict"
import { execFileSync, execSync } from "node:child_process"
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const output = resolve(root, ".package-check")
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"))

execSync("pnpm pack --pack-destination .package-check", { cwd: root, stdio: "inherit" })
const extraction = mkdtempSync(resolve(output, "unpacked-"))
execFileSync("tar", ["-xf", resolve(output, `${manifest.name}-${manifest.version}.tgz`), "-C", extraction])

const unpacked = resolve(extraction, "package")
const packedManifest = JSON.parse(readFileSync(resolve(unpacked, "package.json"), "utf8"))
assert.equal(packedManifest.exports["."].types, "./dist/index.d.ts")
for (const name of ["index", "reset"]) {
  assert.equal(
    readFileSync(resolve(unpacked, `dist/styles/${name}.css`), "utf8"),
    readFileSync(resolve(root, `src/styles/${name}.css`), "utf8")
  )
}

execFileSync(process.execPath, ["--input-type=module", "--eval", `
  import assert from "node:assert/strict"
  import HotKeyPad from "hotkeypad"
  assert.equal(typeof HotKeyPad.prototype.destroy, "function")
  assert.ok(Object.getOwnPropertyDescriptor(HotKeyPad.prototype, "isDestroyed")?.get)
`], { cwd: unpacked, stdio: "inherit" })

copyFileSync(resolve(root, "tests/types.mts"), resolve(unpacked, "consumer.mts"))
execFileSync(process.execPath, [
  resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict",
  "--module", "NodeNext", "--moduleResolution", "NodeNext", "--target", "ES2022",
  "--lib", "ES2022,DOM", "consumer.mts"
], { cwd: unpacked, stdio: "inherit" })

console.log("Packed JavaScript, TypeScript declarations, and styles passed verification")
