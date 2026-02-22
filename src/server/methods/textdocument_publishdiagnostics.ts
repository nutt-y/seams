import type { Code } from "@bscotch/gml-parser";
import type winston from "winston";
import { RPC_VER } from "../constants.ts";
import type { ElementQueue } from "../element_queue.ts";
import {
  type Diagnostic,
  DiagnosticSeverity,
  type DocumentUri,
  type integer,
  type LSPMessage,
  type LSPNotificationMessage,
} from "./message.types.ts";

/**
 * Parameters for sending over diagnostics
 */
type PublishDiagnosticsParams = {
  /**
   * The URI for which diagnostic information is reported
   */
  uri: DocumentUri;

  /**
   * Optional the version number of the document
   * the diagnostics are published for
   */
  version?: integer;

  /**
   * Ann array of diagnostic information items.
   */
  diagnostics: Diagnostic[];
};

/**
 * Publish Diagnostics for the following
 */
export class TextDocument_PublishDiagnostics {
  // constructor variables
  private file: Code; // The file to use
  // private logger: winston.Logger; // Debug logger
  private responses: ElementQueue<LSPMessage>; // Responses
  private version: integer | undefined; // The version of the file for diagnostics

  /**
   * mapping for string to actual diagnostic
   */
  public static readonly DIAGNOSTIC_MAP = {
    warn: DiagnosticSeverity.WARNING,
    error: DiagnosticSeverity.ERROR,
    hint: DiagnosticSeverity.HINT,
    information: DiagnosticSeverity.INFORMATION,
  };

  /**
   *  Publish the diagnostics for the current file changed
   *  @param file The file to check diagnostics for
   *  @param logger The debugging logger
   *  @param responses The queue for responses
   *  @param version The version of the document the diagnostics are published for
   */ constructor(
    file: Code,
    _logger: winston.Logger,
    responses: ElementQueue<LSPMessage>,
    version?: integer,
  ) {
    this.file = file;
    // this.logger = logger;
    this.responses = responses;
    this.version = version;
  }

  public getDiagnostics(): void {
    // Go through each diagnostic of this file
    const diagnostics = this.file.updateDiagnostics();

    const notification = this.createNotification(diagnostics);

    this.responses.enqueueElement([notification]);
  }

  /**
   * Create the notification of the diagnostic to change
   * @param diagnostics The diagnostics to return
   */
  private createNotification(
    diagnostics: ReturnType<typeof this.file.updateDiagnostics>,
  ) {
    const responseDiagnostics: Diagnostic[] = diagnostics.map(
      (d) =>
        ({
          range: {
            start: {
              line: d.location.start.line - 1,
              character: d.location.start.column - 1,
            },
            end: {
              line: d.location.end.line - 1,
              character: d.location.end.column - 1,
            },
          },
          severity:
            TextDocument_PublishDiagnostics.DIAGNOSTIC_MAP[
              d.severity as keyof typeof TextDocument_PublishDiagnostics.DIAGNOSTIC_MAP
            ],
          message: d.message,
        }) satisfies Diagnostic,
    );

    const response: LSPNotificationMessage = {
      jsonrpc: RPC_VER,
      method: "textDocument/publishDiagnostics",
      params: {
        uri: `file://${this.file.path.absolute}`,
        version: this.version,
        diagnostics: responseDiagnostics as unknown as [],
      } satisfies PublishDiagnosticsParams as never,
    };

    return response;
  }
}
