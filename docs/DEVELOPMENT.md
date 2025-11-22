# Development Setup

## Cursor AI + Claude 4 Opus Configuration

This project uses Cursor as the primary IDE with Claude 4 Opus for AI assistance.

### Quick Setup

1. **Install Cursor**: Download from https://cursor.sh
2. **Add Claude 4 Opus Model**: Settings → Models → Add Custom Model

```json
{
  "name": "Claude 4 Opus Fast",
  "provider": "anthropic",
  "model": "claude-4-opus-2025-10-31:fast",
  "apiKey": "sk-ant-api03-...",
  "apiBase": "https://api.anthropic.com/v1",
  "maxTokens": 200000,
  "temperature": 0.2
}
```

### Project-Specific Rules

The `.cursor/rules/` directory contains routing logic for different tasks:
- **Planning/Architecture**: Claude 4 Opus Full (1M context)
- **Code Generation**: Local Qwen 2.5 72B or Claude Fast
- **Review**: Claude 4 Opus Fast

### Hybrid Local + Cloud Setup

For cost optimization, we use:
- **Local models** (via Ollama) for routine coding
- **Claude 4 Opus** for complex reasoning and architecture
- **Grok-3** for real-time web access and tool calling

See `CURSOR_SETUP.md` for full configuration details.

## VS Code Alternative

If using VS Code instead of Cursor, install Continue.dev:

```bash
code --install-extension continue.continue
```

Then copy the config from `docs/continue.config.json`.

## Troubleshooting

See `CURSOR_SETUP.md` for the comprehensive troubleshooting table covering:
- VRAM/memory issues
- Model conflicts
- Rate limiting
- Context loss

## Next Steps

1. Review `.cursor/rules/apex-intelligence.mdc`
2. Set up environment variables (see `.env.example`)
3. Start coding with `Cmd+K` (Cursor) or `Cmd+L` (Continue)
