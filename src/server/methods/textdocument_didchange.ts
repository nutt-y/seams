import { AbstractHandler } from "../abstract.ts";
import { TextDocument_PublishDiagnostics } from "../notifications/textdocument_publishdiagnostics.ts";
import type {
  LSPRequestMessage,
  TextDocumentContentChangeEvent,
  VersionedTextDocumentIdentifier,
} from "./message.types.ts";

type Params = LSPRequestMessage["params"] & {
  /**
   * The document that did change. The version number points to the version after all provided
   * content change shave been applied.
   */
  textDocument: VersionedTextDocumentIdentifier;

  /**
   * The actual content changes. The content changes describe single state
   * changes to the document. So if there are two content changes c1 (at
   * array index 0) and c2 (at array index 1) for a document in state S then
   * c1 moves the document from S to S' and c2 from S' to S''. So c1 is
   * computed on the state S and c2 is computed on the state S'.
   *
   * To mirror the content of a document using change events use the following
   * approach:
   * - start with the same initial content
   * - apply the 'textDocument/didChange' notifications in the order you
   *   receive them.
   * - apply the `TextDocumentContentChangeEvent`s in a single notification
   *   in the order you receive them.
   */
  contentChanges: TextDocumentContentChangeEvent[];
};

/**
 * Text document did change
 */
export class TextDocument_DidChange extends AbstractHandler {
  /**
   * Handle a change in a specific file by reloading the file and references
   */
  public override async handle(): Promise<void> {
    const { params } = this.message;
    const { textDocument, contentChanges } = params as Params;
    const { uri, version } = textDocument;

    const file = this.getFile(uri);

    if (file) {
      if (contentChanges.length > 0) {
        const { text } = contentChanges[0];

        // Update the contents of the file in memory
        await file.reload(text);

        // Find diagnostics
        const diagnostics = new TextDocument_PublishDiagnostics(
          file,
          version,
          this.logger,
          this.responses,
        );

        // Check diagnostics
        diagnostics.handle();
      }
    }
  }
}
