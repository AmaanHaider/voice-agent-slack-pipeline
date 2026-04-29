## Bolna → Slack Integration

Send a Slack alert whenever a Bolna call execution ends with status `completed`, including **id**, **agent_id**, **duration**, and **transcript**.

### What this does

- **Receives** Bolna execution webhooks at `POST /webhook`
- **Filters** all events except `status === "completed"`
- **Protects** the webhook with an optional shared secret via URL param: `POST /webhook?secret=...`
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
- `WEBHOOK_SECRET` (optional but recommended; URL-safe string)

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
curl -X POST "http://localhost:3000/webhook?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id":"1277f04b-ac4d-4eb8-9f13-aeb6bbbbdd7c","agent_id":"agent-456","status":"in-progress","transcript":"hello","telephony_data":{"duration":1}}'
```

Completed (should send Slack message):

```bash
curl -X POST "http://localhost:3000/webhook?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "4c06b4d1-4096-4561-919a-4f94539c8d4a",
    "agent_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
    "status": "completed",
    "transcript": "Agent: Hello!\\nUser: Hi!\\nAgent: How can I help?",
    "telephony_data": { "duration": 154 }
  }'
```

### Webhook filtering rules

- Only processes `status === "completed"`
- Ignores obvious test payloads where `id` is not a UUID (e.g. `id="test"`)
- Ignores completed payloads with an empty transcript to avoid Slack noise

### Expose localhost to Bolna (ngrok)

In a separate terminal:

```bash
ngrok http 3000
```

Copy the `https://...ngrok.io` URL and set your Bolna agent webhook URL to:

- `https://<your-ngrok-domain>/webhook?secret=YOUR_SECRET`

Bolna sends multiple execution updates per call; this integration only alerts on `completed`.

### Deploy to Vercel

This repo is set up to deploy the Express app as a Vercel Node function.

1) Connect the GitHub repo to Vercel
2) In Vercel Project → Settings → Environment Variables, set:
   - `SLACK_WEBHOOK_URL`
   - `WEBHOOK_SECRET`
3) Deploy

After deploy, configure Bolna webhook URL as:

- `https://<your-vercel-domain>/webhook?secret=YOUR_SECRET`

### Project structure

```
src/
  app.js
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

