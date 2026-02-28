import type { Reference } from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import type {
  Location,
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
 * Send back references if they exist
 */
type Response = Location[] | null;

/**
 * Get the references for a symbol
 */
export class TextDocument_References extends AbstractHandler {
  /**
   * Handle symbol references and return them
   */
  public override handle(): void {
    const { params } = this.message;
    const { textDocument, position } = params as Params;
    const { uri } = textDocument;

    const file = this.getFile(uri);

    let locations: Response = null;

    if (file) {
      const { line, character: column } = position;
      const fileReference = file.getReferenceAt(line + 1, column + 1);

      const refs = fileReference?.item.refs;
      if (refs) {
        locations = this.getReferenceLocations(Array.from(refs));
      }
    }

    const message = this.generateResponseMessage({ result: locations });
    this.queueResponseMessage(message);
  }

  /**
   * Get all reference locations
   * @param refs Array of refs
   */
  private getReferenceLocations(refs: Reference[]): Location[] {
    const locations: Location[] = [];

    for (const ref of refs) {
      const start = ref.start;
      const end = ref.end;
      const path = ref.file.path.absolute;

      locations.push({
        uri: `file://${path}`,
        range: {
          start: {
            line: start.line - 1,
            character: start.column - 1,
          },
          end: {
            line: end.line - 1,
            character: end.column - 1,
          },
        },
      });
    }

    return locations;
  }
}
