# @ai Command

[← Back to README](../../README.md)

The `@ai` command integrates with [Ollama](https://ollama.com/) to provide AI-powered text generation and assistance.

## Prerequisites

1. **Install Ollama**: Download and install from [ollama.com](https://ollama.com/)
2. **Pull a model**: Run `ollama pull llama3.2:latest` (or your preferred model)
3. **Start Ollama**: Ensure the Ollama service is running

## Syntax

```
@ai <prompt>
```

## Configuration

Configure AI behavior using global variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MODEL` | `llama3.2:latest` | The Ollama model to use |
| `AI_OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama server URL |
| `AI_TEMPERATURE` | `0.7` | Response creativity (0.0-2.0) |
| `AI_SYSTEM_PROMPT` | *(none)* | System prompt to guide AI behavior |



### Basic Usage
```plaintext
# Use a code-focused model
@global AI_MODEL = codellama
@global AI_TEMPERATURE = 0.3
@global AI_SYSTEM_PROMPT = You are a helpful coding assistant

# Generate code
@ai Create a JavaScript function to validate email addresses

@set language = "Python"
@set framework = "FastAPI"
@ai Create a {language} web server using {framework} with CRUD operations for a blog post model
```

## Related Commands

- [`@set`](set.md) - Store AI responses in variables
- [`@global`](global.md) - Configure AI settings globally
- [`@write`](write.md) - Save AI-generated content to files

---

[← Back to README](../../README.md)