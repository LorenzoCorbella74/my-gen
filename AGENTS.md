# Agent Guide for Creating .gen Files

This guide provides comprehensive information for coding agents to understand and create `.gen` files based on user requirements.

## What is a .gen file?

A `.gen` file is a script written in a custom Domain Specific Language (DSL) designed for project scaffolding, automation, and scripting tasks. It provides a simple, readable syntax for common development operations.

## Core Concepts

### 1. Variables and Context
- Variables store data and can be interpolated using `{variableName}` syntax
- Variables persist throughout script execution
- Global variables persist across script executions

### 2. User Interaction
- Scripts can prompt users for input
- Support for single and multiple selection menus
- Interactive configuration setup

### 3. File Operations
- Create files with literal or variable content
- Support for multi-line content with proper formatting
- Automatic directory creation

### 4. Conditional Logic
- Execute commands based on file existence or variable values
- Support for complex conditional chains

### 5. Loops and Iteration
- Iterate over arrays for batch operations
- Generate multiple similar files or configurations

## Complete Command Reference

### Variable Management

#### [@set](doc/commands/set.md) - Local Variables
```plaintext
@set variableName = "literal value"
@set variableName = @input Prompt text
@set variableName = @select Choose option? [ option1 option2 option3 ]
@set variableName = @multiselect Select multiple? [ opt1 opt2 opt3 ]
@set variableName = @load ./path/to/file.txt
@set variableName = @http https://api.example.com/data
@set variableName = files in ./directory
@set variableName = folders in ./directory
@set variableName = @ai Generate some content
```

#### [@global](doc/commands/global.md) - Persistent Variables
```plaintext
@global variableName = "value"    # Same syntax as @set but persists between runs
```

### Output and Logging

#### [@log](doc/commands/log.md) - Console Output
```plaintext
@log Simple message
@log Message with {variableName} interpolation
```

### File Creation

#### [@write](doc/commands/write.md) - Single Line Content
```plaintext
@write "literal content" to path/to/file.txt
@write variableName to path/to/file.txt
@write "Content with {variableName}" to {dynamicPath}/file.txt
```

#### [@fill](doc/commands/fill.md) - Multi-line Content
```plaintext
@fill path/to/file.txt
"
Multi-line content here
With proper formatting
Variables work: {variableName}
"
```

### Conditional Logic

#### [@if](doc/commands/if.md) - Conditional Execution
```plaintext
@if exists path/to/file
    # Commands to execute if file exists
@elseif variableName is "value"
    # Commands for this condition
@elseif variableName isnot "value"
    # Commands for this condition
@end
```

### Loops

#### [@loop](doc/commands/loop.md) - Array Iteration
```plaintext
@loop item in arrayVariable
    @log Processing {item}
    @write "Content for {item}" to output/{item}.txt
@endloop
```

### Shell Commands

#### [>](doc/commands/shell.md) - Execute Shell Commands
```plaintext
> echo "Hello World"
> mkdir -p src/components
> npm install
> git init
```

### AI Integration

#### [@ai](doc/commands/ai.md) - AI-Powered Generation
```plaintext
@ai Generate a React component for user authentication
@set aiResponse = @ai Create a package.json for a Node.js project
```

### Script Organization

#### [@import](doc/commands/import.md) - Include External Scripts
```plaintext
@import ./templates/base-setup.gen
@import ./scripts/database-setup.gen
```

#### [@task](doc/commands/task.md) - Named Task Groups
```plaintext
@task setup
@log Setting up project
@set projectName = @input Enter project name
> mkdir {projectName}

@task install
@log Installing dependencies
> npm install

@task deploy
@log Deploying application
> npm run build
> npm run deploy
```

## Common Patterns and Best Practices

### 1. Interactive Project Setup
```plaintext
# Gather user input
@set projectName = @input Enter project name
@set framework = @select Choose framework? [ react vue angular ]
@set features = @multiselect Select features? [ typescript eslint prettier testing ]

# Create project structure
> mkdir {projectName}
> cd {projectName}

# Generate configuration based on choices
@if framework is "react"
    @write '{"name": "{projectName}"}' to package.json
@end
```

### 2. Batch File Generation
```plaintext
@set components = @input Enter component names (comma-separated)

@loop component in components
    @fill src/components/{component}.tsx
    "
    import React from 'react';
    
    export function {component}() {
        return <div>{component} Component</div>;
    }
    "
    
    @fill src/components/{component}.test.tsx
    "
    import { render } from '@testing-library/react';
    import { {component} } from './{component}';
    
    test('{component} renders', () => {
        render(<{component} />);
    });
    "
@endloop
```

### 3. Environment-Specific Configuration
```plaintext
@set environment = @select Choose environment? [ development staging production ]

@if environment is "development"
    @write "DEBUG=true\nNODE_ENV=development" to .env
@elseif environment is "production"
    @write "DEBUG=false\nNODE_ENV=production" to .env
@end
```

### 4. API-Driven Content Generation
```plaintext
@set apiData = @http https://jsonplaceholder.typicode.com/users
@write apiData to users.json

@set userIds = "1,2,3,4,5"
@loop userId in userIds
    @set userData = @http https://jsonplaceholder.typicode.com/users/{userId}
    @write userData to users/user-{userId}.json
@endloop
```

### 5. Conditional File Operations
```plaintext
@if exists package.json
    @log Updating existing package.json
    @set existingPackage = @load package.json
@elseif exists requirements.txt
    @log Python project detected
    > pip install -r requirements.txt
@end
```

## Agent Instructions for Common Scenarios

### Creating a Web Project Setup Script
1. Use `@input` to gather project details (name, framework, features)
2. Use `@select` for single choices (framework, database)
3. Use `@multiselect` for features (testing, linting, etc.)
4. Use `@if` conditions to handle different framework choices
5. Use `@loop` to generate multiple similar files
6. Use shell commands (`>`) for package management
7. Use `@fill` for multi-line configuration files

### Creating a Database Migration Script
1. Use `@set` to load migration files list
2. Use `@loop` to process each migration
3. Use `@if` to check if migrations already exist
4. Use shell commands to run database operations

### Creating a Docker Setup Script
1. Use `@select` for base image choices
2. Use `@multiselect` for services to include
3. Use `@fill` to generate Dockerfile and docker-compose.yml
4. Use `@if` to conditionally add services

### Creating a CI/CD Pipeline Script
1. Use `@select` for CI platform (GitHub Actions, GitLab CI, etc.)
2. Use `@multiselect` for pipeline stages
3. Use `@fill` to generate pipeline configuration files
4. Use `@if` to conditionally add deployment steps

## Variable Interpolation Rules

- Use `{variableName}` syntax in any string context
- Works in file paths, content, and command arguments
- Variables are resolved at execution time
- Undefined variables throw errors

## File Path Handling

- Relative paths are resolved from the output directory
- Automatic directory creation for nested paths
- Cross-platform path normalization
- Variables can be used in paths: `{folder}/{filename}.txt`

## Error Handling Guidelines

- Always validate user input where possible
- Use `@if exists` to check for required files
- Provide clear error messages in logs
- Use conditional logic to handle different scenarios gracefully

## AI Configuration

Configure AI behavior with global variables:
```plaintext
@global AI_MODEL = codellama
@global AI_TEMPERATURE = 0.3
@global AI_SYSTEM_PROMPT = You are a helpful coding assistant
```

## Task Organization

For complex scripts, use tasks to organize related commands:
```plaintext
@task init
# Initialization commands

@task configure
# Configuration commands

@task deploy
# Deployment commands
```

When tasks are present, users get an interactive menu to choose which task to execute.

## Advanced Features

### Shell Command Persistence
Shell commands maintain state across multiple `>` commands:
```plaintext
> cd src
> ls        # Lists contents of src/
> pwd       # Shows current directory is src/
```

### HTTP Integration
Fetch data from APIs and use in file generation:
```plaintext
@set apiData = @http https://api.github.com/repos/owner/repo
@write apiData to repo-info.json
```

### Folder Parsing
Convert existing folder structures to .gen scripts:
```bash
gen --parse ./existing-project
```

This generates a `template.gen` file that recreates the folder structure.

## Output and Execution

### Running Scripts
```bash
gen --file script.gen --output ./project-dir
```

### Verbose Mode
```bash
gen --file script.gen --verbose
```
Shows detailed command output for debugging.

### Configuration Files
Pre-populate variables with JSON config:
```bash
gen --file script.gen --config config.json
```

## Integration Examples

### With Package Managers
```plaintext
> npm init -y
> npm install express
> npm install -D jest
```

### With Version Control
```plaintext
> git init
> git add .
> git commit -m "Initial commit"
```

### With Build Tools
```plaintext
> npm run build
> npm run test
> npm run lint
```

## Remember

1. **Keep it simple**: Use the minimum commands needed
2. **Be interactive**: Prompt for user input when needed
3. **Be conditional**: Handle different scenarios with `@if`
4. **Be iterative**: Use `@loop` for repetitive tasks
5. **Be organized**: Use `@task` for complex workflows
6. **Be helpful**: Use `@log` to inform users of progress
7. **Be robust**: Check for file existence and handle errors

This DSL is designed to be readable and maintainable. Focus on clarity and user experience when creating .gen scripts.