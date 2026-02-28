import { AbstractHandler } from "../abstract.ts";
import { TextDocument_PublishDiagnostics } from "../notifications/textdocument_publishdiagnostics.ts";
import type { LSPRequestMessage, TextDocumentItem } from "./message.types.ts";

/**
 * Parameters for this message
 */
type Params = LSPRequestMessage["params"] & {
  /**
   * The document that was opened
   */
  textDocument: TextDocumentItem;
};

/**
 * Initialize did open handler
 */
export class TextDocument_DidOpen extends AbstractHandler {
  /** */
  public override handle(): Promise<void> {
    const { params } = this.message;
    const { textDocument } = params as Params;
    const { uri, version } = textDocument;

    const file = this.getFile(uri);

    if (file) {
      const diagnostics = new TextDocument_PublishDiagnostics(
        file,
        version,
        this.logger,
        this.responses,
      );

      // Check diagnostics
      diagnostics.handle();
    }

    return Promise.resolve();
  }
}
