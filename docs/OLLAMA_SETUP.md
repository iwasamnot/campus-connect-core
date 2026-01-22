# Ollama GPU Droplet Setup - Complete Guide

## ✅ Setup Complete!

Your Ollama server is now running on:
- **IP Address**: `138.197.142.141`
- **Port**: `11434`
- **Model**: `deepseek-r1:32b` (or your preferred model)

## Configuration

### For Local Development

Add to your `.env` file:
```bash
VITE_OLLAMA_URL=http://138.197.142.141:11434
VITE_OLLAMA_MODEL=deepseek-r1:32b
```

### For Production (GitHub Actions)

Add these secrets in GitHub → Settings → Secrets → Actions:
- `VITE_OLLAMA_URL` = `http://138.197.142.141:11434`
- `VITE_OLLAMA_MODEL` = `deepseek-r1:32b` (optional, defaults to this)

## Verify Ollama is Working

Test from your local machine:
```bash
curl http://138.197.142.141:11434/api/tags
```

You should see your models listed. If you get a connection error, check:
1. Firewall: `sudo ufw status` (port 11434 should be allowed)
2. Ollama service: `sudo systemctl status ollama`
3. Network: Make sure the droplet is accessible from the internet

## Test the API

```bash
curl http://138.197.142.141:11434/api/chat -d '{
  "model": "deepseek-r1:32b",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

## Cost Management ⚠️

**IMPORTANT**: Your droplet costs **$1.57/hour** (~$37.68/day)

### During Development:
- Power it **OFF** when not in use (saves money but takes 2-3 min to restart)
- Or keep it running if you're actively developing

### After Your Demo:
- **DESTROY** the droplet completely to stop all charges
- Go to DigitalOcean dashboard → Droplets → Select droplet → Destroy

## Security Notes

- Your Ollama is open to the internet (`OLLAMA_ORIGINS=*`)
- Consider adding IP whitelist if needed
- For production, use a reverse proxy with authentication

## Troubleshooting

### Connection Refused
```bash
# Check if Ollama is running
sudo systemctl status ollama

# Check if port is open
sudo ufw status
sudo ufw allow 11434

# Check Ollama logs
sudo journalctl -u ollama -f
```

### Model Not Found
```bash
# List available models
ollama list

# Pull the model if needed
ollama pull deepseek-r1:32b
```

### Performance Issues
- Check GPU usage: `nvidia-smi`
- Monitor memory: `watch -n 1 nvidia-smi`
- For 48GB VRAM, you can use larger models (70B) if needed
