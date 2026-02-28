import type { Code } from "@bscotch/gml-parser";
import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import { NotificationHandler } from "../abstract.ts";
import type { ElementQueue } from "../element_queue.ts";
import {
  type Diagnostic,
  DiagnosticSeverity,
  type DocumentUri,
  type integer,
  type LSPMessage,
} from "../methods/message.types.ts";

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
 * @class Get diagnostics for a specific file and send it back to the client
 */
export class TextDocument_PublishDiagnostics extends NotificationHandler {
  // constructor variables
  private file: Code; // The file to use

  // The version of the file for diagnostics
  private version: integer | undefined;

  /**
   * mapping for string to actual diagnostic
   */
  public static readonly DIAGNOSTIC_MAP = {
    warn: DiagnosticSeverity.WARNING,
    error: DiagnosticSeverity.ERROR,
    hint: DiagnosticSeverity.HINT,
    information: DiagnosticSeverity.INFORMATION,
  };

  constructor(
    file: Code,
    version: integer | undefined,
    logger: winston.Logger,
    responses: ElementQueue<LSPMessage>,
  ) {
    super({} as GMLProject, logger, responses);

    this.file = file;
    this.version = version;
  }

  /**
   * Publish
   */
  public override handle(): Promise<void> | void {
    const diagnostics = this.file.updateDiagnostics();
    const notification = this.createNotification(diagnostics);

    this.queueNotification(notification);
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

    const notification = this.generateNotificationMessage(
      "textDocument/publishDiagnostics",
      {
        uri: `file://${this.file.path.absolute}`,
        version: this.version,
        diagnostics: responseDiagnostics,
      } satisfies PublishDiagnosticsParams,
    );

    return notification;
  }
}
