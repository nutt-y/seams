import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import type { ElementQueue } from "../element_queue.ts";
import { Exit } from "./exit.ts";
import { Initialized } from "./initialized.ts";
import type { LSPRequestMessage } from "./message.types.ts";
import { Nothing } from "./nothing.ts";

function createMockMessage(method: string): LSPRequestMessage {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: {},
  };
}

function createMockProject(): GMLProject {
  return {} as GMLProject;
}

function createMockResponses<T>(): ElementQueue<T> {
  return {
    enqueueElement: () => {},
    getAll: () => [],
  } as unknown as ElementQueue<T>;
}

Deno.test("Exit extends AbstractHandler", () => {
  const message = createMockMessage("exit");
  const handler = new Exit(
    message,
    createMockProject(),
    {} as winston.Logger,
    createMockResponses(),
  );

  assertEquals(handler instanceof Exit, true);
});

Deno.test("Initialized logs info when handle is called", () => {
  const message = createMockMessage("initialized");
  const infoSpy = spy(() => {});
  const warnSpy = spy(() => {});
  const errorSpy = spy(() => {});
  const debugSpy = spy(() => {});
  const logger = {
    info: infoSpy,
    warn: warnSpy,
    error: errorSpy,
    debug: debugSpy,
  } as unknown as winston.Logger;

  const handler = new Initialized(
    message,
    createMockProject(),
    logger,
    createMockResponses(),
  );

  handler.handle();

  assertSpyCalls(infoSpy, 1);
});

Deno.test("Nothing logs warning for unimplemented method", () => {
  const message = createMockMessage("unknown/method");
  const infoSpy = spy(() => {});
  const warnSpy = spy(() => {});
  const errorSpy = spy(() => {});
  const debugSpy = spy(() => {});
  const logger = {
    info: infoSpy,
    warn: warnSpy,
    error: errorSpy,
    debug: debugSpy,
  } as unknown as winston.Logger;

  const handler = new Nothing(
    message,
    createMockProject(),
    logger,
    createMockResponses(),
  );

  handler.handle();

  assertSpyCalls(warnSpy, 1);
  assertSpyCall(warnSpy, 0, {
    args: ["Method [unknown/method] not implemented"],
  });
});
