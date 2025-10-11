# @task Command

The `@task` command allows you to organize your `.gen` scripts into named tasks, providing a menu-driven workflow where users can select which specific task to execute.

## Syntax

```plaintext
@task <task-name>
<command1>
<command2>
...

@task <another-task-name>
<command1>
<command2>
...
```

## Behavior

- **Task Definition**: A task is defined by the `@task` keyword followed by a task name
- **Task Scope**: All commands following a `@task` declaration belong to that task until either:
  - The next `@task` declaration
  - An empty line
  - End of file
- **Execution Mode**: When a `.gen` file contains one or more `@task` declarations, the normal sequential execution is replaced with an interactive task selection menu
- **Task Selection**: Users see a list of all available tasks and can choose which one to execute

## Examples

### Basic Task Structure

```plaintext
# project-setup.gen

@task init
@log Initializing new project
@set projectName = @input Enter project name
> mkdir -p {projectName}
@write "# {projectName}" to {projectName}/README.md

@task install
@log Installing dependencies
> npm install
> echo "Dependencies installed successfully"

@task start
@log Starting development server
> npm run dev
```

When you run this file:
```bash
gen --file project-setup.gen
```

You'll see:
```
Found 3 task(s) in the file.
? Which task would you like to execute? (Use arrow keys)
❯ init
  install
  start
```

## Notes

- Tasks cannot be nested (no task within a task)
- If no tasks are defined, the script executes normally in sequential order
- Task execution is isolated - only the selected task runs, not the entire file
- Variables set during task execution persist for the duration of that task execution