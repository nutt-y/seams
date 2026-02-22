# Seams

A GameMaker Studio language server

## Setup

## Contributing

### Neovim Setup Recommendation

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
