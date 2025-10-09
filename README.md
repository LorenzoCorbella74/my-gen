# (my-gen AKA) gen

![logo](./doc/logo.png)

**gen** is a simple, extensible command runner for Node.js. It interprets a custom DSL to automate file operations, variable management, shell commands, and conditional logic for project scaffolding and scripting tasks. Why not use Bash, Python, Make, or Just...? Because it is fun to create a new language and a new tool! 😄


## Usage

Install globally:
```bash
npm install -g my-gen
```
Use like this:
```bash
gen --file <path/to/your.gen> --output <path/to/output/dir>
```

- `--file`: Path to the `.gen` script to execute (Default: current directory).
- `--output`: Optional path to the directory where commands will be executed. (Default: current directory)
- `--config`: Optional path to a JSON file to pre-populate the context.
- `--verbose`: Optional path to enable verbose logging.

## .gen file SYNTAX & DSL Example
**.gen** file contains commands line by line based on a simple custom Domain Specific Language. Here is an example:
```plaintext

# Print a log message
@log Starting project generation

# Set a variable from user input
@set projectName = @input Enter project name

# Set a variable with single selection
@set framework = @select Choose framework? [ react vue angular ]

# Set a variable with multiple selection  
@set features = @multiselect Select features? [ auth database api testing ]

# Set a global variable that persists across runs
@global authorName = @input Enter your name

# Set a variable from a file content
@set readmeContent = @load ./README.md

# Set a global variable from a file content
@global templateContent = @load ./template.md

# Set a variable from the content of a webpage (HTTP GET)
@set apiData = @http https://api.example.com/data

# Set a global variable from HTTP (persists across runs)
@global configData = @http https://config.example.com/settings

# List files and folders
@set files = files in ./src
@set folders = folders in ./src

# Run a shell command
> echo Project: {projectName}

# Write content to a file
@write "Hello, {projectName}!" to hello.txt
@write readmeContent to copy_of_readme.txt

# Fill a file with multi-line content
@fill src/index.ts
"
console.log("Hello from {projectName}!");
console.log("Generated with @gen");
"

# Conditional execution with file existence
@if exists hello.txt
  @log hello.txt exists!
@end

# Conditional execution with variable comparison
@if projectName is "MyApp"
  @log Project name is MyApp
@elseif projectName is "TestApp"
  @log Project name is TestApp
@end

# Conditional execution with negation
@if status isnot "inactive"
  @log Status is active
@end

# Loop over a list
@loop file in files
  @log Found file: {file}
@endloop

# Import commands from another file
@import ./common-steps.gen

# The commands in common-steps.gen will be executed here
```

## Scope
- Parse and execute a custom DSL for project generation and scripting
- Support for variables, user input, file and folder operations, HTTP requests, and shell commands
- Extensible with new commands
- Designed for automation, scaffolding, and scripting in Node environments

## Supported Commands

| Command    | Syntax Example                                 | Description                                                                                 |
|------------|------------------------------------------------|---------------------------------------------------------------------------------------------|
| [`@log`](doc/commands/log.md)       | `@log Hello, world!`                           | Print a message to the console (supports variable interpolation)                            |
| [`@set`](doc/commands/set.md)       | `@set name = value`<br>`@set x = @input Prompt`<br>`@set y = @select Choose? [ a b c ]`   | Set variables, prompt for input/selection, load files, fetch HTTP, list files/folders |
| [`@global`](doc/commands/global.md) | `@global name = value`<br>`@global x = @input Prompt`   | Same as @set but saves variables permanently |
| [`@ai`](doc/commands/ai.md)         | `@set reply = @ai What is Node.js?`            | Send a prompt to Ollama AI and get a response (configurable via global variables)          |
| [`@shell`](doc/commands/shell.md)   | `> echo Hello`                                 | Run a shell command                                                                         |
| [`@write`](doc/commands/write.md)   | `@write "content" to path`<br>`@write var to path` | Write literal or variable content to a file                                                 |
| [`@fill`](doc/commands/fill.md)     | `@fill path/to/file.txt`<br>`"`<br>`content here`<br>`"` | Write multi-line content to a file using quote delimiters                                   |
| [`@if`](doc/commands/if.md)         | `@if exists path`<br>`@if var is "value"`<br>`@if var isnot "value"` | Conditionally execute child commands based on file existence or variable comparison           |
| [`@loop`](doc/commands/loop.md)     | `@loop item in listVar`                        | Iterate over an array variable, setting `item` and executing child commands                 |
| [`@import`](doc/commands/import.md) | `@import ./other.gen`                           | Import and execute commands from another .gen file at that point in the script              |

## Parse Folder to produce Template!
It is possibile **to transform a folder to a template** thanks to the `--parse <folder>` option. It will create a `template.gen` file in the current working directory excluding some common folders like `node_modules`, `dist`, `.git`.
```bash
gen --parse C:/DEV/template_vanilla_ts/vite-project
```

## Command Reference

For detailed documentation on each command, including syntax, examples, and advanced usage, see the individual command documentation:

- **[`@log`](doc/commands/log.md)** - Print messages and debug information
- **[`@set`](doc/commands/set.md)** - Variable assignment and input handling *(now includes @select and @multiselect)*
- **[`@global`](doc/commands/global.md)** - Persistent variable management
- **[`@ai`](doc/commands/ai.md)** - AI-powered text generation with Ollama
- **[`@shell`](doc/commands/shell.md)** - Execute shell commands
- **[`@write`](doc/commands/write.md)** - Write content to files
- **[`@fill`](doc/commands/fill.md)** - Create multi-line file content
- **[`@if`](doc/commands/if.md)** - Conditional logic and branching
- **[`@loop`](doc/commands/loop.md)** - Iteration over arrays and lists
- **[`@import`](doc/commands/import.md)** - Include external generator files

---
## Quick Start Examples

### Basic Variable Usage
```plaintext
@set projectName = @input Enter project name
@log Starting project: {projectName}
@write "# {projectName}" to README.md
```

### Interactive Selection
```plaintext
@set framework = @select Choose your framework? [ react vue angular svelte ]
@set features = @multiselect Select features? [ typescript eslint prettier testing ]
@log Creating {framework} project with: {features}
```

### File Operations
```plaintext
@set content = @load template.txt
@write content to output.txt
@fill config.json
"
{
  \"name\": \"{projectName}\",
  \"version\": \"1.0.0\"
}
"
```

### Conditional Logic
```plaintext
@set environment = @select Environment? [ dev prod ]
@if environment is "dev"
  @log Development mode
  @write "DEBUG=true" to .env
@elseif environment is "prod"
  @log Production mode
  @write "DEBUG=false" to .env
@end
```

### Loops and Iteration
```plaintext
@set components = @multiselect Components? [ header footer sidebar navbar ]
@loop component in components
  @log Creating {component}
  @fill src/{component}.js
  "
  export function {component}() {
    return '<div>{component}</div>';
  }
  "
@endloop
```

### AI Integration
```plaintext
@global AI_MODEL = codellama
@set javaCode = @ai Create a Java class for user management
@write javaCode to UserManager.java
```


## Examples
Look inside the folder [examples](./examples/) for ready-to-use .gen scripts and templates.

## [Next steps](./doc/TODO.md)

## License
MIT License