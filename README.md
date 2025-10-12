# (my-gen AKA) gen

![logo](./doc/logo.png)

**gen** is a simple, command runner for Node.js. It interprets a custom DSL to automate file operations, variable management, shell commands, and conditional logic for project scaffolding and scripting tasks. Why not use Bash, Python, Make, or Just...? Because it is fun to create a new language and a new tool! 😄

## Scope
- Parse and execute a custom DSL for project generation and scripting
- Support for variables, user input, file and folder operations, HTTP requests, and shell commands
- Extensible with new commands
- Designed for automation, scaffolding, and scripting in Node environments

## Usage

Install globally:
```bash
npm install -g my-gen
```
Create a `.gen` file with a list of commands and use like this:
```bash
gen --file <path/to/your.gen> --output <path/to/output/dir>
```

- `--file`: Path to the `.gen` script to execute (Default: current directory).
- `--output`: Optional path to the directory where commands will be executed. (Default: current directory)
- `--config`: Optional path to a JSON file to pre-populate the context.
- `--verbose`: Optional path to enable verbose logging.
- `--doc`: Convert the `.gen` file to markdown documentation.

## .gen file SYNTAX & DSL Example
**.gen** file contains commands line by line based on a simple custom Domain Specific Language. 
![gen-syntax](./doc/gen.png)

## Supported Commands

| Command    | Syntax Example                                 | Description                                                                                 |
|------------|------------------------------------------------|---------------------------------------------------------------------------------------------|
| [`@log`](doc/commands/log.md)       | `@log Hello, world!`                           | Print a message to the console (supports variable interpolation)                            |
| [`@set`](doc/commands/set.md)       | `@set name = value`<br>`@set x = @input Prompt`<br>`@set y = @select Choose? [ a b c ]`   | Set variables, prompt for input/selection, load files, fetch HTTP, list files/folders |
| [`@global`](doc/commands/global.md) | `@global name = value`<br>`@global x = @input Prompt`   | Same as @set but saves variables permanently |
| [`@ai`](doc/commands/ai.md)         | `@set reply = @ai What is Node.js?`            | Send a prompt to Ollama AI and get a response (configurable via global variables)          |
| [`>`](doc/commands/shell.md)   | `> echo Hello`                                 | Run a shell command                                                                         |
| [`@write`](doc/commands/write.md)   | `@write "content" to path`<br>`@write var to path` | Write literal or variable content to a file                                                 |
| [`@fill`](doc/commands/fill.md)     | `@fill path/to/file.txt`<br>`"`<br>`content here`<br>`"` | Write multi-line content to a file using quote delimiters                                   |
| [`@if`](doc/commands/if.md)         | `@if exists path`<br>`@if var is "value"`<br>`@if var isnot "value"` | Conditionally execute child commands based on file existence or variable comparison           |
| [`@loop`](doc/commands/loop.md)     | `@loop item in listVar`                        | Iterate over an array variable, setting `item` and executing child commands                 |
| [`@import`](doc/commands/import.md) | `@import ./other.gen`                           | Import and execute commands from another .gen file at that point in the script              |
| [`@task`](doc/commands/task.md)     | `@task taskname`                               | Define a named task that groups commands until the next empty line. When tasks are present in a file, shows a selection menu to choose which task to execute |

## Documentation Generation

The `--doc` flag allows you to convert `.gen` files into readable markdown documentation. This is useful for:
- Creating project setup guides, blog articles
- Documenting automation scripts
- Sharing project templates with clear instructions
```bash
# transform a .gen file to markdown documentation
gen --file=path/to/your/script.gen --doc
```

## Parse Folder to produce Template!
It is possibile **to transform a folder to a .gen template** thanks to the `--parse <folder>` option. It will create a `template.gen` file in the current working directory excluding some common folders like `node_modules`, `dist`, `.git`. Do you want to parse a project folder created with vite and then customised and transform it to a `.gen` template? Just run:
```bash
gen --parse C:/DEV/template_vanilla_ts/vite-project
```

## Syntax Highlights VSCode Extension for .gen files
You can get the extension from [gen-vsc-extension](https://github.com/LorenzoCorbella74/gen-vsc-extension) and install it in your VSCode extension panel by choosing "Install from VSIX..." and selecting the downloaded `gen-vsc-extension-0.0.1.vsix` file.

## AI-Powered .gen File Creation

The project includes an `AGENTS.md` file specifically designed to help AI coding assistants understand and create `.gen` files based on user requirements. This comprehensive guide enables AI agents to generate complex project scaffolding scripts efficiently.

## Examples
Look inside the folder [examples](./examples/) for ready-to-use `.gen` scripts and templates.

# Future Plans
- [x] reorganize the STDOUT and STDERR with ink.js(Terminal-Kit or Neo-Blessed or Charsm...) / console interattiva
- [x] improve how it works globally (WINDOWS, LINUX, MAC)
- [x] understand how to extend with new commands "from outside" (plugin systems )

## License
MIT License