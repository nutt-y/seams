import type { Asset, Project, Signifier, Type } from "@bscotch/gml-parser";
import { RPC_VER } from "../constants.ts";
import { AbstractHandler } from "./abstract.ts";
import {
  type CompletionContext,
  type CompletionItem,
  CompletionItemKind,
  type CompletionList,
  type LSPResponseMessage,
  type PartialResultParams,
  type TextDocumentPositionParams,
  type WorkDoneProgressParams,
} from "./message.types.ts";

/**
 * Parameters for this message
 */
type Params = TextDocumentPositionParams &
  WorkDoneProgressParams &
  PartialResultParams & {
    /**
     * The completion context. This is only available if the client specifies
     * to send this using the client capability
     * `completion.contextSupport === true`
     */
    context?: CompletionContext;
  };

/**
 * The response
 */
type Response = CompletionList | CompletionItem[] | null;

/**
 * Completion request to return items related to the request
 */
export class TextDocument_Completion extends AbstractHandler {
  /**
   * Push the items that match the criteria
   */
  public override handle(): void {
    const { params, id } = this.message;
    const { textDocument, position, context } = params as unknown as Params;
    const { uri } = textDocument;
    const { character: column, line } = position;
    const triggerCharacter = context?.triggerCharacter ?? "";

    // The symbols
    let symbols: Signifier[] = [];

    let response: Response = null;

    const file = this.getFile(uri);
    if (file) {
      switch (triggerCharacter) {
        case ".":
          symbols = this.getObjectMembers(file, line + 1, column + 1);
          break;

        default:
          symbols = file.getInScopeSymbolsAt(line + 1, column + 1);
          break;
      }

      const items: Response = symbols.map((symbol) =>
        this.getCompletionItem(symbol),
      );

      if (items.length > 0) {
        // Slice the items to only be the first MAX_AMOUNT
        response = {
          isIncomplete: false,
          items: items,
        };
      }
    }

    this.responses.enqueueElement([
      {
        id: id,
        jsonrpc: RPC_VER,
        result: response,
      } as LSPResponseMessage,
    ]);
  }

  /**
   * Get the members of an object
   * @param file The file to get it from
   * @param line The line position
   * @param column The column position
   * @returns The symbols that are a part of the object
   */
  private getObjectMembers(
    file: ReturnType<(typeof Project.prototype)["getGmlFile"]>,
    line: number,
    column: number,
  ): Signifier[] {
    const symbols: Signifier[] = [];

    // Get the scope after
    const scope = file?.getScopeRangeAt(line, column);

    if (scope) {
      // Check if this is the object member part
      const isDot = scope.isDotAccessor;
      if (isDot) {
        const symbolsInScope = scope.self.listMembers();

        symbols.push(...symbolsInScope);
      }
    }

    return symbols;
  }

  /**
   * Using the symbol here, create the compleition item based on the type of symbol here
   * @param symbol The symbol to transform
   * @returns The completion item
   */
  public getCompletionItem(symbol: Signifier): CompletionItem {
    let completionItem: CompletionItem;

    const kind = symbol.type.kind;
    const item = symbol.getTypeByKind(kind);

    switch (kind) {
      case "Function":
        completionItem = this.getFunctionSymbol(item as Type<"Function">);
        break;

      case "Struct":
        completionItem = this.getStructSymbol(item as Type<"Struct">);
        break;

      case "Asset.GMObject":
      case "Asset.GMAnimCurve":
      case "Asset.GMFont":
      case "Asset.GMParticleSystem":
      case "Asset.GMSequence":
        completionItem = this.getGMObjectSymbol(item as Type<"Asset.GMObject">);
        break;

      default:
        completionItem = this.getNormalSymbol(symbol);
        break;
    }

    return completionItem;
  }

  /**
   * We know that this symbol is a function, we can now return the right completion item
   * @param symbol The function symbol
   */
  private getFunctionSymbol(symbol: Type<"Function">): CompletionItem {
    const name = symbol?.name ?? "";
    const parameters = symbol.listParameters();
    const detail = symbol.returns?.toFeatherString() ?? "void";
    const description = symbol.description ?? "";
    const kind = symbol.kind;

    const parameterString = parameters.reduce((acc, parameter, index) => {
      let str = "";

      const name = parameter?.name;
      const type = parameter?.type.toFeatherString();

      str += `${name}: ${type}${index < parameters.length - 1 ? ", " : ""}`;

      return acc + str;
    }, "");

    return {
      detail: `${name}(${parameterString}): ${detail}`,
      documentation: { value: description, kind: "markdown" },
      label: name,
      kind: this.getSymbolKind(kind),
    };
  }

  /**
   * The struct symbol that will be returned
   * @param symbol The symbol type to use
   * @returns CompletionItem
   */
  private getStructSymbol(symbol: Type<"Struct">): CompletionItem {
    const name = symbol?.name ?? "";
    const type = symbol.toFeatherString();
    const description = symbol.description ?? "";
    const details = symbol.details;
    const members = symbol.listMembers();
    const kind = symbol.kind;

    const memberString = members.reduce((acc, member) => {
      const name = member?.name;
      const type = member.type.toFeatherString();

      acc += `[${name}: ${type}]\n`;

      return acc;
    }, "");

    return {
      detail: `[${type}] ${details}`,
      documentation: {
        kind: "markdown",
        value: [
          description.length > 0 && description,
          memberString.length && "# Struct Members",
          memberString.length > 0 && memberString,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      label: name,
      kind: this.getSymbolKind(kind),
    };
  }

  /**
   * Get a completion item from a symbol we know is normal
   * @param symbol The symbol type to use
   * @returns CompletionItem
   */
  private getNormalSymbol(symbol: Signifier): CompletionItem {
    const name = symbol.name ?? "";
    const type = symbol.type.toFeatherString() ?? "";
    const description = symbol.description ?? "";
    const kind = symbol.type.kind;

    return {
      detail: `${name}: ${type}`,
      documentation: { kind: "markdown", value: description },
      kind: this.getSymbolKind(kind),
      label: name,
    };
  }

  /**
   * Get the completion item if it's a GM Object Asset
   * @param symbol The asset to get the completion for
   */
  private getGMObjectSymbol(symbol: Type<"Asset.GMObject">): CompletionItem {
    const name = symbol.name ?? "";
    const type = symbol.toFeatherString();
    const kind = symbol.kind;

    let path: string | null = null;

    const assets = this.project.getAssets<Asset<"objects">>(name);

    // Get the directory of the asset

    if (assets) {
      path = assets.dir.absolute;

      // Only add one path if possible
      const files = assets.gmlFilesArray;
      if (files.length === 1) {
        path = files[0].path.absolute;
      }
    }

    return {
      label: name,
      detail: `${name}: ${type}`,
      kind: this.getSymbolKind(kind),
      documentation: {
        kind: "markdown",
        value: [path && `Defined at **${path}**`].filter(Boolean).join("\n"),
      },
    };
  }

  /**
   * Get the type that a symbol is
   * @param symbol The symbol to enquiry
   */
  private getSymbolKind(type: Type["kind"]): CompletionItemKind {
    let kind: CompletionItemKind = CompletionItemKind.VARIABLE;

    switch (type) {
      case "Enum":
        kind = CompletionItemKind.ENUM;
        break;

      case "Function":
        kind = CompletionItemKind.FUNCTION;
        break;

      case "String":
      case "Bool":
        kind = CompletionItemKind.CONSTANT;
        break;

      case "Real":
        kind = CompletionItemKind.VALUE;
        break;

      case "InstanceType":
        kind = CompletionItemKind.VARIABLE;
        break;

      case "ArgumentIdentity":
        kind = CompletionItemKind.TYPEPARAMETER;
        break;

      case "ObjectType":
        kind = CompletionItemKind.INTERFACE;
        break;

      case "Struct":
        kind = CompletionItemKind.STRUCT;
        break;

      case "Pointer":
        kind = CompletionItemKind.VALUE;
        break;

      case "Asset.GMScript":
      case "Asset.Script":
        kind = CompletionItemKind.METHOD;
        break;

      case "Asset.GMAnimCurve":
      case "Asset.GMAudioGroup":
      case "Asset.GMFont":
      case "Asset.GMPath":
      case "Asset.GMParticleSystem":
      case "Asset.GMShader":
      case "Asset.GMTileSet":
      case "Asset.GMSprite":
      case "Asset.GMObject":
      case "Asset.GMRoom":
        kind = CompletionItemKind.REFERENCE;
        break;

      case "Id.AudioEmitter":
      case "Id.Camera":
      case "Id.DsGrid":
      case "Id.DsList":
      case "Id.DsMap":
      case "Id.DsPriority":
        kind = CompletionItemKind.VARIABLE;
        break;

      case "StaticType":
        kind = CompletionItemKind.INTERFACE;
        break;

      case "EnumMember":
        kind = CompletionItemKind.ENUMMEMBER;
        break;

      case "Undefined":
      case "Unknown":
        kind = CompletionItemKind.VARIABLE;
        break;

      default:
        kind = CompletionItemKind.VARIABLE;
        break;
    }

    return kind;
  }
}
