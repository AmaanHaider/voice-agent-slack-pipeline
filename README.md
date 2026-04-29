## Bolna → Slack Integration

Send a Slack alert whenever a Bolna call execution ends with status `completed`, including **id**, **agent_id**, **duration**, and **transcript**.

### What this does

- **Receives** Bolna execution webhooks at `POST /webhook`
- **Filters** all events except `status === "completed"`
- **Posts** a Slack message via **Slack Incoming Webhooks**
- **Truncates** transcript to stay under Slack Block Kit limits (3,000 chars)

### Requirements

- Node.js 18+
- A Slack Incoming Webhook URL
- A Bolna agent with webhook configured

### Setup

1) Install dependencies

```bash
npm install
```

2) Create `.env`

```bash
cp .env.example .env
```

Fill in:

- `SLACK_WEBHOOK_URL` (Slack Incoming Webhook URL)
- `PORT` (optional, defaults to 3000)

3) Run locally

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

### Local webhook testing (without Bolna)

Non-completed (should be ignored):

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"test-123","agent_id":"agent-456","status":"in-progress","transcript":null,"telephony_data":null}'
```

Completed (should send Slack message):

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "4c06b4d1-4096-4561-919a-4f94539c8d4a",
    "agent_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
    "status": "completed",
    "transcript": "Agent: Hello!\\nUser: Hi!\\nAgent: How can I help?",
    "telephony_data": { "duration": 154 }
  }'
```

### Expose localhost to Bolna (ngrok)

In a separate terminal:

```bash
ngrok http 3000
```

Copy the `https://...ngrok.io` URL and set your Bolna agent webhook URL to:

- `https://<your-ngrok-domain>/webhook`

Bolna sends multiple execution updates per call; this integration only alerts on `completed`.

### Project structure

```
src/
  server.js
  routes/
    webhook.js
  services/
    slack.js
  utils/
    formatDuration.js
```

### Notes

- Slack Incoming Webhooks return `200` with body `ok` on success.
- The webhook handler **always returns 200 to Bolna**, even if Slack fails, to avoid infinite retries.

