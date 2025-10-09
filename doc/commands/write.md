# @write / @save Commands

[← Back to README](../../README.md)

The `@write` and `@save` commands write content to files. Both commands are functionally identical (`@save` is an alias for `@write`).

## Syntax

```
@write "<content>" to <filePath>
@write <variableName> to <filePath>
@save "<content>" to <filePath>
@save <variableName> to <filePath>
```

## Features

- **Literal content**: Write quoted strings directly to files
- **Variable content**: Write variable values to files
- **Variable interpolation**: Use `{variableName}` in content and file paths
- **Directory creation**: Automatically creates parent directories if they don't exist
- **Path resolution**: Supports both relative and absolute paths

## Examples

### Write Literal Content
```plaintext
@write "Hello, World!" to greeting.txt
@write "console.log('Hello');" to script.js
@save "# My Project\n\nDescription here" to README.md
```

### Write Variable Content
```plaintext
@set htmlContent = "<html><body>Hello</body></html>"
@write htmlContent to index.html

@set configData = @load ./template-config.json
@write configData to project-config.json
```

### Variable Interpolation in Content
```plaintext
@set projectName = "MyApp"
@set version = "1.0.0"
@set author = "John Doe"

@write "# {projectName}\n\nVersion: {version}\nAuthor: {author}" to README.md
```

### Variable Interpolation in File Paths
```plaintext
@set language = "javascript"
@set fileName = "config"

@write "module.exports = {};" to {language}/{fileName}.js
# Creates: javascript/config.js
```

### Complex Content Generation
```plaintext
@set packageName = input:Enter package name
@set description = input:Enter description
@set author = input:Enter author name

@write '{
  "name": "{packageName}",
  "version": "1.0.0",
  "description": "{description}",
  "author": "{author}",
  "main": "index.js"
}' to package.json
```

### API Response to File
```plaintext
@set apiData = @http https://jsonplaceholder.typicode.com/posts/1
@write apiData to api-response.json
@log API response saved to api-response.json
```

### Template Processing
```plaintext
@set templateContent = @load ./template.html
@set title = "My Website"
@set content = "Welcome to my website!"

# Process template variables
@write "{templateContent}" to index.html
# Note: Template should contain {title} and {content} placeholders
```

### Configuration Files
```plaintext
@set dbHost = input:Database host
@set dbName = input:Database name
@set dbUser = input:Database user

@write 'DATABASE_URL=postgresql://{dbUser}@{dbHost}/{dbName}
NODE_ENV=development
PORT=3000' to .env
```

### Multiple File Generation
```plaintext
@set componentName = input:Enter component name

# Create component file
@write 'export function {componentName}() {
  return <div>{componentName} Component</div>;
}' to src/components/{componentName}.tsx

# Create test file
@write 'import { {componentName} } from "./{componentName}";

test("{componentName} renders", () => {
  // Test implementation
});' to src/components/{componentName}.test.tsx
```

## File Path Handling

### Relative Paths
```plaintext
@write "content" to ./file.txt          # Current directory
@write "content" to src/index.js        # Subdirectory
@write "content" to ../parent/file.txt  # Parent directory
```

### Absolute Paths
```plaintext
@write "content" to /tmp/file.txt                    # Unix
@write "content" to C:\Users\John\Desktop\file.txt   # Windows
```

### Directory Creation
The command automatically creates directories if they don't exist:
```plaintext
@write "content" to deeply/nested/folder/file.txt
# Creates: deeply/, deeply/nested/, deeply/nested/folder/ if needed
```

## Use Cases

### Project Scaffolding
```plaintext
@set projectName = input:Project name

# Create package.json
@write '{"name": "{projectName}"}' to package.json

# Create README
@write "# {projectName}\n\nProject description" to README.md

# Create main file
@write 'console.log("Hello from {projectName}");' to index.js
```

### Configuration Management
```plaintext
@global apiEndpoint = "https://api.example.com"
@set environment = input:Environment (dev/prod)

@write 'API_ENDPOINT={apiEndpoint}
ENVIRONMENT={environment}' to .env
```

### Code Generation
```plaintext
@set modelName = input:Model name
@set fields = input:Fields (comma-separated)

# Generate model class
@write 'class {modelName} {
  constructor() {
    // Fields: {fields}
  }
}' to models/{modelName}.js
```

## Related Commands

- [`@fill`](fill.md) - Write multi-line content with quote delimiters
- [`@set`](set.md) - Create variables for file content
- [`@global`](global.md) - Use global variables in file paths and content
- [`@if`](if.md) - Conditional file writing

---

[← Back to README](../../README.md)