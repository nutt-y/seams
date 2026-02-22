import { RPC_VER } from "../constants.ts";
import { AbstractHandler } from "./abstract.ts";
import {
  type ClientCapabilities,
  type integer,
  type LSPNotificationMessage,
  type LSPObject,
  type LSPRequestMessage,
  type LSPResponseMessage,
  type ProgressParams,
  type ProgressToken,
  type ServerCapabilities,
  TextDocumentSyncKind,
  type WorkDoneProgressBegin,
  type WorkDoneProgressEnd,
  type WorkspaceFolder,
} from "./message.types.ts";
import { TextDocument_SemanticTokens_Full } from "./textdocument_semanticTokens_full.ts";

/**
 * Parameters specific for initializing lsp
 */
type InitializeParams = LSPRequestMessage["params"] & {
  /**
   * The process if of the parent process that started the server.
   */
  processId: integer | null;

  /**
   * Information about the client
   */
  clientInfo: {
    /**
     * Name of the client
     */
    name: string;

    /**
     * Version of client
     */
    version?: string;
  };

  /**
   * The workspace folders configured in the client
   */
  workspaceFolders?: WorkspaceFolder[] | null;

  /**
   * The capabilities provided by the client
   */
  capabilities: ClientCapabilities;
};

/**
 * The response for the initial request
 */
type InitializeResponse = LSPObject & {
  /**
   * The capabilities of the gml lsp
   */
  capabilities: ServerCapabilities;

  /**
   * Information about the server
   */
  serverInfo?: {
    /**
     * The gml lsp name
     */
    name: string;

    /**
     * Version of the server
     */
    version?: string;
  };
};

type ProgressStartParams = ProgressParams<WorkDoneProgressBegin>;
type ProgressEndParams = ProgressParams<WorkDoneProgressEnd>;

/**
 * The initialize handler
 */
export class Initialize extends AbstractHandler {
  private readonly token: ProgressToken = "initialize"; // The token to use for sending the notification that the project is initializing

  /**
   * Return server capabilities for the gml lsp
   * @param params The capabilities of the client
   */
  public override async handle(): Promise<void> {
    const { id, params } = this.message;

    // Build the initialize response
    this.responses.enqueueElement([
      {
        id: id,
        jsonrpc: RPC_VER,
        result: {
          capabilities: {
            textDocumentSync: {
              openClose: true,
              change: TextDocumentSyncKind.Full,
              save: {
                includeText: true,
              },
            },
            completionProvider: {
              triggerCharacters: ["."],
              resolveProvider: false,
            },
            signatureHelpProvider: {
              triggerCharacters: ["(", ","],
            },
            hoverProvider: true,
            definitionProvider: true,
            referencesProvider: {
              workDoneProgress: true,
            },
            inlayHintProvider: {
              resolveProvider: false,
              workDoneProgress: false,
            },
            semanticTokensProvider: {
              legend: TextDocument_SemanticTokens_Full.GetLegend(),
              full: true,
            },
            documentHighlightProvider: true,
          },
          serverInfo: {
            name: "GameMaker Studio Language LSP",
            version: "0.1",
          },
        } as InitializeResponse,
      } as LSPResponseMessage,
      {
        id: id,
        jsonrpc: RPC_VER,
        method: "window/workDoneProgress/create",
        params: {
          token: this.token,
        },
      } as LSPRequestMessage,
      {
        jsonrpc: RPC_VER,
        method: "$/progress",
        params: {
          token: this.token,
          value: {
            cancellable: false,
            kind: "begin",
            title: "Starting Project",
          },
        } satisfies ProgressStartParams,
      } as LSPNotificationMessage,
    ]);

    // Cast to the parameters for an initialize class
    const { workspaceFolders } = params as InitializeParams;

    // Initialize the project
    if (workspaceFolders && workspaceFolders.length > 0) {
      const { uri } = workspaceFolders[0];
      const path = this.getDocumentPath(uri);

      const initialized = await this.project.initializeProject(path);
      if (!initialized) {
        // TODO: Return an error
      } else {
        // Return the progress done notification
        this.responses.enqueueElement([
          {
            jsonrpc: RPC_VER,
            method: "$/progress",
            params: {
              token: this.token,
              value: {
                kind: "end",
                message: "Project started",
              },
            } satisfies ProgressEndParams,
          } as LSPNotificationMessage,
        ]);
      }
    } else {
      // TODO: Return an error
      Deno.exit(1);
    }
  }
}
