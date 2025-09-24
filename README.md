# @gen

**@gen** is a simple, extensible command runner for Node.js. It interprets a custom DSL to automate file operations, variable management, shell commands, and conditional logic for project scaffolding and scripting tasks. Why not use Bash, Python, Make, or Just...? Because it is fun to create a new language and a new tool! 😄##


## Usage

Install globally:
```bash
npm install -g 
```

```bash
@gen --file <path/to/your.gen> --config <path/to/your/config.json> --output <path/to/output/dir>
```

- `--file`: Path to the `.gen` script to execute.
- `--config`: Optional path to a JSON file to pre-populate the context.
- `--output`: Optional path to the directory where commands will be executed. (Default: current directory)

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

# Compile a template file to generate multiple files
@compile ./templates/my-template.json
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
| @load      | `@set var = @load ./file.txt`                  | Load the contents of a file into a variable                                                 |
| @http      | `@set var = @http https://example.com`         | Fetch the contents of a URL (HTTP GET) into a variable                                      |
| >          | `> echo Hello`                                 | Run a shell command                                                                         |
| @write/@save | `@write "content" to path`<br>`@write var to path` | Write literal or variable content to a file                                                 |
| IF         | `IF exists path`                               | Conditionally execute child commands if a file/folder exists or not                          |
| FOREACH    | `FOREACH item in listVar`                      | Iterate over an array variable, setting `item` and executing child commands                 |
| COMPILE    | `COMPILE ./template.json`                      | Generate files and folders from a template JSON file containing a `templates` object        |


## Parse Folder to produce Template!
It is possibile **to transform a folder to a template** thanks to the `--parse <folder>` option. It will create a `template.json` file in the current working directory with the content of the folder as key-value pairs, excluding some common files and folders like `node_modules`, `dist`, `.git` and `.txt` files.
```bash
@gen --parse C:/DEV/template_vanilla_ts/vite-project
```
the content of a `template.json` can be then used with the `@compile` command to generate files and folders based on that template.

---

## [Next steps](./doc/TODO.md)


## License
MIT License