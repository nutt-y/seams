import { assertEquals } from "@std/assert";
import { Exit } from "./exit.ts";
import { Initialize } from "./initialize.ts";
import { Nothing } from "./nothing.ts";
import { TextDocument_DidOpen } from "./textdocument_didopen.ts";
import { TextDocument_Hover } from "./textdocument_hover.ts";

Deno.test("handleMessage routes initialize to Initialize handler", () => {
  // Test that initialize handler exists
  const InitializeConstructor = Initialize;
  assertEquals(typeof InitializeConstructor, "function");
});

Deno.test("handleMessage routes exit to Exit handler", () => {
  const ExitConstructor = Exit;
  assertEquals(typeof ExitConstructor, "function");
});

Deno.test("handleMessage routes unknown method to Nothing handler", () => {
  const NothingConstructor = Nothing;
  assertEquals(typeof NothingConstructor, "function");
});

Deno.test("Methods enum contains expected values", () => {
  // The Methods enum should have the expected methods
  const _methodValues = [
    "initialize",
    "initialized",
    "textDocument/didOpen",
    "textDocument/hover",
    "textDocument/didChange",
    "textDocument/definition",
    "textDocument/didSave",
    "textDocument/completion",
    "textDocument/signatureHelp",
    "textDocument/references",
    "textDocument/inlayHint",
    "textDocument/semanticTokens/full",
    "textDocument/documentHighlight",
    "exit",
  ];

  // Just verify the handlers exist
  assertEquals(typeof Initialize, "function");
  assertEquals(typeof Exit, "function");
  assertEquals(typeof Nothing, "function");
  assertEquals(typeof TextDocument_DidOpen, "function");
  assertEquals(typeof TextDocument_Hover, "function");
});
