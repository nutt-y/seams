import { assertEquals, assertStringIncludes } from "@std/assert";
import type winston from "winston";
import { decodeMessage, encodeMessage, split } from "./rpc.ts";

const mockLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warn: () => {},
} as unknown as winston.Logger;

Deno.test("encodeMessage encodes object correctly", () => {
  const message = encodeMessage({ testing: true }, mockLogger);
  const decoded = new TextDecoder().decode(message);

  assertStringIncludes(decoded, "Content-Length:");
  assertStringIncludes(decoded, '{"testing":true}');
});

Deno.test("encodeMessage handles empty object", () => {
  const message = encodeMessage({}, mockLogger);
  const decoded = new TextDecoder().decode(message);

  assertStringIncludes(decoded, "Content-Length: 2");
});

Deno.test("encodeMessage handles complex nested object", () => {
  const message = encodeMessage(
    {
      id: 1,
      method: "initialize",
      params: { capabilities: {} },
    },
    mockLogger,
  );
  const decoded = new TextDecoder().decode(message);

  assertStringIncludes(decoded, "Content-Length:");
});

Deno.test("decodeMessage parses valid JSON", () => {
  const incoming = '{"method":"hi","id":1,"jsonrpc":"2.0"}';

  const result = decodeMessage(incoming, mockLogger);

  assertEquals(result.method, "hi");
  assertEquals(result.id, 1);
  assertEquals(result.jsonrpc, "2.0");
});

Deno.test("decodeMessage handles notification without id", () => {
  const incoming = '{"method":"textDocument/didOpen","jsonrpc":"2.0"}';

  const result = decodeMessage(incoming, mockLogger);

  assertEquals(result.method, "textDocument/didOpen");
  assertEquals(result.jsonrpc, "2.0");
});

Deno.test("decodeMessage handles invalid JSON gracefully", () => {
  const incoming = "not valid json";

  const result = decodeMessage(incoming, mockLogger);

  assertEquals(result.method, "");
  assertEquals(result.id, -1);
});

Deno.test("decodeMessage handles empty string", () => {
  const incoming = "";

  const result = decodeMessage(incoming, mockLogger);

  assertEquals(result.method, "");
});

Deno.test("split parses valid message correctly", () => {
  const message = `Content-Length: 16\r\n\r\n{"testing":true}`;

  const result = split(message);

  assertEquals(result.error, false);
  assertEquals(result.token, message);
  assertEquals(result.advance, message.length);
});

Deno.test("split returns error for invalid format", () => {
  const message = "invalid";

  const result = split(message);

  assertEquals(result.error, true);
  assertEquals(result.token, "");
});

Deno.test("split returns error for NaN content length", () => {
  const message = "Content-Length: abc\r\n\r\n{}";

  const result = split(message);

  assertEquals(result.error, true);
});
