# @set Command

[← Back to README](../../README.md)

The `@set` command creates and assigns values to variables for use throughout the script.

## Syntax

```
@set <variableName> = <value>
@set <variableName> = input:<prompt>
@set <variableName> = @load <filePath>
@set <variableName> = @http <url>
@set <variableName> = files in <directory>
```

## Assignment Types

### Direct Assignment
```plaintext
@set projectName = "MyProject"
@set version = "1.0.0"
@set debug = true
```

### User Input
Prompts the user for input during execution:
```plaintext
@set userName = input:Enter your name
@set email = input:What is your email address?
```

### File Content
Loads the entire content of a file into the variable:
```plaintext
@set readmeContent = @load ./README.md
@set configData = @load ./config.json
```

### HTTP Request
Fetches content from a URL (HTTP GET):
```plaintext
@set apiData = @http https://api.example.com/data
@set remoteConfig = @http https://config.example.com/settings
```

### File Listing
Creates an array of files and directories:
```plaintext
@set sourceFiles = files in ./src
@set allFiles = files in .
```

## Variable Usage

Once set, variables can be used with interpolation syntax `{variableName}`:

```plaintext
@set greeting = "Hello"
@set name = "World"
@log {greeting}, {name}!
```

## Examples

### Project Setup
```plaintext
@set projectName = input:Enter project name
@set author = input:Enter author name
@set license = "MIT"
@log Creating project {projectName} by {author} with {license} license
```

### File Processing
```plaintext
@set templateContent = @load ./template.html
@set cssFiles = files in ./styles
@log Loaded template with {cssFiles} CSS files
```

### API Integration
```plaintext
@set apiResponse = @http https://jsonplaceholder.typicode.com/posts/1
@log Received API data: {apiResponse}
```

## Related Commands

- [`@global`](global.md) - Set persistent global variables
- [`@log`](log.md) - Display variable values
- [`@if`](if.md) - Use variables in conditional logic
- [`@loop`](loop.md) - Iterate over array variables

---

[← Back to README](../../README.md)