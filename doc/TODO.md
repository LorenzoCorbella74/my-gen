# My preferences for new commands!!
- [x] `@input` in place fo input: to prompt user input and set a variable.
  + Example: `@set projectName = @input Enter project name`
- [x] @select uno, due, tre in place of select:[uno, due, tre].
    - Example: `@set framework = @select Select a framework options: React,Vue,Angular`
- [] `@http` to fetch data from a URL but with data cleaning options
  (Readability.js ??)
- [ ] @pdf: to export variables to PDF (with Pupeeter.js ???).
  - Example: `@pdf content to path/to/file.pdf`
- [ ] --chat to transform gen into a chat interface (with ChatGPT ???) o come una repl... .
- [x] --workflow to define and run multiple .gen files in sequence with dependencies ??.
- [x] @task to fragment sequence of commands after a .gen file has been loaded but not yet executed. Fragments can be executed upon request
- [x] A VSCode extension to provide syntax highlighting and snippets for `.gen`
files.
- [x] @task <nome-task> se presente carica comandi ed esegue task specifici su selezione @run per esecuzione di task su selezione
- [x] --verbose to log the stdout of the shell commands (Default a false) 
- [x] >gen -> genera una console interattiva con Ink.js con la possibilità di caricare i file.gen per eseguire task immediati o su selezione
- [x] Insegnare all'ai a scrivere file .gen in base a richieste specifiche

# Future Plans
- [ ] reorganize the STDOUT and STDERR with ink.js
- [ ] Improve error handling and reporting
- [x] make it work globally (WINDOWS, LINUX, MAC)
- [x] understand how to extend with new commands "from outside"
