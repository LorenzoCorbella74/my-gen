# @log Command

[← Back to README](../../README.md)

The `@log` command prints messages to the console with colored output.

## Syntax

```
@log <message>
```

## Parameters

- `<message>` - The text message to display (supports variable interpolation)

## Features

- **Variable interpolation**: Use `{variableName}` to include variable values
- **Colored output**: Messages appear in a distinct color for better visibility
- **No quotes required**: Message text doesn't need to be wrapped in quotes

## Examples

### Basic Usage
```plaintext
@log Hello, World!
@log Starting project generation

@set projectName "MyApp"
@log Welcome to {projectName}!
@log Project {projectName} has been created successfully
```

## Related Commands

- [`@set`](set.md) - Set variables for use in log messages
- [`@global`](global.md) - Set global variables for use across sessions

---

[← Back to README](../../README.md)