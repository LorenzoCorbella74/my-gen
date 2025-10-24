# Approccio Ibrido Shell + Cross-Spawn

## 🎯 Obiettivo

L'implementazione ibrida combina il meglio di due mondi:
- **Cross-spawn** per comandi esterni che beneficiano di maggiore affidabilità cross-platform
- **Shell nativo** per comandi complessi che richiedono funzionalità shell avanzate

## 🔄 Logica di Decisione

### ✅ Comandi che usano **cross-spawn**:
- `npm`, `node`, `git`, `python`, `pip`, `java`, `gcc`, `make`, `curl`, `wget`, `yarn`, `pnpm`
- **Solo se** NON contengono operatori shell: `&`, `|`, `>`, `<`, `&&`, `||`, `;`, `` ` ``, `$(`

### 🐚 Comandi che usano **shell nativo**:
- Tutti gli altri comandi
- Comandi con pipe: `cat file.txt | grep pattern`
- Comandi con redirection: `echo "hello" > file.txt`
- Comandi con chaining: `mkdir test && cd test`
- Built-in shell commands: `echo`, `set`, `export`, `cd`

## 📝 Esempi

```bash
# Cross-spawn (più affidabile)
> npm install express          ✅ cross-spawn
> git clone https://...        ✅ cross-spawn  
> node script.js               ✅ cross-spawn
> python main.py               ✅ cross-spawn

# Shell nativo (funzionalità avanzate)
> npm install && npm start     🐚 shell (contiene &&)
> echo "hello" > file.txt      🐚 shell (contiene >)
> git status | grep modified   🐚 shell (contiene |)
> set VAR=value                🐚 shell (built-in)
> cd ../..                     🐚 shell (gestito da handleCdCommand)
```

## 🔧 Implementazione

### Funzione di Decisione
```typescript
function shouldUseCrossSpawn(command: string): boolean {
  if (!crossSpawn) return false;
  
  const externalCommands = /^(npm|node|git|python|pip|java|gcc|make|curl|wget|yarn|pnpm)\s/i;
  const shellCommands = /[&|><]|&&|\|\||;|`|\$\(/;
  
  const trimmedCommand = command.trim();
  return externalCommands.test(trimmedCommand) && !shellCommands.test(trimmedCommand);
}
```

### Parser Comandi
```typescript
function parseSimpleCommand(command: string): { cmd: string; args: string[] } | null {
  // Gestisce quote semplici: "arg with spaces" 'another arg'
  // Split intelligente su spazi rispettando le virgolette
}
```

## 🎨 Output di Debug

Con `--verbose`, puoi vedere quale approccio viene usato:

```
[CMD] > npm install express
[SHELL-DEBUG] Will use cross-spawn for this command
[CROSS-SPAWN] Executing: npm install express

[CMD] > echo "hello" > file.txt  
[SHELL-DEBUG] Will use shell approach for this command
[SHELL-DEBUG] Executing: cmd.exe /c echo "hello" > file.txt
```

## 🔀 Fallback Graceful

Se cross-spawn non è disponibile:
- Mostra warning: `cross-spawn not available, falling back to standard spawn`
- Tutti i comandi vengono eseguiti con shell nativo
- Nessuna interruzione del servizio

## ✅ Vantaggi

1. **Affidabilità**: Comandi npm/git più stabili su Windows
2. **Flessibilità**: Pipe e redirection funzionano normalmente  
3. **Compatibilità**: Backward compatibility completa
4. **Performance**: Comandi semplici più veloci (meno overhead shell)
5. **Debug**: Visibilità su quale approccio viene usato

## 🧪 Testing

Usa il file `test/hybrid_shell_test.gen` per verificare:
- Comandi cross-spawn vs shell
- Gestione errori in entrambi gli approcci
- Mixing di comandi diversi
- Directory navigation

```bash
gen --file test/hybrid_shell_test.gen --verbose --output ./test-hybrid
```

## 📦 Dipendenze

```bash
npm install cross-spawn
```

Opzionale ma consigliato per massima compatibilità cross-platform.