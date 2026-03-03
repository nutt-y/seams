import {
  // type Asset,
  objectEvents as GMEvents,
  type Reference,
  type Signifier,
} from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import type {
  CodeAction,
  CodeActionContext,
  PartialResultParams,
  Range,
  TextDocumentIdentifier,
  WorkDoneProgressParams,
} from "./message.types.ts";
import { WorkspaceCommands } from "./workspace_executecommand.ts";

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
    const { start } = range;
    const { uri } = textDocument;

    const file = this.getFile(uri);

    // code actions to send
    let actions: Response = null;

    // Check the position of the cursor
    if (file) {
      const refUnderCursor = file.getReferenceAt(
        start.line + 1,
        start.character + 1,
      );

      // Add references code actions
      if (refUnderCursor) {
        actions = this.getReferenceCodeActions(refUnderCursor);
      }
    }

    const message = this.generateResponseMessage({ result: actions });
    this.queueResponseMessage(message);
  }

  /**
   * Get the code actions for a reference
   * @param reference The reference to get the code actions for
   */
  private getReferenceCodeActions(reference: Reference): CodeAction[] {
    let actions: CodeAction[] = [];

    const item = reference.item;
    const kind = item.type.kind;

    switch (kind) {
      case "Asset.GMObject":
        actions = this.getGMObjectCodeActions(item);
        break;
    }

    return actions;
  }

  /**
   * Code actions for gm objects include creating/deleting events
   * @param symbol The gm object
   * @returns An array of code actions that can be done with a gm object
   */
  private getGMObjectCodeActions(symbol: Signifier): CodeAction[] {
    const item = symbol.getTypeByKind("Asset.GMObject");

    // Get the name of the asset
    const name = item?.name ?? "";

    // List all events
    const events = Object.values(GMEvents).map((e) => e.label);

    // Get the actions for that object
    const actions: CodeAction[] = events.map((event) => ({
      title: `Create ${event} event for ${name}`,
      command: {
        title: "create event",
        command: WorkspaceCommands.NEW_EVENT,
        arguments: [name, event],
      },
    }));

    return actions;
  }
}
