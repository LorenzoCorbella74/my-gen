# @import Command

[← Back to README](../../README.md)

The `@import` command includes and executes commands from external generator files.

## Syntax

```
@import <filePath>
```

## Features

- **File inclusion**: Execute commands from external `.gen` files
- **Variable inheritance**: Parent variables are accessible in imported files
- **Nested imports**: Support for importing files that import other files
- **Path resolution**: Relative and absolute path support
- **Error handling**: Graceful handling of missing or invalid files

## Basic Usage

### Simple File Import
```plaintext
# main.gen
@set projectName = "MyApp"
@import ./templates/base-structure.gen
```

```plaintext
# templates/base-structure.gen
@log Creating project structure for {projectName}
> mkdir -p src/components
> mkdir -p src/utils
> mkdir -p tests
```

## Related Commands

- [`@set`](set.md) - Define variables before imports
- [`@if`](if.md) - Conditional imports
- [`@loop`](loop.md) - Import multiple files
- [`@fill`](fill.md) - Create files in imported templates

---

[← Back to README](../../README.md)