# My CLI Generator

A simple, extensible command-line generator framework. It interprets a custom DSL to automate file operations, variable management, shell commands, and conditional logic for project scaffolding and scripting tasks.

## Usage

```bash
gen --file <path/to/your.gen> --config <path/to/your/config.json> --output <path/to/output/dir>
```

- `--file`: Path to the `.gen` script to execute. (Default: `./test/project.gen`)
- `--config`: Optional path to a JSON file to pre-populate the context.
- `--output`: Optional path to the directory where commands will be executed. (Default: current directory)

## Scope
- Parse and execute a custom DSL for project generation and scripting
- Support for variables, user input, file and folder operations, HTTP requests, and shell commands
- Extensible with new commands
- Designed for automation, scaffolding, and scripting in Deno environments

## Supported Commands

| Command    | Syntax Example                                 | Description                                                                                 |
|------------|------------------------------------------------|---------------------------------------------------------------------------------------------|
| @log       | `@log Hello, world!`                           | Print a message to the console (supports variable interpolation)                            |
| @set       | `@set name = value`<br>`@set x = input:Prompt`   | Set a variable, prompt for input, load file, fetch HTTP, list files/folders, or interpolate |
| load       | `@set var = load ./file.txt`                   | Load the contents of a file into a variable                                                 |
| http       | `@set var = http https://example.com`          | Fetch the contents of a URL (HTTP GET) into a variable                                      |
| >          | `> echo Hello`                                 | Run a shell command                                                                         |
| WRITE/SAVE | `WRITE "content" to path`<br>`WRITE var to path` | Write literal or variable content to a file                                                 |
| IF         | `IF exists path`                               | Conditionally execute child commands if a file/folder exists or not                          |
| FOREACH    | `FOREACH item in listVar`                      | Iterate over an array variable, setting `item` and executing child commands                 |
| COMPILE    | `COMPILE path with template tpl and { ... }`   | Generate a file from an inline template defined in `config.json`                            |


## Example Usage

```plaintext
# Print a log message
@log Starting project generation

# Set a variable from user input
@set projectName = input:Enter project name

# Set a variable from a file
@set readmeContent = load ./README.md

# Set a variable from an HTTP request
@set apiData = http https://api.example.com/data

# List files and folders
@set files = files in ./src
@set folders = folders in ./src

# Run a shell command
> echo Project: ${projectName}

# Write content to a file
WRITE "Hello, ${projectName}!" to hello.txt
WRITE readmeContent to copy_of_readme.txt

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
```

---

- See `generator.md` for DSL details and examples.
