# My preferences for new commands!!
- [x] `@input` in place fo input: to prompt user input and set a variable.
  + Example: `@set projectName = @input Enter project name`
- [x] @select uno, due, tre in place of select:[uno, due, tre].
    - Example: `@set framework = @select Select a framework options: React,Vue,Angular`
- [x] `@http` to fetch data from a URL but with data cleaning options
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
- --chat to transform gen into a chat interface (with ChatGPT ???) o come una repl... .
- --workflow to define and run multiple .gen files in sequence with dependencies ??.
- [x] @task to fragment sequence of commands after a .gen file has been loaded but not yet executed. Fragments can be executed upon request
  - Example:
    `@task "npm install" in ./my-new-project`
- [x] @import to import and reuse variables and functions from other .gen files.
  - Example: `@import ./common.gen`

## VSCode Extension
- [x] A VSCode extension to provide syntax highlighting and snippets for `.gen`
files.

# Future Plans
- [ ] reorganize the STDOUT and STDERR with ink.js
- [ ] Improve error handling and reporting
- [x] make it work globally (WINDOWS, LINUX, MAC)
- [x] understand  how to extend with new commands "from outside"
