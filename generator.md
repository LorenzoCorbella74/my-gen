Realizza una applicazione CLI in TypeScript per Deno 2 che legge un file .gen
contenente, riga per riga, istruzioni di automazione, opzionalmente un file
.json con variabili iniziali ed il contenuto di file template, e ne esegue i
comandi sequenzialmente. L'applicazione leggendo il file .gen deve supportare un
DSL (Domain Specific Language) semplice e leggibile, ed essere un tool CLI robusto, modulare ed estendibile.

# Struttura di progetto desiderata

```plaintext
project/
 ├─ generator.ts       # entrypoint CLI
 ├─ dsl/
 │   ├─ parser.ts      # parser per il DSL → AST
 │   ├─ executor.ts    # esecutore dei comandi
 │   └─ context.ts     # gestione variabili e interpolazioni
 ├─ project.gen        # file DSL di esempio
 └─ project.json       # variabili di esempio
```

# Requisiti DSL

- Commenti: iniziano con #
- Interpolazione variabili: {var} → sostituito al runtime.
- Niente virgolette obbligatorie: le stringhe si scrivono direttamente.
- Sintassi a riga singola: ogni comando è su una riga, parsing lineare.

# Comandi supportati

## Gestione variabili

set <var> = <value> → assegna valore. set <var> = input:<prompt> → chiede input
interattivo. set <var> = select:<prompt>:[v1,v2] → chiede input interattivo. set
<var> = multiselect:<prompt>:[v1,v2,v3] → input multiplo.

## Log

- log <message> → stampa su stdout, con interpolazione.

## Shell

- > <comando> → esegue comandi di sistema (bash -c).

## File e cartelle

- list = files in <path> → ottiene array di file nella cartella.
- list = folders in <path> → ottiene array di sottocartelle.

## Lettura contenuti

- set <var> = load <path> → legge contenuto file in variabile.
- set <var> = http <url> → esegue richiesta GET e salva risposta in variabile.

## Scrittura

- write <var> to <path> → scrive contenuto variabile in file.
- write <file_path> with template <template-path> and { key: value }

Usa file template e parametri per generare output. al posto di **write** si può
usare **save** come alias.

## Interrogazione LLM

- set <var> = ask <prompt> → invia prompt a LLM locale (es. Ollama).

Poi si può usare write per scrivere il risultato su file:

- set result = ask Genera un README per {project_name}
- write result to README.md

## Controllo di flusso

- if <condition> … elseif<condition>, else, endif

Condizioni: exists <path>, not_exists <path>, contains <var>, not_contains <var>

- foreach <item> in <list> … endforeach

## Funzionamento generale

- Caricamento variabili iniziali da file JSON (se presente).
- Parsing del file .gen in un AST con nodi set, log, >, write, ecc.
- Esecuzione sequenziale dei comandi con:
- Interpolazione {var} ritardata al momento dell’esecuzione.
- Gestione dello stato delle variabili in un Context.
- Stampa log colorati e leggibili.

## CLI options:

--file <path> → specifica file .gen (default: project.gen). --config <path> →
specifica file .json con variabili.

## Implementazione desiderata

- Parser semplice: tokenizza riga, costruisce AST minimale.
- Executor che gestisce ogni comando come funzione registrata.
- Context per variabili e interpolazione stringhe.
- Sistema plugin: facile aggiungere nuove keyword per comandi custom. 
- Test file di esempio con set, log, write, >, files in.

Valutare se usare per il parsing pegjs o nearley.

## Esempio di file .gen

```plaintext
set project_name = input:Nome del progetto
set author = input:Autore

log Creazione progetto {project_name} di {author}

if not_exists package.json
    > npm init -y
endif

templates = files in ./templates

foreach file in templates
    write src/{file} with template templates/{file} and { author: {author} }
endforeach

set readme_text = ask Genera un README breve per {project_name}
write readme_text to README.md

log Setup completato!
```

# Esempio di file .json

```json
{
    "project_name": "MyApp",
    "author": "Alice",
    "version": "1.0.0",
    "templates": {
        "index.ts": "console.log('Hello, {author}');",
        "README.md": "# {project_name}\nVersione {version}\nAutore: {author}"
    }
}
```

# Output atteso
- Esecuzione sequenziale di comandi con log su stdout.
- Variabili interpolate correttamente.
- File generati in base a write.
- Comandi shell eseguiti tramite Deno.Command.
