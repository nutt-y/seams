import type { Reference, Type } from "@bscotch/gml-parser";
import { AbstractHandler } from "../abstract.ts";
import { RPC_VER } from "../constants.ts";
import {
  type LSPRequestMessage,
  type LSPResponseMessage,
  type PartialResultParams,
  SemanticTokenModifiers,
  type SemanticTokens,
  type SemanticTokensLegend,
  SemanticTokenTypes,
  type TextDocumentIdentifier,
  type uinteger,
  type WorkDoneProgressParams,
} from "./message.types.ts";

type Params = LSPRequestMessage["params"] &
  WorkDoneProgressParams &
  PartialResultParams & {
    /**
     * The text document.
     */
    textDocument: TextDocumentIdentifier;
  };

/**
 * The response
 */
type Response = (LSPResponseMessage["result"] & SemanticTokens) | null;

/**
 * Intermediate representation of a token
 */
type Token = {
  /**
   * The line (0 index based) number
   */
  line: number;

  /**
   * The column (start of the symbol)
   */
  column: number;

  /**
   * The length of the token
   */
  length: number;

  /**
   * The token type
   */
  tokenType: SemanticTokenTypes;

  /**
   * The modifiers for the token type
   */
  tokenModifiers: SemanticTokenModifiers[];
};

/**
 * Handle semantic tokens for a file
 */
export class TextDocument_SemanticTokens_Full extends AbstractHandler {
  // Available tokens types
  private static readonly TokenTypes: Set<SemanticTokenTypes> =
    new Set<SemanticTokenTypes>([
      SemanticTokenTypes.function,
      SemanticTokenTypes.variable,
      SemanticTokenTypes.keyword,
      SemanticTokenTypes.number,
      SemanticTokenTypes.parameter,
      SemanticTokenTypes.enum,
      SemanticTokenTypes.enumMember,
      SemanticTokenTypes.string,
      SemanticTokenTypes.type,
      SemanticTokenTypes.class,
      SemanticTokenTypes.struct,
    ]);

  // Available token modifiers
  private static readonly TokenModifiers: Set<SemanticTokenModifiers> =
    new Set<SemanticTokenModifiers>([
      SemanticTokenModifiers.static,
      SemanticTokenModifiers.deprecated,
      SemanticTokenModifiers.readonly,
      SemanticTokenModifiers.declaration,
      SemanticTokenModifiers.documentation,
    ]);

  // Get the mapping between the index and the token type value
  private static readonly SemanticTokenTypesMap = Array.from(
    TextDocument_SemanticTokens_Full.TokenTypes,
  ).reduce(
    (acc: Partial<Record<SemanticTokenTypes, number>>, tokenType, index) => {
      const key = tokenType;
      const value = index;

      acc[key] = value;

      return acc;
    },
    {},
  );

  public override handle(): Promise<void> | void {
    const { params, id } = this.message;
    const { textDocument } = params as Params;
    const { uri } = textDocument;

    let response: Response = null;

    const file = this.getFile(uri);
    if (file) {
      // Get all token symbols in the file
      const references = file.refs;

      // Get the intemediate token representation
      const tokens = this.getSemanticTokens(references);

      // The semantic tokens to send fully encoded
      const encoded = this.encodeSemanticTokens(tokens);
      if (encoded.length > 0) {
        response = {
          data: encoded,
        };
      }
    }

    this.responses.enqueueElement([
      {
        jsonrpc: RPC_VER,
        id: id,
        result: response,
      } as LSPResponseMessage,
    ]);
  }

  /**
   * Given an array of references within this file, return all of the tokens and their types in this file
   * @param references An array of references within this file
   * @returns An array of intermediate tokens before being encoded to it's final form
   */
  private getSemanticTokens(references: Reference[]): Token[] {
    const tokens = references.map((ref) => {
      const { line, column } = ref.start; // This is 1 index based instead of 0 index based
      const length = ref.text.length;
      const kind = ref.item.type.kind;

      const tokenType = this.getTokenType(kind);
      const tokenModifiers = this.getTokenModifiers(ref);

      return {
        line: line - 1,
        column: column - 1,
        length,
        tokenType,
        tokenModifiers,
      };
    });

    const tokensSorted = this.sortSemanticTokens(tokens);

    return tokensSorted;
  }

  /**
   * Return the semantic tokens in order of appearance in the document
   * @param token The tokens to sort
   * @returns The tokens sorted in order of appearance
   */
  private sortSemanticTokens(tokens: Token[]): Token[] {
    return tokens.sort((a, b) => {
      let diff = 0;

      const aLine = a.line;
      const aCol = a.column;

      const bLine = b.line;
      const bCol = b.column;

      const lineDiff = aLine - bLine;

      diff = lineDiff === 0 ? aCol - bCol : aLine - bLine;

      return diff;
    });
  }

  /**
   * Get the right token modifier based on the type of item
   * @param ref The symbol to inquire
   * @returns An array of token modifiers
   */
  private getTokenModifiers(ref: Reference): SemanticTokenModifiers[] {
    const modifiers: SemanticTokenModifiers[] = [];
    const item = ref.item;

    if (item.static) {
      modifiers.push(SemanticTokenModifiers.static);
    }
    if (item.deprecated) {
      modifiers.push(SemanticTokenModifiers.deprecated);
    }
    if (item.readable && !item.writable) {
      modifiers.push(SemanticTokenModifiers.readonly);
    }
    if (ref.isDef) {
      modifiers.push(SemanticTokenModifiers.declaration);
    }

    return modifiers;
  }

  /**
   * The encoded tokens to send over
   * @param tokens The array of tokens to send over
   * @returns The semantic tokens to send over as an array of numbers
   */
  private encodeSemanticTokens(tokens: Token[]): uinteger[] {
    const data: uinteger[] = [];

    let prevLine = 0;
    let prevCol = 0;

    for (const token of tokens) {
      const deltaLine = token.line - prevLine;
      const deltaStartChar =
        deltaLine === 0 ? token.column - prevCol : token.column;
      const length = token.length;
      const type = TextDocument_SemanticTokens_Full.SemanticTokenTypesMap[
        token.tokenType
      ] as number;
      const modifiers = 0; // TODO: Add the bitflags

      data.push(deltaLine, deltaStartChar, length, type, modifiers);

      prevLine = token.line;
      prevCol = token.column;
    }

    return data;
  }

  /**
   * Map the type of token from gm to the lsp
   * @param kind The gm type
   * @returns The kind as a `SemanticTokenTypes` type
   */
  private getTokenType(kind: Type["kind"]): SemanticTokenTypes {
    let type: SemanticTokenTypes = SemanticTokenTypes.variable;

    switch (kind) {
      case "Enum":
        type = SemanticTokenTypes.enum;
        break;

      case "Function":
        type = SemanticTokenTypes.function;
        break;

      case "Bool":
      case "Any":
        type = SemanticTokenTypes.type;
        break;

      case "Pointer":
      case "Real":
      case "String":
      case "InstanceType":
        type = SemanticTokenTypes.variable;
        break;

      case "ArgumentIdentity":
        type = SemanticTokenTypes.typeParameter;
        break;

      case "ObjectType":
        type = SemanticTokenTypes.class;
        break;

      case "Struct":
        type = SemanticTokenTypes.struct;
        break;

      case "Asset.GMScript":
      case "Asset.Script":
        type = SemanticTokenTypes.function;
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
        type = SemanticTokenTypes.class;
        break;

      case "Id.AudioEmitter":
      case "Id.Camera":
      case "Id.DsGrid":
      case "Id.DsList":
      case "Id.DsMap":
      case "Id.DsPriority":
        type = SemanticTokenTypes.variable;
        break;

      case "StaticType":
        type = SemanticTokenTypes.type;
        break;

      case "EnumMember":
        type = SemanticTokenTypes.enumMember;
        break;
    }

    return type;
  }

  /**
   * Get the legend for the token types and token modifiers
   */
  public static GetLegend(): SemanticTokensLegend {
    return {
      tokenTypes: Array.from(TextDocument_SemanticTokens_Full.TokenTypes),
      tokenModifiers: Array.from(
        TextDocument_SemanticTokens_Full.TokenModifiers,
      ),
    };
  }
}
