# @global Command

[← Back to README](../../README.md)

The `@global` command creates persistent variables that are saved to disk and available across different script executions.

## Syntax

```
@global <variableName> = <value>
@global <variableName> = input:<prompt>
@global <variableName> = @load <filePath>
@global <variableName> = @http <url>
```

## Features

- **Persistence**: Variables are saved to `.global.json` and persist between runs
- **Global scope**: Available to all scripts executed from the same location
- **Same assignment types as @set**: Supports input, file loading, and HTTP requests

## Storage Location

Global variables are stored inside a .json inside the library.

## Related Commands

- [`@set`](set.md) - Set local variables for current script only
- [`@log`](log.md) - Display global variable values
- [`@if`](if.md) - Use global variables in conditional logic

---

[← Back to README](../../README.md)