import { assertEquals } from "@std/assert";
import { SPLIT_SEQUENCE } from "./constants.ts";
import { split } from "./rpc.ts";

Deno.test("split parses valid message correctly", () => {
  const message = `Content-Length: 16\r\n\r\n{"testing":true}`;

  const result = split(message);

  assertEquals(result.error, false);
  assertEquals(result.token, message);
  assertEquals(result.advance, message.length);
});

Deno.test("split handles message with json body", () => {
  const json = '{"method":"initialize","id":1}';
  const header = `Content-Length: ${json.length}`;
  const message = `${header}${SPLIT_SEQUENCE}${json}`;

  const result = split(message);

  assertEquals(result.error, false);
  assertEquals(result.advance, message.length);
  assertEquals(result.token, message);
});

Deno.test("split returns error for invalid split sequence", () => {
  const message = "invalid message without proper split";

  const result = split(message);

  assertEquals(result.error, true);
  assertEquals(result.advance, 0);
  assertEquals(result.token, "");
});

Deno.test("split returns error for invalid Content-Length", () => {
  const message = "Content-Length: notanumber\r\n\r\n{}";

  const result = split(message);

  assertEquals(result.error, true);
  assertEquals(result.advance, 0);
});

Deno.test("split returns error for missing Content-Length header", () => {
  const message = `\r\n\r\n{}`;

  const result = split(message);

  assertEquals(result.error, true);
});

Deno.test("split returns partial token when buffer is incomplete", () => {
  const header = "Content-Length: 100";
  const fullMessage = `${header}${SPLIT_SEQUENCE}${"}".repeat(100)}`;

  const result = split(fullMessage);

  assertEquals(result.error, false);
  assertEquals(result.advance, fullMessage.length);
});

Deno.test("split extracts correct content length", () => {
  const json = '{"jsonrpc":"2.0","method":"test"}';
  const header = `Content-Length: ${json.length}`;
  const message = `${header}${SPLIT_SEQUENCE}${json}`;

  const result = split(message);

  assertEquals(result.error, false);
  assertEquals(
    result.advance,
    header.length + SPLIT_SEQUENCE.length + json.length,
  );
});
