# Shell Commands (>)

[← Back to README](../../README.md)

The shell command operator `>` executes shell commands in a persistent global shell session.

## Syntax

```
> <command>
```

## Features

- **Global shell session**: All commands run in the same shell instance
- **Persistent environment**: Variables and directory changes persist between commands
- **Cross-platform**: Works on Windows (cmd.exe), Linux, and macOS
- **Asynchronous execution**: Commands complete when they actually finish
- **Variable interpolation**: Use `{variableName}` in shell commands

## Examples

### Basic Commands
```plaintext
> echo "Hello, World!"
> dir                  # Windows
> ls -la               # Unix/Linux
> pwd                  # Show current directory
```

### Directory Navigation
```plaintext
> cd src
> ls                   # Lists contents of src/
> cd ../tests
> pwd                  # Shows current directory
```

### Persistent Environment
```plaintext
# Set environment variable
> set MY_VAR=hello     # Windows
> export MY_VAR=hello  # Unix/Linux

# Use in subsequent commands
> echo %MY_VAR%        # Windows
> echo $MY_VAR         # Unix/Linux
```

### Variable Interpolation
```plaintext
@set projectName = "MyApp"
@set version = "1.0.0"

> echo "Building {projectName} version {version}"
> mkdir {projectName}
> cd {projectName}
```

### File Operations
```plaintext
> copy template.txt project.txt    # Windows
> cp template.txt project.txt      # Unix/Linux
> rm old-file.txt
> touch new-file.txt
```

### Development Workflows
```plaintext
# Node.js project
> npm init -y
> npm install express
> npm run build
> npm test

# Git operations
> git init
> git add .
> git commit -m "Initial commit"
```

### Package Management
```plaintext
# Python
> pip install requests
> python main.py

# Node.js
> npm install
> npm run dev

# Rust
> cargo build
> cargo run
```

## Path Normalization

The system automatically normalizes paths for cross-platform compatibility:

```plaintext
# This works on both Windows and Unix
> cd folder1/folder2
# Becomes: cd "folder1\folder2" on Windows
# Becomes: cd "folder1/folder2" on Unix
```

## Verbose Mode

Use `--verbose` flag to see command output:

```bash
# Without verbose (minimal output)
gen script.gen

# With verbose (full command output)
gen script.gen --verbose
```

**Without verbose:**
```
[CMD] > echo "Hello"
[CMD-OUTPUT] Use --verbose to see command output
```

**With verbose:**
```
[CMD] > echo "Hello"
Hello
```

## Error Handling

- **Command errors**: Error output is always shown (regardless of verbose mode)
- **Path errors**: Automatic path normalization handles most issues
- **Timeout**: Commands timeout after 30 seconds with partial output shown

## Advanced Usage

### Conditional Commands
```plaintext
@if exists package.json
    > npm install
@elseif exists requirements.txt
    > pip install -r requirements.txt
@end
```

### Loop with Commands
```plaintext
@set files "*.js,*.ts,*.json"
@loop pattern in files
    > find . -name "{pattern}" -type f
@endloop
```

### Command Chaining
```plaintext
> mkdir dist
> cd dist
> echo "Build output will go here" > README.txt
> cd ..
```

## Platform-Specific Notes

### Windows
- Uses `cmd.exe` by default
- Environment variables: `%VARIABLE%`
- Path separator: `\`

### Unix/Linux/macOS
- Uses shell from `$SHELL` environment variable
- Environment variables: `$VARIABLE`
- Path separator: `/`

## Related Commands

- [`@set`](set.md) - Set variables for use in shell commands
- [`@if`](if.md) - Conditional shell command execution
- [`@loop`](loop.md) - Run shell commands in loops

---

[← Back to README](../../README.md)