// ===== LSP 3.17 Specification Base Types =====

/**
 * Defines an integer number in the range of -2^31 to 2^31 - 1.
 */
export type integer = number;

/**
 * Defines an unsigned integer number in the range of 0 to 2^31 - 1.
 */
export type uinteger = number;

/**
 * Defines a decimal number. Since decimal numbers are very
 * rare in the language server specification we denote the
 * exact range with every decimal using the mathematics
 * interval notation (e.g. [0, 1] denotes all decimals d with
 * 0 <= d <= 1.
 */
export type decimal = number;

/**
 * The URI of a normal non document URI
 */
export type URI = string;

/**
 * URI for a text document
 */
export type DocumentUri = string;

/**
 * The LSP any type
 *
 * @since 3.17.0
 */
export type LSPAny =
  | LSPObject
  | LSPArray
  | string
  | integer
  | uinteger
  | decimal
  | boolean
  | null;

/**
 * LSP object definition.
 *
 * @since 3.17.0
 */
export type LSPObject = { [key: string]: LSPAny };

/**
 * LSP arrays.
 *
 * @since 3.17.0
 */
export type LSPArray = LSPAny[];

// ===== LSP Message Interfaces =====

/**
 * A general message as defined by JSON-RPC. The language server protocol
 * always uses "2.0" as the jsonrpc version.
 */
export interface LSPMessage {
  jsonrpc: string;
}

/**
 * A request message to describe a request between the client and the server.
 * Every processed request must send a response back to the sender of the request.
 */
export interface LSPRequestMessage extends LSPMessage {
  /**
   * The request id.
   */
  id: integer | string;

  /**
   * The method to be invoked.
   */
  method: string;

  /**
   * The method's params.
   */
  params?: LSPArray | LSPObject;
}

/**
 * A Response Message sent as a result of a request. If a request doesn't
 * provide a result value the receiver of a request still needs to return a
 * response message to conform to the JSON-RPC specification. The result
 * property of the ResponseMessage should be set to null in this case to signal
 * a successful request.
 */
export interface LSPResponseMessage extends LSPMessage {
  /**
   * The request id.
   */
  id: integer | string | null;

  /**
   * The result of a request. This member is REQUIRED on success.
   * This member MUST NOT exist if there was an error invoking the method.
   */
  result?: LSPAny;

  /**
   * The error object in case a request fails.
   */
  error?: ResponseError;
}

/**
 * A notification message. A processed notification message must not send a
 * response back. They work like events.
 */
export interface LSPNotificationMessage extends LSPMessage {
  /**
   * The method to be invoked.
   */
  method: string;

  /**
   * The notification's params.
   */
  params?: LSPArray | LSPObject;
}

// ===== LSP Error Types =====

/**
 * Response error interface for LSP error handling.
 */
export interface ResponseError {
  /**
   * A number indicating the error type that occurred.
   */
  code: ErrorCodes;

  /**
   * A string providing a short description of the error.
   */
  message: string;

  /**
   * A primitive or structured value that contains additional
   * information about the error. Can be omitted.
   */
  data?: LSPAny;
}

/**
 * Structure to capture a description for an error code.
 *
 * @since 3.16.0
 */
export interface CodeDescription {
  /**
   * An URI to open with more information about the diagnostic error.
   */
  href: URI;
}

export enum DiagnosticSeverity {
  /**
   * Reports an error.
   */
  ERROR = 1,

  /**
   * Reports a warning
   */
  WARNING = 2,

  /**
   * Reports an information
   */
  INFORMATION = 3,

  /**
   * Reports a hint.
   */
  HINT = 4,
}

/**
 * The diagnostic tags
 */
export enum DiagnosticTag {
  /**
   * Unused or unnecessary code
   *
   * Clients are allowed to render diagnostics with this tag faded out
   * instead of having an error squiggle.
   */
  UNNECESSARY = 1,

  /**
   * Deprecated or obsolete code
   *
   * Clients are allowed to rendered diagnostics with this tag strike through
   */
  DEPRECATED = 2,
}

/**
 * Represents a related message and source code location for a diagnostic.
 * This should be used to point to code locations that cause or are related to
 * a diagnostics, e.g when duplicating a symbol in a scope.
 */
export interface DiagnosticRelatedInformation {
  /**
   * The location of this related diagnostic information.
   */
  location: Location;

  /**
   * The message of this related diagnostic information.
   */
  message: string;
}

/**
 * Diagnotic error
 */
export interface Diagnostic {
  /**
   * The range at which the message applies
   */
  range: Range;

  /**
   * The diagnostic's severity. To avoid interpretation mismatches when a
   * server is used with different clients it is highly recommended that
   * servers always provide a severity value. If omitted, it’s recommended
   * for the client to interpret it as an Error severity.
   */
  severity?: DiagnosticSeverity;

  /**
   * The diagnostic's code, which might appear in the user interface.
   */
  code?: integer | string;

  /**
   * An optional property to describe the error code.
   *
   * @since 3.16.0
   */
  codeDescription?: CodeDescription;

  /**
   * A human-readable string describing the source of this
   * diagnostic, e.g. 'typescript' or 'super lint'.
   */
  source?: string;

  /**
   * The diagnostic's message.
   */
  message: string;

  /**
   * Additional metadata about the diagnostic.
   *
   * @since 3.15.0
   */
  tags?: DiagnosticTag[];

  /**
   * An array of related diagnostic information, e.g. when symbol-names within
   * a scope collide all definitions can be marked via this property.
   */
  relatedInformation?: DiagnosticRelatedInformation[];

  /**
   * A data entry field that is preserved between a
   * `textDocument/publishDiagnostics` notification and
   * `textDocument/codeAction` request.
   *
   * @since 3.16.0
   */
  data?: LSPAny;
}

/**
 * The position within a text document given the line and col number
 */
export interface Position {
  /**
   * Line position in a document (zero-based)
   */
  line: uinteger;

  /**
   * Character offset on a line in a document (zero-based). The meaning of this
   * offset is determined by the negotiated `PositionEncodingKind`.
   *
   * If the character value is greater than the line length it defaults back
   * to the line length.
   */
  character: uinteger;
}

/**
 * LSP Error Codes namespace containing all standard error codes.
 */
export enum ErrorCodes {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  /**
   * This is the start range of JSON-RPC reserved error codes.
   * It doesn't denote a real error code. No LSP error codes should
   * be defined between the start and end range. For backwards
   * compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
   * are left in the range.
   *
   * @since 3.16.0
   */
  JSON_RPC_RESERVED_ERROR_RANGE_START = -32099,

  /**
   * Error code indicating that a server received a notification or
   * request before the server received the `initialize` request.
   */
  SERVER_NOT_INITIALIZED = -32002,

  UNKNOWN_ERROR_CODE = -32001,

  /**
   * This is the end range of JSON-RPC reserved error codes.
   * It doesn't denote a real error code.
   *
   * @since 3.16.0
   */
  JSONRPC_RESERVED_ERROR_RANGE_END = -32000,

  /**
   * This is the start range of LSP reserved error codes.
   * It doesn't denote a real error code.
   *
   * @since 3.16.0
   */
  LSP_RESERVED_ERROR_RANGE_START = -32899,

  /**
   * A request failed but it was syntactically correct, e.g the
   * method name was known and the parameters were valid. The error
   * message should contain human readable information about why
   * the request failed.
   *
   * @since 3.17.0
   */
  REQUEST_FAILED = -32803,

  /**
   * The server cancelled the request. This error code should
   * only be used for requests that explicitly support being
   * server cancellable.
   *
   * @since 3.17.0
   */
  SERVER_CANCELLED = -32802,

  /**
   * The server detected that the content of a document got
   * modified outside normal conditions. A server should
   * NOT send this error code if it detects a content change
   * in its unprocessed messages. The result even computed
   * on an older state might still be useful for the client.
   *
   * If a client decides that a result is not of any use anymore
   * the client should cancel the request.
   */
  CONTENT_MODIFIED = -32801,

  /**
   * The client has canceled a request and a server has detected
   * the cancel.
   */
  REQUEST_CANCELLED = -32800,

  /**
   * This is the end range of LSP reserved error codes.
   * It doesn't denote a real error code.
   *
   * @since 3.16.0
   */
  LSP_RESERVED_ERROR_RANGE_END = -32800,
}

// ===== LSP Progress and Cancellation Types =====

/**
 * Progress token type for tracking progress operations.
 */
export type ProgressToken = integer | string;

/**
 * Interface for progress parameters used in progress notifications.
 */
export interface ProgressParams<T = LSPAny> {
  /**
   * The progress token provided by the client or server.
   */
  token: ProgressToken;

  /**
   * The progress data.
   */
  value: T;
}

/**
 * Start reporting a work is being done to the client
 */
export interface WorkDoneProgressBegin {
  kind: "begin";

  /**
   * Mandatory title of the progress operation. Used to briefly inform about
   * the kind of operation being performed.
   *
   * Examples: "Indexing" or "Linking dependencies".
   */
  title: string;

  /**
   * Controls if a cancel button should show to allow the user to cancel the
   * long running operation. Clients that don't support cancellation are
   * allowed to ignore the setting.
   */
  cancellable?: boolean;

  /**
   * Optional, more detailed associated progress message. Contains
   * complementary information to the `title`.
   *
   * Examples: "3/25 files", "project/src/module2", "node_modules/some_dep".
   * If unset, the previous progress message (if any) is still valid.
   */
  message?: string;

  /**
   * Optional progress percentage to display (value 100 is considered 100%).
   * If not provided infinite progress is assumed and clients are allowed
   * to ignore the `percentage` value in subsequent report notifications.
   *
   * The value should be steadily rising. Clients are free to ignore values
   * that are not following this rule. The value range is [0, 100].
   */
  percentage?: uinteger;
}

/**
 * Interface for signaling that a specific work has been completed
 */
export interface WorkDoneProgressEnd {
  kind: "end";

  /**
   * Optional, a final message indicating to for example indicate the outcome
   * of the operation
   */
  message?: string;
}

/**
 * Interface for cancellation parameters used in $/cancelRequest notifications.
 */
export interface CancelParams {
  /**
   * The request id to cancel.
   */
  id: integer | string;
}

/**
 * semanticTokensProvider options
 */
export interface SemanticTokensOptions extends WorkDoneProgressOptions {
  /**
   * The legend used by the server
   */
  legend: SemanticTokensLegend;

  /**
   * Server supports providing semantic tokens for a specific range
   * of a document
   */
  range?: boolean;

  /**
   * The server supports providing semantic tokens for a full document.
   */
  full?: boolean;
}

/**
 * Default semantic token types
 */
export enum SemanticTokenTypes {
  /**
   * Represents a generic type. Acts as a fallback for types which
   * can't be mapped to a specific type like class or enum
   */
  type = "type",
  namespace = "namespace",
  class = "class",
  enum = "enum",
  interface = "interface",
  struct = "struct",
  typeParameter = "typeParameter",
  parameter = "parameter",
  variable = "variable",
  property = "property",
  enumMember = "enumMember",
  event = "event",
  function = "function",
  method = "method",
  macro = "macro",
  keyword = "keyword",
  modifier = "modifier",
  comment = "comment",
  string = "string",
  number = "number",
  regexp = "regexp",
  operator = "operator",
  decorator = "decorator",
}

/**
 * Semantic token modifiers to use
 */
export enum SemanticTokenModifiers {
  declaration = "declaration",
  definition = "definition",
  readonly = "readonly",
  static = "static",
  deprecated = "deprecated",
  abstract = "abstract",
  async = "async",
  modification = "modification",
  documentation = "documentation",
  defaultLibrary = "defaultLibrary",
}

/**
 * Support for multi root systems such as vscode or Atom
 * I don't think we need to support this at the moment
 */
export interface WorkspaceFolder {
  /**
   * Associated uri with this workspace folder
   */
  uri: URI;

  /**
   * The name of the workspace folder.
   * Used to refer to this workspace folder in the user interface
   */
  name: string;
}

/**
 * A document highlight kind
 */
export enum DocumentHighlightKind {
  /**
   * A textual occurrence
   */
  TEXT = 1,

  /**
   * Read-access of a symbol, like reading a variable.
   */
  READ = 2,

  /**
   * Write-access of a symbol, like writing to a variable
   */
  WRITE = 3,
}

/**
 * A document highlight is a range inside a text document which deserves
 * special attention. Usually a document highlight is visualized by changing
 * the background color of its range.
 */
export interface DocumentHighlight {
  /**
   * The range this highlight applies to.
   */
  range: Range;

  /**
   * The highlight kind, default is DocumentHighlightKind.Text.
   */
  kind?: DocumentHighlightKind;
}

/**
 * Capabilities when the client requests hover information
 */
export interface HoverClientCapabilities {
  /**
   * Whether hover supports dynamic registration
   */
  dynamicRegistration?: boolean;
}

/**
 * Text document specific client capabilities
 */
export interface TextDocumentClientCapabilities {
  /**
   * Capabilities specific to the `textDocument/hover` request
   */
  hover?: HoverClientCapabilities;
}

/**
 * Capabilitieies supported by client
 */
export interface ClientCapabilities {
  /**
   * Workspace specific client capabilities
   */
  workspace?: {
    /**
     * The client supports workspace folders
     */
    workspaceFolders?: boolean;
  };

  /**
   * Text document specific client capabilities
   */
  textDocument?: TextDocumentClientCapabilities;
}

/**
 * Defins how the host shoudl sync document changes to the lsp
 */
export enum TextDocumentSyncKind {
  /**
   * Documents should not be synced at all
   */
  None = 0,

  /**
   * Documents are synced by always sending the full content of the document
   */
  Full = 1,

  /**
   * Documents are synced by sending the full content on open.
   * After that only incremental updates to the document are sent
   */
  Incremental = 2,
}

/**
 * The content to include on save
 */
export interface SaveOptions {
  /**
   * The client is supposed to include the content on save
   */
  includeText?: boolean;
}

/**
 * Optionas for syncing with text documents
 */
export interface TextDocumentSyncOptions {
  /**
   * Open and close notifications are sent to the server
   */
  openClose?: boolean;

  /**
   * Change notifications are sent to the server
   */
  change?: TextDocumentSyncKind;

  /**
   * What to include when the document is saved
   */
  save?: boolean | SaveOptions;
}

/**
 * The work done options
 */
export interface WorkDoneProgressOptions {
  /**
   * does the server support work done progress
   */
  workDoneProgress?: boolean;
}

/**
 * Completion options.
 */
export interface CompletionOptions extends WorkDoneProgressOptions {
  /**
   * The additional characters, beyond the defaults provided by the client (typically
   * [a-zA-Z]), that should automatically trigger a completion request. For example
   * `.` in JavaScript represents the beginning of an object property or method and is
   * thus a good candidate for triggering a completion request.
   *
   * Most tools trigger a completion request automatically without explicitly
   * requesting it using a keyboard shortcut (e.g. Ctrl+Space). Typically they
   * do so when the user starts to type an identifier. For example if the user
   * types `c` in a JavaScript file code complete will automatically pop up
   * present `console` besides others as a completion item. Characters that
   * make up identifiers don't need to be listed here.
   */
  triggerCharacters?: string[];

  /**
   * The server provides support to resolve additional information for a completion item
   */
  resolveProvider?: boolean;
}

/**
 * Capabilities for the server
 */
export interface ServerCapabilities {
  /**
   * Provide references
   */
  referencesProvider?: boolean | WorkDoneProgressOptions;

  /**
   * Defines how text documents are synced. Is either a detailed structure defining each notification or for
   * borwards compatiblity the TextDocumentSyncKind number
   */
  textDocumentSync?: TextDocumentSyncOptions | TextDocumentSyncKind;

  /**
   * Provide hover
   */
  hoverProvider: boolean;

  /**
   * The server provides goto defintion support
   */
  definitionProvider: boolean;

  /**
   * Completion provider capabilities
   */
  completionProvider?: CompletionOptions;

  /**
   * Signature help options
   */
  signatureHelpProvider?: SignatureHelpOptions;

  /**
   * Inlay hint configuration
   */
  inlayHintProvider: InlayHintOptions;

  /**
   * Semantic tokens for documents configuration
   */
  semanticTokensProvider: SemanticTokensOptions;

  /**
   * LSP has document highlight functionality
   */
  documentHighlightProvider: boolean;

  /**
   * Provides code action capabilities
   */
  codeActionProvider: boolean;

  /**
   * Execute command provider
   */
  executeCommandProvider: {
    /**
     * The commands to be executed on the server
     */
    commands: string[];
  };
}

/**
 * The legend to use from a server for tokens
 */
export interface SemanticTokensLegend {
  /**
   * The token types a server uses.
   */
  tokenTypes: SemanticTokenTypes[];

  /**
   * The token modifiers a server users
   */
  tokenModifiers: SemanticTokenModifiers[];
}

/**
 * How a signature help was triggered.
 */
export enum SignatureHelpTriggerKind {
  /**
   * Signature help was invoked manually by the user or by a command
   */
  INVOKED = 1,

  /**
   * Signature help was triggered by a trigger character.
   */
  TRIGGERCHARACTER = 2,

  /**
   * Signature help was triggered by the cursor moving or by the document
   * content changing
   */
  CONTENTCHANGE = 3,
}

/**
 * The semantic tokens
 */
export interface SemanticTokens {
  /**
   * An optional result id. If the provided and clients support delta updating
   * the client will include the result id in the next semantic token request.
   * A server can then instead of computing all semantic tokens again simply send a delta
   */
  resultId?: string;

  /**
   * The actual tokens
   */
  data: uinteger[];
}

/**
 * Additional information about the context in which a signature help request
 * was triggered.
 *
 * @since 3.15.0
 */
export interface SignatureHelpContext {
  /**
   * Action that caused signature help to be triggered
   */
  triggerKind: SignatureHelpTriggerKind;

  /**
   * Character that caused signature help to be triggered
   *
   * This is undefined when triggerKind !== signatureHelpTriggerKind.TriggerCharacter
   */
  triggerCharacter?: string;
}

/**
 * Represents a parameter of a callable-signature. A parameter can
 * have a label and a doc-comment.
 */
export interface ParameterInformation {
  /**
   * The label of this parameter information.
   *
   * Either a string or an inclusive start and exclusive end offsets within
   * its containing signature label. (see SignatureInformation.label). The
   * offsets are based on a UTF-16 string representation as `Position` and
   * `Range` does.
   *
   * *Note*: a label of type string should be a substring of its containing
   * signature label. Its intended use case is to highlight the parameter
   * label part in the `SignatureInformation.label`.
   */
  label: string | [uinteger, uinteger];

  /**
   * The human-readable doc-comment of this parameter. Will be shown
   * in the UI but can be omitted.
   */
  documentation?: string | MarkupContent;
}

/**
 * Represents the signature of something callable. A signature
 * can have a label, like a function-name, a doc-comment, and
 * a set of parameters.
 */
export interface SignatureInformation {
  /**
   * The label of this signature. Will be shown in
   * the UI.
   */
  label: string;

  /**
   * The human-readable doc-comment of this signature. Will be shown
   * in the UI but can be omitted.
   */
  documentation?: string | MarkupContent;

  /**
   * The parameters of this signature.
   */
  parameters?: ParameterInformation[];

  /**
   * The index of the active parameter.
   *
   * If provided, this is used in place of `SignatureHelp.activeParameter`.
   *
   * @since 3.16.0
   */
  activeParameter?: uinteger;
}

/**
 * Signature help options
 */
export interface SignatureHelpOptions extends WorkDoneProgressOptions {
  /**
   * The characters that trigger signature help
   * automatically.
   */
  triggerCharacters?: string[];

  /**
   * List of characters that re-trigger signature help.
   *
   * These trigger characters are only active when signature help is already
   * showing. All trigger characters are also counted as re-trigger
   * characters.
   *
   * @since 3.15.0
   */
  retriggerCharacters?: string[];
}

/**
 * Text document identifier
 */
export interface TextDocumentIdentifier {
  /**
   * The text document's uri
   */
  uri: DocumentUri;
}

/**
 * The document type opened
 */
export interface TextDocumentItem {
  /**
   * Text document's URI
   */
  uri: DocumentUri;

  /**
   * The text document's language identifer
   */
  languageId: string;

  /**
   * Version number of this document (will increase after each change, including undo/redo)
   */
  version: integer;

  /**
   * The content of the opened text document
   */
  text: string;
}

/**
 * Text Document with position and other thingies
 */
export interface TextDocumentPositionParams {
  /**
   * The text document
   */
  textDocument: TextDocumentIdentifier;

  /**
   * The position inside of the text document.
   */
  position: Position;
}

/**
 * Represents a location inside a resource, such as a line inside a text file
 */
export interface Location {
  /**
   * Document Uri
   */
  uri: DocumentUri;

  /**
   * The range
   */
  range: Range;
}

/**
 * Represents a link between a source and a target location
 */
export interface LocationLink {
  /**
   * Span of the origin of this link.
   *
   * Used as the underlined span for mouse interaction. Defaults to the word
   * range at the mouse position.
   */
  originSelectionRange?: Range;

  /**
   * The target resource indentifier of this link.
   */
  targetUri: DocumentUri;

  /**
   * The full target range of this link. If the target for example is a symbol
   * then target range is the range enclosing this symbol not including
   * leading/trailing whitespace but everything else like comments. This
   * information is typically used to highlight the range in the editor.
   */
  targetRange: Range;

  /**
   * The range that should be selected and revealed when this link is being
   * followed, e.g the name of a function. Must be contained by the
   * `targetRange`. See also `DocumentSymbol#range`
   */
  targetSelectionRange: Range;
}

/**
 * Work done progress
 */
export interface WorkDoneProgressParams {
  /**
   * An optional token that a server can use to report work done progress.
   */
  workDoenToken?: ProgressToken;
}

/**
 * Results
 */
export interface PartialResultParams {
  /**
   * An optional token that a server can use to report partial results
   * (e.g. streaming) to the client.
   */
  partialResultToken?: ProgressToken;
}

/**
 * An identifier to denote a specific version of a text document
 */
export interface VersionedTextDocumentIdentifier
  extends TextDocumentIdentifier {
  /**
   * The version number of this document
   *
   * The version number of a document will increase after each change,
   * including undo/redo. The number dones't need to be consecutive
   */
  version: integer;
}

/**
 * Get the files opened by the client
 */
export interface DidOpenTextDocumentParams {
  /**
   * The document that was opened
   */
  textDocument: TextDocumentItem;
}

/**
 * describes the content type that a client supports
 */
export type MarkupKind = "plaintext" | "markdown";

/**
 * A `MarkupContent` literal represents a string value which content is
 * interpreted base on its kind flag. Currently the protocol supports
 * `plaintext` and `markdown` as markup kinds.
 *
 * If the kind is `markdown` then the value can contain fenced code blocks like
 * in GitHub issues.
 *
 * Here is an example how such a string can be constructed using
 * JavaScript / TypeScript:
 * ```typescript
 * let markdown: MarkdownContent = {
 * 	kind: MarkupKind.Markdown,
 * 	value: [
 * 		'# Header',
 * 		'Some text',
 * 		'```typescript',
 * 		'someCode();',
 * 		'```'
 * 	].join('\n')
 * };
 * ```
 *
 * *Please Note* that clients might sanitize the return markdown. A client could
 * decide to remove HTML from the markdown to avoid script execution.
 */
export interface MarkupContent {
  /**
   * The type of the markup
   */
  kind: MarkupKind;

  /**
   * The content irself
   */
  value: string;
}

/**
 * The range for positions in a document
 */
export interface Range {
  /**
   * The range's start position
   */
  start: Position;

  /**
   * The range's end position
   */
  end: Position;
}

/**
 * An event describing a change to a text document. If only a text is provided
 * it is considered to be the full content of the document
 */
export type TextDocumentContentChangeEvent =
  | {
      /**
       * The range of the document that was changed
       */
      range: Range;

      /**
       * The new text for the provided range
       */
      text: string;
    }
  | {
      /**
       * The new text of the whole document
       */
      text: string;
    };

/**
 * Inaly hint options used during static registration
 */
export interface InlayHintOptions extends WorkDoneProgressOptions {
  /**
   * The server provides support to reolve additional information
   * for an inlay hint item
   */
  resolveProvider?: boolean;
}

/**
 * Inlay hint for the client
 */
export interface InlayHint {
  /**
   * the position of this hint.
   *
   * If multiple hints have the same position, they will be shown in the order
   * they appear in the response
   */
  position: Position;

  /**
   * The label of this hint. A human readable string
   *
   * NOTE that neighter the string nor the label part can be empty
   */
  label: string;

  /**
   * The kind of this hint. Can be omitted in which case the client
   * should fall back to a reasonable default.
   */
  kind?: InlayHintKind;

  /**
   * Render padding before the hint.
   *
   * Note: Padding should use the editor's background color, not the
   * background color of the hint itself. That means padding can be used
   * to visually align/separate an inlay hint.
   */
  paddingLeft?: boolean;

  /**
   * Render padding after the hint.
   *
   * Note: Padding should use the editor's background color, not the
   * background color of the hint itself. That means padding can be used
   * to visually align/separate an inlay hint.
   */
  paddingRight?: boolean;
}

/**
 * Inaly hint kinds
 */
export enum InlayHintKind {
  /**
   * An inlay hint that for a type annotation
   */
  TYPE = 1,

  /**
   * An inlay hint that is for a parameter
   */
  PARAMETER = 2,
}

/**
 * How a completion was triggered
 */
export enum CompletionTriggerKind {
  /**
   * Completion was triggered by typing an identifier (24x7 code
   * complete), manual invocation (e.g Ctrl+Space) or via API.
   */
  INVOKED = 1,

  /**
   * Completion was triggered by a trigger character specified by
   * the `triggerCharacters` properties of the
   * `CompletionRegistrationOptions`.
   */
  TRIGGERCHARACTER = 2,

  /**
   * Completion was triggered by a trigger character specified by
   * the `triggerCharacters` properties of the
   * `CompletionRegistrationOptions`.
   */
  TRIGGERFORINCOMPLETECOMPLETIONS = 3,
}

/**
 * Contains additional information about the context in which a completion
 * request is triggered.
 */
export interface CompletionContext {
  /**
   * How the compleition was triggered
   */
  triggerKind: CompletionTriggerKind;

  /**
   * The trigger character (a single character) that has trigger code
   * complete. Is undefined if
   * `triggerKind !== CompletionTriggerKind.TriggerCharacter`
   */
  triggerCharacter?: string;
}

/**
 * The kind of a completion entry.
 */
export enum CompletionItemKind {
  TEXT = 1,
  METHOD = 2,
  FUNCTION = 3,
  CONSTRUCTOR = 4,
  FIELD = 5,
  VARIABLE = 6,
  CLASS = 7,
  INTERFACE = 8,
  MODULE = 9,
  PROPERTY = 10,
  UNIT = 11,
  VALUE = 12,
  ENUM = 13,
  KEYWORD = 14,
  SNIPPET = 15,
  COLOR = 16,
  FILE = 17,
  REFERENCE = 18,
  FOLDER = 19,
  ENUMMEMBER = 20,
  CONSTANT = 21,
  STRUCT = 22,
  EVENT = 23,
  OPERATOR = 24,
  TYPEPARAMETER = 25,
}

/**
 * Completion Item
 */
export interface CompletionItem {
  /**
   * The label of this completion item.
   *
   * The label property is also by default the text that
   * is inserted when selecting this completion.
   *
   * If label details are provided the label itself should
   * be an unqualified name of the completion item.
   */
  label: string;

  /**
   * The kind of this completion item. Based of the kind
   * an icon is chosen by the editor. The standardized set
   * of available values is defined in `CompletionItemKind`.
   */
  kind?: CompletionItemKind;

  /**
   * A human-readable string that represents a doc-comment.
   */
  documentation?: string | MarkupContent;

  /**
   * A human-readable string with additional information
   * about this item, like type or symbol information.
   */
  detail?: string;

  /**
   * A data entry field that is preserved on a completion item between a compleition and
   * a copmletion resolve request.
   */
  data?: LSPAny;
}

/**
 * Represents a collection of [completion items](#CompletionItem) to be
 * presented in the editor.
 */
export interface CompletionList {
  /**
   * This list is not complete. Further typing should result in recomputing
   * this list.
   *
   * Recomputed lists have all their items replaced (not appended) in the
   * incomplete completion sessions.
   */
  isIncomplete: boolean;

  /**
   * In many cases the items of an actual completion result share the same
   * value for properties like `commitCharacters` or the range of a text
   * edit. A completion list can therefore define item defaults which will
   * be used if a completion item itself doesn't specify the value.
   *
   * If a completion list specifies a default value and a completion item
   * also specifies a corresponding value the one from the item is used.
   *
   * Servers are only allowed to return default values if the client
   * signals support for this via the `completionList.itemDefaults`
   * capability.
   *
   * @since 3.17.0
   */
  itemDefaults?: {
    /**
     * A default commit character set.
     *
     * @since 3.17.0
     */
    commitCharacters?: string[];

    /**
     * A default edit range
     *
     * @since 3.17.0
     */
    editRange?:
      | Range
      | {
          insert: Range;
          replace: Range;
        };

    /**
     * A default insert text format
     *
     * @since 3.17.0
     */
    insertTextFormat?: InsertTextFormat;

    /**
     * A default insert text mode
     *
     * @since 3.17.0
     */
    insertTextMode?: InsertTextMode;

    /**
     * A default data value.
     *
     * @since 3.17.0
     */
    data?: LSPAny;
  };

  /**
   * The completion items.
   */
  items: CompletionItem[];
}

/**
 * How whitespace and indentation is handled during completion
 * item insertion.
 */
export enum InsertTextMode {
  /**
   * The insertion or replace strings is taken as it is. If the
   * value is multi line the lines below the cursor will be
   * inserted using the indentation defined in the string value.
   * The client will not apply any kind of adjustments to the
   * string.
   */
  ASIS = 1,

  /**
   * The editor adjusts leading whitespace of new lines so that
   * they match the indentation up to the cursor of the line for
   * which the item is accepted.
   *
   * Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
   * multi line completion item is indented using 2 tabs and all
   * following lines inserted will be indented using 2 tabs as well.
   */
  ADJUSTINDENTATION = 2,
}

/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 */
export enum InsertTextFormat {
  /**
   * The primary text to be inserted is treated as a plain string.
   */
  PLAINTEXT = 1,

  /**
   * The primary text to be inserted is treated as a snippet.
   *
   * A snippet can define tab stops and placeholders with `$1`, `$2`
   * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
   * the end of the snippet. Placeholders with equal identifiers are linked,
   * that is typing in one will update others too.
   */
  SNIPPET = 2,
}

/**
 * Contains additional diagnostic information about the
 * context in which a code action is run.
 */
export interface CodeActionContext {
  /* An array of diagnostics known on the client side overlapping the range
   * provided to the `textDocument/codeAction` request. They are provided so
   * that the server knows which errors are currently presented to the user
   * for the given range. There is no guarantee that these accurately reflect
   * the error state of the resource. The primary parameter
   * to compute code actions is the provided range.
   */
  diagnostics: Diagnostic[];
}

export interface TextEdit {
  /**
   * The range of the text document to be manipulated. To insert
   * the text into a document create a range where start == end
   */
  range: Range;

  /**
   * The string to be inserted. For delete operations use an empty string
   */
  newText: string;
}

/**
 * An edit to a file
 */
export interface WorkspaceEdit {
  /**
   * Holds changes to existing resources
   */
  changes?: { [uri: DocumentUri]: TextEdit[] };
}

/**
 * Comamnds that are provided by the server
 */
export interface Command {
  /**
   * Title of the command, like `save`
   */
  title: string;

  /**
   * The identifier of the actual command handler
   */
  command: string;

  /**
   * Arguments that the command handler should be invoked with
   */
  arguments?: LSPAny[];
}

/**
 * A code action represents a change that can be performed in code, e.g. to fix
 * a problem or to refactor code.
 *
 * A CodeAction must set either `edit` and/or a `command`. If both are supplied the
 * `edit` is applied first, then the `command` is executed
 */
export interface CodeAction {
  /**
   * A short, human-readable, title for this code action.
   */
  title: string;

  /**
   * A command this code action executes. if a code action
   * provides an edit and a command, first the edit is executed and then the command
   */
  command?: Command;

  /**
   * The workspace edit this code action performs
   */
  edit?: WorkspaceEdit;
}

/**
 * The interface that every class must implement
 * in order to talk back with client
 */
export interface Handler {
  /**
   * Handle the message request and return an appropriate response
   * @returns Response messages for the specific request to send back to the client
   */
  handle(): Promise<void> | void;
}
