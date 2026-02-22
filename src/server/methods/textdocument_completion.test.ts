import { assertEquals } from "@std/assert";
import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import type { ElementQueue } from "../element_queue.ts";
import type { LSPRequestMessage } from "./message.types.ts";
import { CompletionItemKind } from "./message.types.ts";
import { TextDocument_Completion } from "./textdocument_completion.ts";

function createMockMessage(
  method: string = "textDocument/completion",
): LSPRequestMessage {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: {
      textDocument: { uri: "file:///test.gml" },
      position: { line: 0, character: 0 },
    },
  };
}

function createMockLogger(): winston.Logger {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  } as unknown as winston.Logger;
}

function createMockProject(): GMLProject {
  return {
    getFile: () => null,
    getAssets: () => null,
  } as unknown as GMLProject;
}

function createMockResponses<T>(): ElementQueue<T> {
  return {
    enqueueElement: () => {},
    getAll: () => [],
  } as unknown as ElementQueue<T>;
}

Deno.test("TextDocument_Completion getCompletionItem returns correct kind for Function", () => {
  const message = createMockMessage();
  const handler = new TextDocument_Completion(
    message,
    createMockProject(),
    createMockLogger(),
    createMockResponses(),
  );

  const mockSymbol = {
    name: "testFunction",
    type: {
      kind: "Function",
      toFeatherString: () => "void",
    },
    description: "A test function",
    getTypeByKind: () => ({
      name: "testFunction",
      listParameters: () => [],
      returns: { toFeatherString: () => "void" },
      description: "A test function",
      kind: "Function",
    }),
  } as never;

  const item = handler.getCompletionItem(mockSymbol);

  assertEquals(item.kind, CompletionItemKind.FUNCTION);
  assertEquals(item.label, "testFunction");
});

Deno.test("TextDocument_Completion getCompletionItem returns correct kind for Struct", () => {
  const message = createMockMessage();
  const handler = new TextDocument_Completion(
    message,
    createMockProject(),
    createMockLogger(),
    createMockResponses(),
  );

  const mockSymbol = {
    name: "TestStruct",
    type: {
      kind: "Struct",
      toFeatherString: () => "TestStruct",
    },
    description: "A test struct",
    getTypeByKind: () => ({
      name: "TestStruct",
      toFeatherString: () => "TestStruct",
      description: "A test struct",
      details: "Test details",
      listMembers: () => [],
      kind: "Struct",
    }),
  } as never;

  const item = handler.getCompletionItem(mockSymbol);

  assertEquals(item.kind, CompletionItemKind.STRUCT);
  assertEquals(item.label, "TestStruct");
});

Deno.test("TextDocument_Completion getCompletionItem returns correct kind for Enum", () => {
  const message = createMockMessage();
  const handler = new TextDocument_Completion(
    message,
    createMockProject(),
    createMockLogger(),
    createMockResponses(),
  );

  const mockSymbol = {
    name: "TestEnum",
    type: {
      kind: "Enum",
      toFeatherString: () => "TestEnum",
    },
    description: "A test enum",
    getTypeByKind: () => null,
  } as never;

  const item = handler.getCompletionItem(mockSymbol);

  assertEquals(item.kind, CompletionItemKind.ENUM);
});

Deno.test("TextDocument_Completion getCompletionItem returns correct kind for Real type", () => {
  const message = createMockMessage();
  const handler = new TextDocument_Completion(
    message,
    createMockProject(),
    createMockLogger(),
    createMockResponses(),
  );

  const mockSymbol = {
    name: "myVariable",
    type: {
      kind: "Real",
      toFeatherString: () => "number",
    },
    description: "A test variable",
    getTypeByKind: () => null,
  } as never;

  const item = handler.getCompletionItem(mockSymbol);

  // Real maps to VALUE in CompletionItemKind
  assertEquals(item.kind, CompletionItemKind.VALUE);
});

Deno.test("TextDocument_Completion getCompletionItem returns correct kind for Constant", () => {
  const message = createMockMessage();
  const handler = new TextDocument_Completion(
    message,
    createMockProject(),
    createMockLogger(),
    createMockResponses(),
  );

  const mockSymbol = {
    name: "myConst",
    type: {
      kind: "String",
      toFeatherString: () => "string",
    },
    description: "A constant",
    getTypeByKind: () => null,
  } as never;

  const item = handler.getCompletionItem(mockSymbol);

  assertEquals(item.kind, CompletionItemKind.CONSTANT);
});
