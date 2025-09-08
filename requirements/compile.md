Aggiungi il commando compile <file_path> with template <template_name> and
<state> Esempio: compile src/{file} with template {component} and { author:
{author} } dove la proprietà "author" è presa dal context mentre "component" è
preso dal file config.json in dalla corrispondente proprietà di "templates":

```json
{
  "project_name": "MyApp",
  "author": "Alice",
  "version": "1.0.0",
  "templates": {
    "index.ts": "console.log('Hello, {author}');",
    "README.md": "# {project_name}\nVersione {version}\nAutore: {author}",
    "component": "import React from 'react'; export const {name} = () => <div>{name} component</div>; export default {name};"
  }
}
```
