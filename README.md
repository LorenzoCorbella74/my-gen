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
- `--config`: Optional path to a JSON file to pre-populate the context.
- `--output`: Optional path to the directory where commands will be executed. (Default: current directory)
- `--verbose`: Optional path to enable verbose logging.

## .gen file SYNTAX & DSL Example
**.gen** file contains commands line by line based on a simple custom Domain Specific Language. Here is an example:
```plaintext

# Print a log message
@log Starting project generation

# Set a variable from user input
@set projectName = input:Enter project name

# Set a global variable that persists across runs
@global authorName = input:Enter your name

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

# Conditional execution
IF exists hello.txt
  @log hello.txt exists!
END
IF not_exists missing.txt
  @log missing.txt does not exist.
END

# Loop over a list
FOREACH file in files
  @log Found file: ${file}
END

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
| @log       | `@log Hello, world!`                           | Print a message to the console (supports variable interpolation)                            |
| @set       | `@set name = value`<br>`@set x = input:Prompt`   | Set a variable, prompt for input, load file, fetch HTTP, list files/folders, or interpolate |
| @global    | `@global name = value`<br>`@global x = input:Prompt`   | Same as @set but saves variables permanently |
| @ai        | `@set reply = @ai What is Node.js?`            | Send a prompt to Ollama AI and get a response (configurable via global variables)          |
| @load      | `@set var = @load ./file.txt`                  | Load the contents of a file into a variable                                                 |
| @http      | `@set var = @http https://example.com`         | Fetch the contents of a URL (HTTP GET) into a variable                                      |
| >          | `> echo Hello`                                 | Run a shell command                                                                         |
| @write/@save | `@write "content" to path`<br>`@write var to path` | Write literal or variable content to a file                                                 |
| @fill        | `@fill path/to/file.txt`<br>`"`<br>`content here`<br>`"` | Write multi-line content to a file using quote delimiters                                   |
| IF         | `IF exists path`                               | Conditionally execute child commands if a file/folder exists or not                          |
| FOREACH    | `FOREACH item in listVar`                      | Iterate over an array variable, setting `item` and executing child commands                 |
| @import    | `@import ./other.gen`                           | Import and execute commands from another .gen file at that point in the script              |

## Parse Folder to produce Template!
It is possibile **to transform a folder to a template** thanks to the `--parse <folder>` option. It will create a `template.gen` file in the current working directory excluding some common folders like `node_modules`, `dist`, `.git`.
```bash
gen --parse C:/DEV/template_vanilla_ts/vite-project
```

---
## AI Command Configuration

The `@ai` command integrates with [Ollama](https://ollama.com/) to provide AI-powered text generation. Configure the AI behavior using global variables:

| Variable            | Default Value                | Description                                    |
|--------------------|------------------------------|------------------------------------------------|
| `AI_MODEL`         | `llama3.2:latest`                   | The Ollama model to use                       |
| `AI_OLLAMA_HOST`   | `http://127.0.0.1:11434`    | Ollama server URL                             |
| `AI_TEMPERATURE`   | `0.7`                        | Response creativity (0.0 to 2.0)              |
| `AI_SYSTEM_PROMPT` | *(none)*                     | System prompt to guide AI behavior            |

**Prerequisites:**
- [Ollama](https://ollama.com/) must be installed and running
- The specified model must be pulled: `ollama pull llama3.2:latest`

**Example:**
```plaintext
# Configure AI settings
@global AI_MODEL = codellama
@global AI_TEMPERATURE = 0.3
@global AI_SYSTEM_PROMPT = You are a helpful coding assistant

# Use AI to generate code
@set jsFunction = @ai Create a JavaScript function to validate email addresses
@write jsFunction to validate-email.js
```

## Examples
Look inside the folder [examples](./examples/) for ready-to-use .gen scripts and templates.

## [Next steps](./doc/TODO.md)


## License
MIT License