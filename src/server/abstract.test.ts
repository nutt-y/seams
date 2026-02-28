import { assertEquals } from "@std/assert";
import type winston from "winston";
import type GMLProject from "../parser/project.ts";
import { AbstractHandler } from "./abstract.ts";
import type { ElementQueue } from "./element_queue.ts";
import type { LSPRequestMessage } from "./methods/message.types.ts";

class TestHandler extends AbstractHandler {
  public override handle(): void {}

  public getDocumentPathPublic(uri: string): string {
    return this.getDocumentPath(uri);
  }

  public getFilePublic(uri: string) {
    return this.getFile(uri);
  }
}

function createMockHandler(method: string): TestHandler {
  const mockMessage: LSPRequestMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: {},
  };

  const mockLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  } as unknown as winston.Logger;

  const mockProject = {
    initializeProject: () => Promise.resolve(true),
    getFile: () => null,
    getAssets: () => null,
  } as unknown as GMLProject;

  const mockResponses = {
    enqueueElement: () => {},
    getAll: () => [],
  } as unknown as ElementQueue<never>;

  return new TestHandler(mockMessage, mockProject, mockLogger, mockResponses);
}

Deno.test("AbstractHandler getDocumentPath extracts path from file:// URI", () => {
  const handler = createMockHandler("test");

  const path = handler.getDocumentPathPublic("file:///path/to/file.gml");

  assertEquals(path, "/path/to/file.gml");
});

Deno.test("AbstractHandler getDocumentPath handles Windows paths", () => {
  const handler = createMockHandler("test");

  const path = handler.getDocumentPathPublic("file:///C:/path/to/file.gml");

  assertEquals(path, "/C:/path/to/file.gml");
});

Deno.test("AbstractHandler getDocumentPath returns undefined for invalid URI", () => {
  const handler = createMockHandler("test");

  const path = handler.getDocumentPathPublic("not-a-file-uri");

  assertEquals(path, undefined);
});

Deno.test("AbstractHandler getFile returns null when file not found", () => {
  const handler = createMockHandler("test");

  const file = handler.getFilePublic("file:///nonexistent/file.gml");

  assertEquals(file, null);
});
