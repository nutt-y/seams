import type { Asset, Signifier } from "@bscotch/gml-parser";
import { RPC_VER } from "../constants.ts";
import { AbstractHandler } from "./abstract.ts";
import type {
  LSPRequestMessage,
  LSPResponseMessage,
  MarkupContent,
  Position,
  Range,
  TextDocumentIdentifier,
} from "./message.types.ts";

/**
 * Given parameters
 */
type Params = LSPRequestMessage["params"] & {
  /**
   * The text document
   */
  textDocument: TextDocumentIdentifier;

  /**
   * The position inside the text document
   */
  position: Position;
};

/**
 * The result of a hover request
 */
type Hover = LSPResponseMessage["result"] & {
  /**
   * The hover's content
   */
  contents: MarkupContent;

  /**
   * An optional range is a range inside a text odcument that is used to visualize to hover
   */
  range?: Range;
};

export class TextDocument_Hover extends AbstractHandler {
  /**
   * Handle the hover
   */
  public override handle(): void {
    const { params, id } = this.message;
    const { textDocument, position } = params as Params;
    const { uri } = textDocument;

    // Response messages to send back
    const responses: LSPResponseMessage[] = [];

    // Get the file
    const file = this.getFile(uri);

    if (file) {
      const { character: column, line } = position;
      const ref = file.getReferenceAt(line + 1, column + 1); // 1 offset for both
      const symbol = ref?.item;

      if (ref && symbol) {
        let contents: MarkupContent = {
          kind: "markdown",
          value: "",
        };

        const kind = symbol.type.kind;

        switch (kind) {
          case "Function":
            contents = this.getFunctionHover(symbol);
            break;

          case "Asset.GMObject":
            contents = this.getGMObjectHover(symbol);
            break;

          default:
            contents = this.getAnyHover(symbol);
            break;
        }

        responses.push({
          jsonrpc: RPC_VER,
          id: id,
          result: {
            contents: contents,
          } as Hover,
        });
      }
    }

    this.responses.enqueueElement(responses);
  }

  /**
   * Get the hover information for a function
   * @param symbol The function symbol
   */
  private getFunctionHover(symbol: Signifier): MarkupContent {
    const name = symbol.name;

    const item = symbol.getTypeByKind("Function");
    const parameters = item?.listParameters() ?? [];
    const details = item?.returns?.toFeatherString() ?? "void";
    const description = item?.description ?? "";

    // Text content
    const parameterString = parameters.reduce((acc, parameter, index) => {
      let str = "";

      const paramName = parameter?.name ?? "";
      const paramType = parameter?.type.toFeatherString() ?? "Any";

      str += `${paramName}: ${paramType}${
        index < parameters.length - 1 ? ", " : ""
      }`;

      return acc + str;
    }, "");

    return {
      kind: "markdown",
      value: [
        "```gml",
        `${name}(${parameterString}): ${details}`,
        "```",
        description.length > 0 && "---",
        description.length > 0 && description,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  /**
   * Get the hover for a generic symbol that we do not have more information for
   */
  private getAnyHover(symbol: Signifier): MarkupContent {
    const name = symbol.name;
    const type = symbol.type.toFeatherString();
    const description = symbol?.description ?? "";

    return {
      kind: "markdown",
      value: [
        `${name}: \`${type}\``,
        description.length > 0 && "---",
        description.length > 0 && description,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  /**
   * Get the GM Object's file location and other information given the object type
   * @param obj The GM Object
   * @returns Markup Content if avaiable
   */
  private getGMObjectHover(symbol: Signifier): MarkupContent {
    const name = symbol.name;
    const obj = symbol.getTypeByKind("Asset.GMObject");
    const type = obj?.toFeatherString() ?? "";

    let path: string | null = null;

    const assets = this.project.getAssets<Asset<"objects">>(name);

    // Get the directory of the object
    if (assets) {
      path = assets.dir.absolute;

      // Only add one path if possible
      const files = assets.gmlFilesArray;
      if (files.length === 1) {
        path = files[0].path.absolute;
      }
    }

    return {
      kind: "markdown",
      value: [
        `${name}: ${type}`,
        path && "---",
        path && `Defined at **${path}**`,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
}
