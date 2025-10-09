# @loop Command

[← Back to README](../../README.md)

The `@loop` command iterates over arrays and lists, executing commands for each item.

## Syntax

```
@loop <itemName> in <arrayVariable>
    <commands>
@endloop
```

## Features

- **Array iteration**: Works with comma-separated values and array variables
- **Variable scoping**: Loop item is available as a variable within the loop
- **Nested loops**: Supports multiple levels of nesting
- **Variable interpolation**: Use `{itemName}` to access the current item
- **Integration**: Works seamlessly with conditionals and other commands

## Basic Usage

### Simple Array Iteration
```plaintext
@set fruits = "apple,banana,orange"

@loop fruit in fruits
    @log Processing: {fruit}
@endloop
```

### File Processing
```plaintext
@set extensions = "js,ts,json"

@loop ext in extensions
    @log Looking for *.{ext} files
    > find . -name "*.{ext}" -type f
@endloop
```

## Variable Creation

### Dynamic File Generation
```plaintext
@set languages = "javascript,typescript,python"

@loop lang in languages
    @write "# {lang} configuration" to config-{lang}.md
    @log Created configuration for {lang}
@endloop
```

### Environment Setup
```plaintext
@set environments = "development,staging,production"

@loop env in environments
    @write "NODE_ENV={env}" to .env.{env}
    @log Created environment file for {env}
@endloop
```

## Nested Loops

### Multi-dimensional Processing
```plaintext
@set sizes = "small,medium,large"
@set colors = "red,blue,green"

@loop size in sizes
    @log Size: {size}
    @loop color in colors
        @log Creating {size} {color} variant
        @write "{size}-{color} configuration" to variants/{size}-{color}.txt
    @endloop
@endloop
```

### File Structure Generation
```plaintext
@set modules = "auth,users,products"
@set fileTypes = "controller,service,model"

@loop module in modules
    @log Creating {module} module
    > mkdir -p src/{module}
    
    @loop type in fileTypes
        @fill src/{module}/{module}.{type}.js
        "
        // {module} {type}
        class {module}{type} {
            // Implementation for {module} {type}
        }
        
        module.exports = {module}{type};
        "
    @endloop
@endloop
```

## Conditional Logic in Loops

### Selective Processing
```plaintext
@set files = "readme.md,config.json,app.js,test.js"

@loop file in files
    @if file is "config.json"
        @log Found configuration file: {file}
        @set configExists = true
    @elseif file is "app.js"
        @log Found main application file: {file}
        @set appExists = true
    @end
@endloop

@if configExists is true
    @log Configuration is available
@end
```

### Platform-Specific Actions
```plaintext
@set platforms = "windows,mac,linux"

@loop platform in platforms
    @log Building for {platform}
    
    @if platform is "windows"
        > build-windows.bat
    @elseif platform is "mac"
        > ./build-mac.sh
    @elseif platform is "linux"
        > ./build-linux.sh
    @end
    
    @log Build complete for {platform}
@endloop
```

## Advanced Examples

### Project Scaffolding
```plaintext
@set projectName = input:Enter project name
@set components = input:Enter components (comma-separated)

@loop component in components
    @log Creating component: {component}
    
    # Create component file
    @fill src/components/{component}/{component}.tsx
    "
    import React from 'react';
    
    interface {component}Props {
        // Define props here
    }
    
    export function {component}(props: {component}Props) {
        return (
            <div className="{component}">
                <h1>{component} Component</h1>
            </div>
        );
    }
    
    export default {component};
    "
    
    # Create test file
    @fill src/components/{component}/{component}.test.tsx
    "
    import { render, screen } from '@testing-library/react';
    import {component} from './{component}';
    
    describe('{component}', () => {
        test('renders correctly', () => {
            render(<{component} />);
            expect(screen.getByText('{component} Component')).toBeInTheDocument();
        });
    });
    "
    
    # Create style file
    @fill src/components/{component}/{component}.module.css
    "
    .{component} {
        padding: 1rem;
        border-radius: 8px;
        background-color: var(--component-bg);
    }
    "
@endloop
```

### Database Migration
```plaintext
@set tables = "users,products,orders,reviews"

@loop table in tables
    @log Creating migration for {table}
    
    @fill migrations/001_create_{table}.sql
    "
    CREATE TABLE {table} (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_{table}_created_at ON {table}(created_at);
    CREATE INDEX idx_{table}_updated_at ON {table}(updated_at);
    "
    
    @log Created migration for {table} table
@endloop
```

### API Endpoint Generation
```plaintext
@set entities = "users,products,orders"
@set methods = "GET,POST,PUT,DELETE"

@loop entity in entities
    @log Creating API routes for {entity}
    
    @fill src/routes/{entity}.js
    "
    const express = require('express');
    const router = express.Router();
    
    // GET all {entity}
    router.get('/', (req, res) => {
        res.json({ message: 'Get all {entity}' });
    });
    
    // GET single {entity}
    router.get('/:id', (req, res) => {
        res.json({ message: 'Get {entity} by ID' });
    });
    
    // POST create {entity}
    router.post('/', (req, res) => {
        res.json({ message: 'Create {entity}' });
    });
    
    // PUT update {entity}
    router.put('/:id', (req, res) => {
        res.json({ message: 'Update {entity}' });
    });
    
    // DELETE {entity}
    router.delete('/:id', (req, res) => {
        res.json({ message: 'Delete {entity}' });
    });
    
    module.exports = router;
    "
@endloop
```

### Configuration Management
```plaintext
@set services = "api,frontend,database,redis"
@set environments = "dev,staging,prod"

@loop env in environments
    @log Creating {env} environment configuration
    
    @loop service in services
        @fill docker/{env}/{service}.yml
        "
        version: '3.8'
        
        services:
          {service}:
            image: {service}:latest
            environment:
              - NODE_ENV={env}
              - SERVICE_NAME={service}
            restart: unless-stopped
        "
    @endloop
@endloop
```

### Batch File Processing
```plaintext
@set inputFiles = files in ./input
@set outputFormats = "pdf,docx,html"

@loop file in inputFiles
    @log Processing {file}
    
    @loop format in outputFormats
        @log Converting {file} to {format}
        > pandoc "./input/{file}" -o "./output/{file}.{format}"
    @endloop
    
    @log Completed processing {file}
@endloop
```

## Loop with External Data

### API-Driven Loops
```plaintext
@set apiResponse = @http https://jsonplaceholder.typicode.com/users
@set userIds = "1,2,3,4,5"

@loop userId in userIds
    @log Processing user {userId}
    @set userData = @http https://jsonplaceholder.typicode.com/users/{userId}
    @write userData to users/user-{userId}.json
@endloop
```

### File-Based Iteration
```plaintext
@set configFile = @load ./config.json
@set itemList = files in ./templates

@loop template in itemList
    @log Processing template: {template}
    @set templateContent = @load ./templates/{template}
    @write templateContent to output/{template}
@endloop
```

## Performance Considerations

### Batch Operations
```plaintext
@set largeDataSet = "item1,item2,item3,item4,item5"
@set batchSize = 2
@set counter = 0

@loop item in largeDataSet
    @set counter = "{counter}1"
    @log Processing {item} ({counter})
    
    # Process item
    > process-item {item}
    
    # Optional: Add delays for rate limiting
    # > sleep 1
@endloop
```

## Error Handling in Loops

### Continue on Error
```plaintext
@set files = "file1.txt,file2.txt,missing.txt,file4.txt"

@loop file in files
    @if exists {file}
        @log Processing {file}
        @set content = @load {file}
        @write content to processed/{file}
    @elseif exists {file} isnot true
        @log Warning: {file} not found, skipping
    @end
@endloop
```

## Related Commands

- [`@if`](if.md) - Use conditional logic inside loops
- [`@set`](set.md) - Create array variables for iteration
- [`@write`](write.md) - Generate files in loops
- [`@fill`](fill.md) - Create multi-line files in loops

## Backward Compatibility

The old `FOREACH` syntax is still supported:
```plaintext
FOREACH item in list
    @log {item}
END
```

However, the new `@loop` / `@endloop` syntax is recommended for consistency.

---

[← Back to README](../../README.md)