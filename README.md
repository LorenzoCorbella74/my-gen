# My CLI Generator

A simple, extensible command-line generator framework. It interprets a custom DSL to automate file operations, variable management, shell commands, and conditional logic for project scaffolding and scripting tasks.

## Scope
- Parse and execute a custom DSL for project generation and scripting
- Support for variables, user input, file and folder operations, HTTP requests, and shell commands
- Extensible with new commands
- Designed for automation, scaffolding, and scripting in Deno environments

## Supported Commands

| Command    | Syntax Example                                 | Description                                                                                 |
|------------|------------------------------------------------|---------------------------------------------------------------------------------------------|
| LOG        | `LOG Hello, world!`                            | Print a message to the console (supports variable interpolation)                            |
| SET        | `SET name = value`<br>`SET x = input:Prompt`   | Set a variable, prompt for input, load file, fetch HTTP, list files/folders, or interpolate |
| load       | `SET var = load ./file.txt`                    | Load the contents of a file into a variable                                                 |
| http       | `SET var = http https://example.com`           | Fetch the contents of a URL (HTTP GET) into a variable                                      |
| >          | `> echo Hello`                                 | Run a shell command                                                                         |
| WRITE/SAVE | `WRITE "content" to path`<br>`WRITE var to path` | Write literal or variable content to a file                                                 |
| IF         | `IF exists path`                               | Conditionally execute child commands if a file/folder exists or not                          |
| FOREACH    | `FOREACH item in listVar`                      | Iterate over an array variable, setting `item` and executing child commands                 |
| COMPILE    | `COMPILE path with template tpl and { ... }`   | Generate a file from an inline template defined in `config.json`                            |


## Example Usage

```plaintext
# Print a log message
LOG Starting project generation

# Set a variable from user input
SET projectName = input:Enter project name

# Set a variable from a file
SET readmeContent = load ./README.md

# Set a variable from an HTTP request
SET apiData = http https://api.example.com/data

# List files and folders
SET files = files in ./src
SET folders = folders in ./src

# Run a shell command
> echo Project: ${projectName}

# Write content to a file
WRITE "Hello, ${projectName}!" to hello.txt
WRITE readmeContent to copy_of_readme.txt

# Conditional execution
IF exists hello.txt
  LOG hello.txt exists!
END
IF not_exists missing.txt
  LOG missing.txt does not exist.
END

# Loop over a list
FOREACH file in files
  LOG Found file: ${file}
END
```

---

- See `generator.md` for DSL details and examples.
