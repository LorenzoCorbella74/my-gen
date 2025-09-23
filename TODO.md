# My preferences for new commands!!

- [x] `@global` similar to @set but sets a global variable that persists across
  multiple `@gen` executions.
  - Example: `@global apiKey = input:Enter your API key`
  - Example: `@global configurations = load ./config.json`
- `@http` to fetch data from a URL but with data cleaning options
  (Readability.js ??)
- [x] `@ai` to interact with AI models (like OpenAI's GPT) for generating or
  transforming content.
  - Example:
    `@set aiResponse = @ai "Generate a project README for a Node.js app"`
  - `@system` to set system-level instructions for the AI model. (@model, @temperature, @maxTokens or preconfigured configurations ???)
- @request to make HTTP requests with more options (method, headers, body) as a
  wrapper around fetch.
  - Example:
    `@set response = @request GET https://api.example.com/data headers:{"Authorization":"Bearer {apiKey}"}`
- @pdf: to export variables to PDF (with Pupeeter.js ???).
  - Example: `@pdf content to path/to/file.pdf`
- [x] @md: to export variables to Markdown files with optional front-matter.
  - Example:
    `@md content to path/to/file.md frontmatter:{"title":"My Document","date":"2024-10-01"}`
- --chat to transform @gen into a chat interface (with ChatGPT ???) o come una repl... .
- --workflow to define and run multiple .gen files in sequence with dependencies.
- [x] @import to import and reuse variables and functions from other .gen files.
  - Example: `@import ./common.gen`

## VSCode Extension

- [x] A VSCode extension to provide syntax highlighting and snippets for `.gen`
files.

# Future Plans
- reorganize the STDOUT and STDERR with ink.js
- Improve error handling and reporting
- global spinner for long operations
- make it work globally (WINDOWS, LINUX, MAC)
- understand  how to extend with new commands "from outside"
