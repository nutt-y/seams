import type { Reference, Scope } from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import type {
  DocumentHighlight,
  LSPRequestMessage,
  PartialResultParams,
  TextDocumentPositionParams,
  WorkDoneProgressParams,
} from "./message.types.ts";

/**
 * Request params
 */
type Params = LSPRequestMessage["params"] &
  TextDocumentPositionParams &
  WorkDoneProgressParams &
  PartialResultParams;

/**
 * Response
 */
type Response = DocumentHighlight[] | null;

/**
 * Highlight all occurrences of the variable under the cursor
 */
export class TextDocument_DocumentHighlight extends AbstractHandler {
  /**
   * Get all of the occurrences of the variable under the cursor
   */
  public override handle(): Promise<void> | void {
    const { params } = this.message;
    const { textDocument, position } = params as Params;
    const { uri } = textDocument;

    let response: Response = null;

    const file = this.getFile(uri);
    if (file) {
      const { line, character: column } = position;
      const reference = file.getReferenceAt(line + 1, column + 1);
      const scope = file.getScopeRangeAt(line + 1, column + 1);

      if (reference && scope) {
        const references = this.getReferencesInScope(reference, scope);
        const highlights = this.getDocumentHighlights(references);

        if (highlights.length > 0) {
          response = highlights;
        }
      }
    }

    // Enqueue the final part
    const message = this.generateResponseMessage({ result: response });
    this.queueResponseMessage(message);
  }

  /**
   * Get all of the references in the scope for the current symbol under the cursor
   * @param reference The reference to look for
   * @param scope The scope to look at
   * @returns The references filtered to this scope
   */
  private getReferencesInScope(reference: Reference, scope: Scope) {
    const symbol = reference.item;
    const start = scope.start;
    const end = scope.end;
    const refs = symbol.refs;
    const symbolFile = reference.file.path;

    const referencesFiltered = Array.from(refs).filter((ref) => {
      const sameFile = ref.file.path.equals(symbolFile);

      return (
        sameFile &&
        ref.start.offset >= start.offset &&
        ref.end.offset <= end.offset &&
        !(ref.start.equals(reference.start) && ref.end.equals(reference.end))
      );
    });

    return referencesFiltered;
  }

  /**
   * Get the document highlights transformed from the references
   * @param references Array of references
   * @returns Array of document highlights
   */
  private getDocumentHighlights(references: Reference[]): DocumentHighlight[] {
    const highlights: DocumentHighlight[] = references.map((reference) => {
      const start = reference.start;
      const end = reference.end;

      return {
        range: {
          start: {
            line: start.line - 1,
            character: start.column - 1,
          },
          end: {
            line: end.line - 1,
            character: end.column,
          },
        },
      };
    });

    return highlights;
  }
}
