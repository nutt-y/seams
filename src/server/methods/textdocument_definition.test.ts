import { assertEquals, assertExists } from "@std/assert";
import { spy } from "@std/testing/mock";
import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import type { ElementQueue } from "../element_queue.ts";
import type {
  Location,
  LSPRequestMessage,
  LSPResponseMessage,
} from "./message.types.ts";
import { TextDocument_Definition } from "./textdocument_definition.ts";

function createMockMessage(
  uri: string,
  line: number,
  character: number,
): LSPRequestMessage {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "textDocument/definition",
    params: {
      textDocument: { uri },
      position: { line, character },
    },
  };
}

function createMockLogger(): winston.Logger {
  return {
    info: spy(() => {}),
    warn: spy(() => {}),
    error: spy(() => {}),
    debug: spy(() => {}),
  } as unknown as winston.Logger;
}

function createMockResponses<T>(): ElementQueue<T> {
  let lastEnqueued: T[] = [];
  return {
    enqueueElement: (items: T[]) => {
      lastEnqueued = items;
    },
    getAll: () => lastEnqueued,
  } as unknown as ElementQueue<T>;
}

Deno.test("TextDocument_Definition returns null when no file found", () => {
  const message = createMockMessage("file:///nonexistent.gml", 0, 0);
  const mockProject = {
    getFile: () => null,
  } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  assertEquals(responsesList[0].result, null);
});

Deno.test("TextDocument_Definition returns null when file has no reference", () => {
  const message = createMockMessage("file:///test.gml", 0, 0);
  const mockFile = { getReferenceAt: () => null };
  const mockProject = { getFile: () => mockFile } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  assertEquals(responsesList[0].result, null);
});

Deno.test("TextDocument_Definition returns null for native symbol", () => {
  const message = createMockMessage("file:///test.gml", 0, 5);
  const mockSymbol = { native: true };
  const mockFile = { getReferenceAt: () => ({ item: mockSymbol }) };
  const mockProject = { getFile: () => mockFile } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  assertEquals(responsesList[0].result, null);
});

Deno.test("TextDocument_Definition returns location for symbol with definition", () => {
  const message = createMockMessage("file:///test.gml", 0, 5);
  const mockDef = {
    file: { path: { absolute: "/project/src/script.gml" } },
    start: { line: 10, column: 1 },
    end: { line: 10, column: 20 },
  };
  const mockSymbol = {
    native: false,
    type: { kind: "Function" },
    def: mockDef,
    getTypeByKind: () => null,
  };
  const mockFile = { getReferenceAt: () => ({ item: mockSymbol }) };
  const mockProject = { getFile: () => mockFile } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  const result = responsesList[0].result as unknown as Location;

  assertExists(result);
  assertEquals(result.uri, "file:///project/src/script.gml");
  assertEquals(result.range.start.line, 9);
  assertEquals(result.range.start.character, 0);
  assertEquals(result.range.end.line, 9);
  assertEquals(result.range.end.character, 19);
});

Deno.test("TextDocument_Definition returns locations for GMObject", () => {
  const message = createMockMessage("file:///test.gml", 0, 5);
  const mockGMObject = { name: "obj_player" };
  const mockFiles = [
    { path: { absolute: "/project/objects/obj_player/obj_player.yy" } },
    { path: { absolute: "/project/objects/obj_player/create.gml" } },
  ];
  const mockAssets = { gmlFilesArray: mockFiles };
  const mockSymbol = {
    native: false,
    type: { kind: "Asset.GMObject" },
    getTypeByKind: () => mockGMObject,
  };
  const mockFile = { getReferenceAt: () => ({ item: mockSymbol }) };
  const mockProject = {
    getFile: () => mockFile,
    getAssets: () => mockAssets,
  } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  const result = responsesList[0].result as unknown as Location[];

  assertExists(result);
  assertEquals(result.length, 2);
  assertEquals(
    result[0].uri,
    "file:///project/objects/obj_player/obj_player.yy",
  );
  assertEquals(result[1].uri, "file:///project/objects/obj_player/create.gml");
});

Deno.test("TextDocument_Definition returns null when GMObject has no files", () => {
  const message = createMockMessage("file:///test.gml", 0, 5);
  const mockGMObject = { name: "obj_empty" };
  const mockAssets = { gmlFilesArray: [] };
  const mockSymbol = {
    native: false,
    type: { kind: "Asset.GMObject" },
    getTypeByKind: () => mockGMObject,
  };
  const mockFile = { getReferenceAt: () => ({ item: mockSymbol }) };
  const mockProject = {
    getFile: () => mockFile,
    getAssets: () => mockAssets,
  } as unknown as GMLProject;

  const responses = createMockResponses<LSPResponseMessage>();
  const handler = new TextDocument_Definition(
    message,
    mockProject,
    createMockLogger(),
    responses,
  );

  handler.handle();

  const responsesList = responses.getAll();
  assertEquals(responsesList[0].result, null);
});
