# @fill Command

[← Back to README](../../README.md)

The `@fill` command writes multi-line content to files using quote delimiters for clean content definition.

## Syntax

```
@fill <filePath>
"
<multi-line content>
...
"
```

## Features

- **Multi-line content**: Perfect for writing files with multiple lines
- **Clean syntax**: Quote delimiters clearly separate content from commands
- **Variable interpolation**: Use `{variableName}` in both file path and content
- **Preserves formatting**: Maintains indentation and line breaks exactly as written
- **Directory creation**: Automatically creates parent directories if needed

## Basic Usage

```plaintext
# Example of fill.gen

@fill script.js
"
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
"

@set language = "javascript"
@set fileName = "utils"

@fill {language}/{fileName}.js
"
// Utility functions for {language}
export function helper() {
  return 'Helper function';
}
"
```

## Related Commands

- [`@write`](write.md) - Write single-line or simple content to files
- [`@set`](set.md) - Create variables for use in file content
- [`@if`](if.md) - Conditional file creation
- [`@loop`](loop.md) - Generate multiple files with similar content

---

[← Back to README](../../README.md)