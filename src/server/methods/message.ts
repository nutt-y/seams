import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import type { ElementQueue } from "../element_queue.ts";
import type { AbstractHandler } from "./abstract.ts";
import { Exit } from "./exit.ts";
import { Initialize } from "./initialize.ts";
import { Initialized } from "./initialized.ts";
import type {
  Handler,
  LSPMessage,
  LSPRequestMessage,
} from "./message.types.ts";
import { Nothing } from "./nothing.ts";
import { TextDocument_Completion } from "./textdocument_completion.ts";
import { TextDocument_Definition } from "./textdocument_definition.ts";
import { TextDocument_DidChange } from "./textdocument_didchange.ts";
import { TextDocument_DidOpen } from "./textdocument_didopen.ts";
import { TextDocument_DidSave } from "./textdocument_didsave.ts";
import { TextDocument_DocumentHighlight } from "./textdocument_documenthighlight.ts";
import { TextDocument_Hover } from "./textdocument_hover.ts";
import { TextDocument_InlayHint } from "./textdocument_inlayHint.ts";
import { TextDocument_References } from "./textdocument_references.ts";
import { TextDocument_SemanticTokens_Full } from "./textdocument_semanticTokens_full.ts";
import { TextDocument_SignatureHelp } from "./textdocument_signaturehelp.ts";

/**
 * The methods supported by gml lsp
 * Declare the methods that are sent through stdin
 * to keep track of supported functionality
 */
enum Methods {
  INITIALIZE = "initialize",
  INITIALIZED = "initialized",
  TEXTDOCUMENT_DIDOPEN = "textDocument/didOpen",
  TEXTDOCUMENT_HOVER = "textDocument/hover",
  TEXTDOCUMENT_DIDCHANGE = "textDocument/didChange",
  TEXTDOCUMENT_DEFINITION = "textDocument/definition",
  TEXTDOCUMENT_DIDSAVE = "textDocument/didSave",
  TEXTDOCUMENT_COMPLETION = "textDocument/completion",
  TEXTDOCUMENT_SIGNATUREHELP = "textDocument/signatureHelp",
  TEXTDOCUMENT_REFERENCES = "textDocument/references",
  TEXTDOCUMENT_INLAYHINT = "textDocument/inlayHint",
  TEXTDOCUMENT_SEMANTICTOKENS_FULL = "textDocument/semanticTokens/full",
  TEXTDOCUMENT_HIGHLIGHTS = "textDocument/documentHighlight",
  EXIT = "exit",
  NOTHING = "nothing",
}

/**
 * Map that contains the action to complete when the specified method request
 * comes through
 */
const HANDLERS: {
  [T in Methods]: new (
    ...input: ConstructorParameters<typeof AbstractHandler>
  ) => Handler;
} = {
  [Methods.INITIALIZE]: Initialize,
  [Methods.INITIALIZED]: Initialized,
  [Methods.TEXTDOCUMENT_DIDOPEN]: TextDocument_DidOpen,
  [Methods.TEXTDOCUMENT_HOVER]: TextDocument_Hover,
  [Methods.TEXTDOCUMENT_DIDCHANGE]: TextDocument_DidChange,
  [Methods.TEXTDOCUMENT_DEFINITION]: TextDocument_Definition,
  [Methods.TEXTDOCUMENT_DIDSAVE]: TextDocument_DidSave,
  [Methods.TEXTDOCUMENT_COMPLETION]: TextDocument_Completion,
  [Methods.TEXTDOCUMENT_SIGNATUREHELP]: TextDocument_SignatureHelp,
  [Methods.TEXTDOCUMENT_REFERENCES]: TextDocument_References,
  [Methods.TEXTDOCUMENT_INLAYHINT]: TextDocument_InlayHint,
  [Methods.TEXTDOCUMENT_SEMANTICTOKENS_FULL]: TextDocument_SemanticTokens_Full,
  [Methods.TEXTDOCUMENT_HIGHLIGHTS]: TextDocument_DocumentHighlight,
  [Methods.EXIT]: Exit,
  [Methods.NOTHING]: Nothing,
};

/**
 * Handle the messages parsed
 * @param options Options to send over
 */
export const handleMessage = async ({
  method,
  message,
  logger,
  project,
  responses,
}: {
  /**
   * The method from the request
   */
  method: string;

  /**
   * The full message content
   */
  message: LSPRequestMessage;

  /**
   * The logger
   */
  logger: winston.Logger;

  /**
   * GML Project reference
   */
  project: GMLProject;

  /**
   * The queue of messages sent
   */
  responses: ElementQueue<LSPMessage>;
}): Promise<void> => {
  // Get the handler for this message
  const handlerClass =
    method in HANDLERS
      ? HANDLERS[method as Methods]
      : HANDLERS[Methods.NOTHING];

  const handler = new handlerClass(message, project, logger, responses);

  await handler.handle();
};
