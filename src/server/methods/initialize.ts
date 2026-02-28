import { AbstractHandler } from "../abstract.ts";
import { WindowWorkDoneProgress } from "../notifications/window_work_done_progress.ts";
import {
  type ClientCapabilities,
  type integer,
  type LSPRequestMessage,
  type LSPResponseMessage,
  type ServerCapabilities,
  TextDocumentSyncKind,
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
type InitializeResponse = {
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

/**
 * The initialize handler
 */
export class Initialize extends AbstractHandler {
  /**
   * Return server capabilities for the gml lsp
   * @param params The capabilities of the client
   */
  public override async handle(): Promise<void> {
    const { params } = this.message;

    // Keep track of initializing the gml project
    const progress = new WindowWorkDoneProgress(
      this.project,
      this.logger,
      this.responses,
      "initialize",
    );

    // Build the initialize response
    const initialResponse = this.getInitialResponse();
    this.queueResponseMessage(initialResponse);

    // Cast to the parameters for an initialize class
    const { workspaceFolders } = params as InitializeParams;

    // Initialize the project
    if (workspaceFolders && workspaceFolders.length > 0) {
      const { uri } = workspaceFolders[0];
      const path = this.getDocumentPath(uri);

      // Begin Progress for initializing the project
      progress.begin("Indexing GML Project");

      const initialized = await this.project.initializeProject(path);
      if (!initialized) {
        const error = this.generateError(
          "SERVER_NOT_INITIALIZED",
          "Could not find project",
        );
        const response = this.generateResponseMessage({ error: error });

        this.queueResponseMessage(response);

        setTimeout(() => Deno.exit(1), 500);
      } else {
        progress.end("GML Project Processed");
      }
    } else {
      const error = this.generateError(
        "SERVER_NOT_INITIALIZED",
        "Internal server error",
      );
      const response = this.generateResponseMessage({ error: error });

      this.queueResponseMessage(response);

      setTimeout(() => Deno.exit(1), 500);
    }
  }

  /**
   * Get the server capabilities
   * @return The server capabilities
   */
  private getServerCapabilities(): ServerCapabilities {
    const capabilities: ServerCapabilities = {
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
    };

    return capabilities;
  }

  /**
   * Get basic server information
   * @returns The server information to return
   */
  private getServerInformation(): InitializeResponse["serverInfo"] {
    const information = {
      name: "GameMaker Studio Language LSP",
      version: "0.1",
    };

    return information;
  }

  /**
   * Get an initial response with the server capabilities and information
   * @returns An initialize response
   */
  private getInitialResponse(): LSPResponseMessage {
    const capabilities = this.getServerCapabilities();
    const info = this.getServerInformation();

    const message = this.generateResponseMessage({
      result: {
        capabilities: capabilities,
        serverInfo: info,
      },
    });

    return message;
  }
}
