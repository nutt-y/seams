import type { Asset, Signifier, Type } from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import { RPC_VER } from "../constants.ts";
import type {
  Location,
  LocationLink,
  LSPRequestMessage,
  LSPResponseMessage,
  PartialResultParams,
  TextDocumentPositionParams,
  WorkDoneProgressParams,
} from "./message.types.ts";

/**
 * Type parameters
 */
type Params = LSPRequestMessage["params"] &
  TextDocumentPositionParams &
  WorkDoneProgressParams &
  PartialResultParams;

/**
 * Response expected
 */
type Response = Location | Location[] | LocationLink | null;

/**
 * Get the definition of a symbol
 */
export class TextDocument_Definition extends AbstractHandler {
  /**
   * Return the diagnostic located in the file's position
   */
  public override handle(): void {
    const { params, id } = this.message;
    const { textDocument, position } = params as Params;
    const { uri } = textDocument;

    // Get the file
    const file = this.getFile(uri);

    // The locations
    let location: Response = null;

    // Get the Symbols at the file
    if (file) {
      const { line, character: column } = position;
      const ref = file.getReferenceAt(line + 1, column + 1);
      const symbol = ref?.item;

      if (symbol) {
        const native = symbol.native;

        // Only go to defintions for non builtin functions
        // NOTE: Do something for a native symbol, probably open the doc browser?
        if (!native) {
          const kind = symbol.type.kind;
          const def = symbol.def; // Get the definition position
          const item = symbol.getTypeByKind(kind);

          // Based on the kind, get the right definition
          switch (kind) {
            case "Asset.GMObject": // Get all object events and send them as definitions
              location = this.getGMObjectDefinitions(
                item as Type<"Asset.GMObject">,
              );
              break;

            default: // Default symbol that is accessible through an actual file defintion
              location = this.getSymbolDefinition(def);
              break;
          }
        }
      }
    }

    this.responses.enqueueElement([
      {
        jsonrpc: RPC_VER,
        id: id,
        result: location,
      } as LSPResponseMessage,
    ]);
  }

  /**
   * Get the symbol definition location based on the def position
   * @param def The defintion for the symbol, if any exists
   * @return The location object if a definition exists
   */
  private getSymbolDefinition(def: Signifier["def"]): Location | null {
    let location: Location | null = null;

    if (def?.file) {
      const start = def.start;
      const end = def.end;
      const path = def.file.path.absolute;

      location = {
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
      };
    }

    return location;
  }

  /**
   * Given an GM Object, return all of the events that correspond to this object
   * This returns the documents for the events defined by this object
   * @param item The GM Object
   * @returns A location array if this object has any events
   */
  private getGMObjectDefinitions(
    obj: Type<"Asset.GMObject">,
  ): Location[] | null {
    let locations: Location[] | null = null;

    // Data about object
    const name = obj.name ?? "";

    const assets = this.project.getAssets<Asset<"objects">>(name);

    if (assets) {
      const files = assets.gmlFilesArray;

      if (files.length > 0) {
        // Initialize empty array since we know we do have files to return
        locations = [];
      }

      for (const file of files) {
        const path = file.path.absolute;

        const location: Location = {
          uri: `file://${path}`,
          range: {
            start: {
              line: 0,
              character: 0,
            },
            end: {
              line: 0,
              character: 0,
            },
          },
        };

        locations?.push(location);
      }
    }

    return locations;
  }

  public _bruh() {
    // if (symbol.native) { // builtin symbol
    //           const builtin = this.project.getBuiltInSymbols();
    //           // const token = builtin?.globalSelf.getMember(symbol.name);
    //           const token = builtin?.globalSelf.getMember(symbol.name);
    //
    //           this.logger.info(
    //             "Native Symbol: " + token?.name +
    //               " Description: " + token?.description,
    //           );
    //         }
  }
}
