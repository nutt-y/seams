import type { Reference } from "@bscotch/gml-parser";
import { RPC_VER } from "../constants.ts";
import { AbstractHandler } from "./abstract.ts";
import type {
  Location,
  LSPRequestMessage,
  LSPResponseMessage,
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
    const { params, id } = this.message;
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

    this.responses.enqueueElement([
      {
        jsonrpc: RPC_VER,
        id: id,
        result: locations,
      } as LSPResponseMessage,
    ]);
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
