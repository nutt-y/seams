import type { Reference } from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import {
  type InlayHint,
  InlayHintKind,
  type LSPRequestMessage,
  type Position,
  type Range,
  type TextDocumentIdentifier,
  type WorkDoneProgressParams,
} from "./message.types.ts";

type Params = LSPRequestMessage["params"] &
  WorkDoneProgressParams & {
    /**
     * The text document.
     */
    textDocument: TextDocumentIdentifier;

    /**
     * The visible document range for which inlay hints should be computed
     */
    range: Range;
  };

/**
 * The result for the inlay hints
 */
type Result = InlayHint[] | null;

/**
 * Inlay hints for references
 */
export class TextDocument_InlayHint extends AbstractHandler {
  /**
   * Inlay hints for current document range
   */
  public override handle(): void {
    const { params } = this.message;
    const { textDocument, range } = params as Params;
    const { uri } = textDocument;
    const { start, end } = range;

    const file = this.getFile(uri);

    let hints: Result = null;

    if (file) {
      const references = file.refs; // Get all references in a file

      // Filter them out
      const referencesInRange = this.getReferencesInRange(
        references,
        { line: start.line + 1, character: start.character + 1 },
        { line: end.line + 1, character: end.character + 1 },
      );

      // Return the inlay hints
      hints = this.getInlayHintsFromReferences(referencesInRange);

      hints = hints.length > 0 ? hints : null;
    }

    const message = this.generateResponseMessage({ result: hints });
    this.queueResponseMessage(message);
  }

  /**
   * Get the references in the range provided, NOTE that the start and end position are 1 based, not 0 based
   * @param references All symbols in the documnet
   * @param start The start position for the range
   * @param end The end position for the range
   */
  private getReferencesInRange(
    references: Reference[],
    start: Position,
    end: Position,
  ): Reference[] {
    const referencesInRange = references.filter((ref) => {
      const refStart = ref.start;
      const refEnd = ref.end;
      const isDef = ref.isDef;

      const inStartRange =
        refStart.line > start.line ||
        (refStart.line === start.line && refStart.column < start.character);
      const inEndRange =
        refEnd.line < end.line ||
        (refEnd.line === end.line && refEnd.column < end.character);

      return isDef && inStartRange && inEndRange;
    });

    return referencesInRange;
  }

  /**
   * Get the inlay hints based on the references provided
   * @param references The references provided
   * @returns Array of inlay hints if any exist
   */
  private getInlayHintsFromReferences(references: Reference[]): InlayHint[] {
    const hints: InlayHint[] = references.map((ref) => {
      const end = ref.end;
      const type = ref.item.type.toFeatherString();
      const parameter = ref.item.parameter;

      return {
        label: `: ${type}`,
        position: {
          line: end.line - 1,
          character: end.column,
        },
        paddingLeft: true,
        paddingRight: true,
        kind: parameter ? InlayHintKind.PARAMETER : InlayHintKind.TYPE,
      };
    });

    return hints;
  }
}
