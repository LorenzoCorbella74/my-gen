# @if Command

[← Back to README](../../README.md)

The `@if` command provides conditional execution of commands based on file existence or variable comparison.

## Syntax

```
@if <condition>
    <commands>
@elseif <condition>
    <commands>
@end
```

## Condition Types

### File Existence
```
@if exists <filePath>
```
Checks if a file or directory exists.

### Variable Comparison
```
@if <variableName> is "<value>"
@if <variableName> isnot "<value>"
```
Compares a variable value with a string (supports interpolation).

## Features

- **Multiple conditions**: Use `@elseif` for alternative conditions
- **Nested blocks**: `@if` statements can be nested inside each other
- **Variable interpolation**: Use `{variableName}` in conditions and values
- **File path resolution**: Supports both relative and absolute paths

## Examples

### File Existence Check
```plaintext
@if exists package.json
    @log Found package.json - this is a Node.js project
    > npm install
@elseif exists requirements.txt
    @log Found requirements.txt - this is a Python project
    > pip install -r requirements.txt
@elseif exists Cargo.toml
    @log Found Cargo.toml - this is a Rust project
    > cargo build
@end
```

### Variable Comparison
```plaintext
@set environment = input:Enter environment (dev/staging/prod)

@if environment is "dev"
    @log Setting up development environment
    @write "DEBUG=true" to .env
@elseif environment is "staging"
    @log Setting up staging environment
    @write "DEBUG=false" to .env
    @write "API_URL=https://staging-api.example.com" to .env
@elseif environment is "prod"
    @log Setting up production environment
    @write "DEBUG=false" to .env
    @write "API_URL=https://api.example.com" to .env
@end
```

### Variable Negation
```plaintext
@set status = "active"

@if status isnot "inactive"
    @log Service is active, proceeding with deployment
    > docker build -t myapp .
    > docker run -d myapp
@end
```

### Variable Interpolation in Conditions
```plaintext
@set expectedVersion = "1.0.0"
@set currentVersion = @load ./VERSION

@if currentVersion is "{expectedVersion}"
    @log Version matches expected: {currentVersion}
@elseif currentVersion isnot "{expectedVersion}"
    @log Version mismatch! Expected: {expectedVersion}, Got: {currentVersion}
    @set needsUpdate = true
@end
```

### Complex File Checks
```plaintext
@set configFile = "config.json"
@set backupFile = "config.backup.json"

@if exists {configFile}
    @log Configuration file found
    @if exists {backupFile}
        @log Backup already exists
    @elseif exists {backupFile} isnot true
        @log Creating backup
        > cp {configFile} {backupFile}
    @end
@end
```

## Nested Conditions

### Multiple Levels
```plaintext
@set projectType = input:Project type (web/api/cli)
@set framework = input:Framework

@if projectType is "web"
    @log Creating web project
    
    @if framework is "react"
        @log Setting up React project
        > npx create-react-app .
    @elseif framework is "vue"
        @log Setting up Vue project
        > npx @vue/cli create .
    @elseif framework is "angular"
        @log Setting up Angular project
        > npx @angular/cli new .
    @end
    
@elseif projectType is "api"
    @log Creating API project
    
    @if framework is "express"
        @log Setting up Express API
        > npm init -y
        > npm install express
    @elseif framework is "fastify"
        @log Setting up Fastify API
        > npm init -y
        > npm install fastify
    @end
    
@end
```

### Complex Logic
```plaintext
@set hasDocker = exists Dockerfile
@set hasCompose = exists docker-compose.yml
@set nodeProject = exists package.json

@if hasDocker is true
    @log Docker configuration found
    
    @if hasCompose is true
        @log Using Docker Compose
        > docker-compose up -d
    @elseif hasCompose isnot true
        @log Using standalone Docker
        > docker build -t myapp .
        > docker run -d myapp
    @end
    
@elseif nodeProject is true
    @log Node.js project without Docker
    > npm install
    > npm start
    
@end
```

## Real-World Examples

### Environment Setup
```plaintext
@set osType = input:Operating System (windows/mac/linux)

@if osType is "windows"
    @log Setting up Windows environment
    > mkdir src 2>nul || echo Directory exists
    @write "@echo off\nnode index.js" to start.bat
    
@elseif osType is "mac"
    @log Setting up macOS environment
    > mkdir -p src
    @write "#!/bin/bash\nnode index.js" to start.sh
    > chmod +x start.sh
    
@elseif osType is "linux"
    @log Setting up Linux environment
    > mkdir -p src
    @write "#!/bin/bash\nnode index.js" to start.sh
    > chmod +x start.sh
@end
```

### Conditional File Generation
```plaintext
@set includeTests = input:Include tests? (yes/no)
@set includeDocker = input:Include Docker? (yes/no)

@if includeTests is "yes"
    @fill test/example.test.js
    "
    const assert = require('assert');
    
    describe('Example Test', () => {
        it('should pass', () => {
            assert.equal(1 + 1, 2);
        });
    });
    "
@end

@if includeDocker is "yes"
    @fill Dockerfile
    "
    FROM node:18
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    EXPOSE 3000
    CMD ["npm", "start"]
    "
@end
```

### Project Migration
```plaintext
@set oldConfigExists = exists old-config.json
@set newConfigExists = exists config.json

@if oldConfigExists is true
    @if newConfigExists isnot true
        @log Migrating old configuration
        @set oldConfig = @load old-config.json
        @write oldConfig to config.json
        @log Migration complete
    @elseif newConfigExists is true
        @log Both old and new configs exist - manual intervention needed
    @end
@elseif oldConfigExists isnot true
    @log No old configuration found, creating new one
    @write "{}" to config.json
@end
```

## Error Handling

### Graceful Fallbacks
```plaintext
@if exists .env
    @log Using existing .env file
@elseif exists .env.example
    @log Copying .env.example to .env
    > cp .env.example .env
@end

@set envExists = exists .env
@if envExists isnot true
    @log Creating default .env file
    @write "NODE_ENV=development" to .env
@end
```

## Related Commands

- [`@loop`](loop.md) - Use conditional logic inside loops
- [`@set`](set.md) - Set variables for use in conditions
- [`@global`](global.md) - Use global variables in conditions
- [`> shell`](shell.md) - Execute conditional shell commands

---

[← Back to README](../../README.md)