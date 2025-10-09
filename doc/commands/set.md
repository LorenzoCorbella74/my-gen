# @set Command

[← Back to README](../../README.md)

The `@set` command creates and assigns values to variables for use throughout the script.

## Syntax

```
@set <variableName> = <value>
@set <variableName> = @input <prompt>
@set <variableName> = @select <question>? [ option1 option2 option3 ]
@set <variableName> = @multiselect <question>? [ option1 option2 option3 ]
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
@set userName = @input Enter your name
@set email = @input What is your email address?
```

**Backward Compatibility:** The old `input:` syntax is still supported:
```plaintext
@set userName = input:Enter your name
```

### Single Selection
Presents a list of options for the user to choose one:
```plaintext
@set framework = @select Which framework do you prefer? [ react vue angular svelte ]
@set environment = @select Choose environment? [ development staging production ]
```

### Multiple Selection
Allows the user to select multiple options from a list:
```plaintext
@set features = @multiselect Which features do you want? [ auth database api testing ]
@set platforms = @multiselect Target platforms? [ windows mac linux ]
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
@set projectName = @input Enter project name
@set author = @input Enter author name
@set framework = @select Choose your framework? [ react vue angular next nuxt ]
@set features = @multiselect Select features? [ typescript eslint prettier testing ]
@set license = "MIT"
@log Creating {projectName} by {author} using {framework} with features: {features}
```

### Interactive Configuration
```plaintext
@set environment = @select Which environment? [ development staging production ]
@set database = @select Choose database? [ mysql postgresql mongodb sqlite ]
@set services = @multiselect Enable services? [ redis cache queue logging monitoring ]

@if environment is "production"
    @log Production setup with {database} and services: {services}
@end
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