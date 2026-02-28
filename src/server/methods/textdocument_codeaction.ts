import { AbstractHandler } from "../abstract.ts";
import type {
  CodeAction,
  CodeActionContext,
  PartialResultParams,
  Range,
  TextDocumentIdentifier,
  WorkDoneProgressParams,
} from "./message.types.ts";

/**
 * Request parameters
 */
type Params = WorkDoneProgressParams &
  PartialResultParams & {
    /**
     * The document in which the command was invoked
     */
    textDocument: TextDocumentIdentifier;

    /**
     * The range for which the command was invoked
     */
    range: Range;

    /**
     * Context carrying additional information
     */
    context: CodeActionContext;
  };

/**
 * Response parameters
 */
type Response = CodeAction[] | null;

/**
 * @class Get the actions that can run based on the cursor position
 */
export class TextDocument_CodeAction extends AbstractHandler {
  public override handle(): Promise<void> | void {
    const { params } = this.message;
    const { textDocument, range } = params as unknown as Params;
    const { end, start } = range;
    const { uri } = textDocument;

    const file = this.getFile(uri);

    // Check the position of the cursor
    if (file) {
    }
  }

  private getCursorReference(): void {}
}
