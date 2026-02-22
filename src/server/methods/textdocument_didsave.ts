import { AbstractHandler } from "./abstract.ts";
import type {
  LSPRequestMessage,
  TextDocumentIdentifier,
} from "./message.types.ts";
import { TextDocument_PublishDiagnostics } from "./textdocument_publishdiagnostics.ts";

/**
 * The parameters
 */
type Params = LSPRequestMessage["params"] & {
  /**
   * The document that was saved
   */
  textDocument: TextDocumentIdentifier;

  /**
   * Optional the content when saved. Depends on the includeText when the
   * save notification was requested.
   */
  text?: string;
};

/**
 * Update file content and any diagnostics
 */
export class TextDocument_DidSave extends AbstractHandler {
  /**
   * Update the text document
   */
  public override async handle(): Promise<void> {
    const { params } = this.message;
    const { textDocument, text } = params as Params;
    const { uri } = textDocument;

    const file = this.getFile(uri);

    if (file) {
      // Update the contents in memory
      await file.reload(text);

      // Find Diagnostics
      const diagnostics = new TextDocument_PublishDiagnostics(
        file,
        this.logger,
        this.responses,
      );

      // Check diagnostics
      diagnostics.getDiagnostics();
    }
  }
}
