import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import HotKeyPad from "hotkeypad"

test("the package imports without browser globals and includes current APIs", () => {
  assert.equal(typeof HotKeyPad, "function")
  assert.equal(typeof HotKeyPad.prototype.destroy, "function")
  assert.ok(Object.getOwnPropertyDescriptor(HotKeyPad.prototype, "isDestroyed")?.get)
})

test("CSS exports contain the source styles", () => {
  for (const name of ["index", "reset"]) {
    const output = readFileSync(fileURLToPath(import.meta.resolve(`hotkeypad/${name}.css`)), "utf8")
    const source = readFileSync(new URL(`../src/styles/${name}.css`, import.meta.url), "utf8")
    assert.equal(output, source)
  }
})

test("a TypeScript consumer can import the public API through package exports", () => {
  execFileSync(process.execPath, [
    fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url)),
    "--noEmit", "--strict", "--module", "NodeNext", "--moduleResolution", "NodeNext",
    "--target", "ES2022", "--lib", "ES2022,DOM",
    fileURLToPath(new URL("types.mts", import.meta.url))
  ], { stdio: "pipe" })
})
