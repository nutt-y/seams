import type { Project } from "@bscotch/gml-parser";
import { RPC_VER } from "../constants.ts";
import { AbstractHandler } from "./abstract.ts";
import type {
  LSPResponseMessage,
  SignatureHelpContext,
  SignatureInformation,
  TextDocumentPositionParams,
  uinteger,
  WorkDoneProgressParams,
} from "./message.types.ts";

type Params = TextDocumentPositionParams &
  WorkDoneProgressParams & {
    /**
     * The signature help context. This is only available if the client
     * specifies to send this using the client capability
     * `textDocument.signatureHelp.contextSupport === true`
     *
     * @since 3.15.0
     */
    context?: SignatureHelpContext;
  };

/**
 * Signature help represents the signature of something
 * callable. There can be multiple signature but only on active and only one active parameter.
 */
type Response = {
  /**
   * One or more signatures. If no signatures are available the signature help
   * request should return `null`
   */
  signatures: SignatureInformation[];

  /**
   * The active signature. If omitted or the value lies outside the
   * range of `signatures` the value defaults to zero or is ignore if
   * the `SignatureHelp` as no signatures.
   *
   * Whenever possible implementors should make an active decision about
   * the active signature and shouldn't rely on a default value.
   *
   * In future version of the protocol this property might become
   * mandatory to better express this.
   */
  activeSignature?: uinteger;

  /**
   * The active parameter of the active signature. If omitted or the value
   * lies outside the range of `signatures[activeSignature].parameters`
   * defaults to 0 if the active signature has parameters. If
   * the active signature has no parameters it is ignored.
   *
   * Since version 3.16.0 the `SignatureInformation` itself provides a
   * `activeParameter` property and it should be used instead of this one.
   */
  activeParameter?: uinteger;
} | null;

/**
 * Signature help
 */
export class TextDocument_SignatureHelp extends AbstractHandler {
  /**
   * Push the response for this specific signature help
   */
  public override handle(): Promise<void> | void {
    // Context
    const { params, id } = this.message;
    const { textDocument, position } = params as unknown as Params;
    const { uri } = textDocument;
    const { character: column, line } = position;
    // const triggerCharacter = context?.triggerCharacter ?? "";

    let res: Response = null;

    // Get File
    const file = this.getFile(uri);

    if (file) {
      const signature = this.getFunctionSignature(file, line + 1, column + 1);

      // The signature exists, return it over
      if (signature) {
        res = {
          signatures: signature,
        };
      }
    }

    this.responses.enqueueElement([
      {
        id: id,
        jsonrpc: RPC_VER,
        result: res satisfies Response,
      } as LSPResponseMessage,
    ]);
  }

  /**
   * Get the function signatures given the file and position
   * @param file The file to get it from
   * @param line The line position
   * @param column The column position
   * @returns The function signature if it exists at that point
   */
  private getFunctionSignature(
    file: ReturnType<(typeof Project.prototype)["getGmlFile"]>,
    line: number,
    column: number,
  ): Extract<Response, { signatures: unknown }>["signatures"] | null {
    let fn: Extract<Response, { signatures: unknown }>["signatures"] | null =
      null;

    const reference = file?.getFunctionArgRangeAt(line, column);

    if (reference) {
      const funcItem = reference.type;

      const name = funcItem.name ?? "";
      const parameters = funcItem.listParameters();
      const description = funcItem.description ?? "";
      const details = funcItem.returns?.toFeatherString();

      const label = `${name}(${parameters.reduce((acc, parameter, index) => {
        let str = "";

        const paramName = parameter?.name ?? "";
        const paramType = parameter?.type.toFeatherString() ?? "Any";

        str += `${paramName}: ${paramType}${
          index < parameters.length - 1 ? ", " : ""
        }`;

        return acc + str;
      }, "")}): ${details}`;

      fn = [
        {
          label: label,
          documentation: {
            kind: "markdown",
            value: description,
          },
          activeParameter: reference.idx,
          parameters: parameters.map((parameter) => ({
            label: parameter?.name ?? "",
            documentation: parameter?.description ?? "",
          })),
        },
      ];
    }

    return fn;
  }
}
