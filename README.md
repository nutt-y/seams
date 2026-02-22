# Seams

A GameMaker Studio language server made in Typescript that uses [Butterscotch Shenanigan's gml-parser](https://github.com/bscotch/stitch/tree/develop/packages/parser) for keeping state of your current **GML** project.

> [!NOTE]
> This project is still a work in progress, certain functionality might break!

## Supported LSP methods

|   | Method |
|---|--------|
| ✅ | initialize |
| ✅ | initialized |
| ✅ | textDocument/didOpen |
| ✅ | textDocument/didChange |
| ✅ | textDocument/didSave |
| ✅ | textDocument/completion |
| ✅ | textDocument/definition |
| ✅ | textDocument/references |
| ✅ | textDocument/hover |
| ✅ | textDocument/signatureHelp |
| ✅ | textDocument/inlayHint |
| ✅ | textDocument/semanticTokens/full |
| ✅ | textDocument/documentHighlight |
| ✅ | exit |
| 🚧 | textDocument/codeAction |

## Installation

You can download the binary for your current system under **Releases**. This server uses standard **i/o** to communicate with a client. Below is an example on how to set up this LSP for a certain text editor.

**Neovim**

```lua
-- Register GML file type
vim.filetype.add({
 extension = {
  gml = "gml",
 },
})

vim.lsp.config("gml", {
    cmd = {"./gml-lsp"},
    filetypes = {"gml"}
    root_markers = {"project.yyp"} -- This should be the specific to your project
})
```

## Contributing

## Setup

Install [deno](https://docs.deno.com/runtime/getting_started/installation/) version **2.6.***. Run `deno run build` to compile the binary locally for your machine's specifications. This project uses **Deno's** in-built type checker.

## Linting and Formatting

[Biome](https://biomejs.dev/) is used for linting and formatting the project. Consult `biome.json` for the rules and overrides.

## Project Structure

```shell
src/server/methods/
├── message.ts              # Main entry point - routes LSP requests to handlers
│   ├── Methods enum        # Defines all supported LSP method names
│   ├── HANDLERS map        # Maps method string → handler class
│   └── handleMessage()     # Dispatcher function
│
├── abstract.ts             # Base class for all handlers
│   └── AbstractHandler     # Provides: message, project, logger, responses, getFile()
│
├── message.types.ts        # TypeScript types (LSPMessage, LSPRequestMessage, etc.)
│
├── initialize.ts           # LSP handshake: initialize
├── initialized.ts         # LSP handshake: initialized notification
├── exit.ts                 # Exit handler
├── nothing.ts              # Fallback for unknown methods
│
└── <other files>.ts      # LSP methods that have been implemented in the project so far
```

### Adding a New Handler

To add a new LSP method handler:

1. Create a new file in `src/server/methods/` (e.g., `textDocument_*.ts`)
2. Extend `AbstractHandler` and implement the `handle()` method
3. Add the method name to the `Methods` enum in `message.ts`
4. Add the handler class to the `HANDLERS` map in `message.ts`

### Neovim Setup Recommendation

I use [Neovim](https://neovim.io/) as my personal text editor with [lazy.nvim](https://lazy.folke.io/) as my plugin manager. Here's a small snippet of the `.lazy.lua` file I have been using when editing this project.

```lua
-- Register GML file type
vim.filetype.add({
 extension = {
  gml = "gml",
 },
})

local dir = vim.fn.getcwd()
local path = vim.fn.expand(dir)

vim.lsp.set_log_level(vim.log.levels.TRACE)

return {
 {
  "neovim/nvim-lspconfig",
  opts = {
   ---@module "nutt.plugins.code.nvim-lspconfig"
   ---@type table<string, LspServerConfig>
   servers = {
    vtsls = { enabled = false },
    gml = {
     cmd = { path .. "/gml-lsp" },
     filetypes = { "gml" },
     root_markers = { "a.yyp", ".git" }, -- Set the root marker to wherever you want to test the lsp in
    },
    biome = {
     cmd = { "deno", "run", "-A", "npm:@biomejs/biome", "lsp-proxy" },
    },
   },
  },
 },
 {
  "stevearc/conform.nvim",
  ---@module "conform"
  ---@type conform.setupOpts
  opts = {
   formatters_by_ft = {
    typescript = { "biome", lsp_format = "fallback" },
    json = { "biome", lsp_format = "fallback" },
   },
   formatters = {
    biome = {
     command = "deno",
     args = { "run", "-A", "npm:@biomejs/biome", "format", "--stdin-file-path", "$FILENAME" },
    },
   },
  },
 },
}
```

## Acknowledgment

Thank you so much to [Butterscotch Shenanigans](https://github.com/bscotch) for doing all the heavy lifting in their [Stitch gml-parser](https://github.com/bscotch/stitch/tree/develop/packages/parser) package. Without that package, this LSP would not have been possible to implement!
