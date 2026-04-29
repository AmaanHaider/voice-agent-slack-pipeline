const axios = require("axios");

const formatDuration = require("../utils/formatDuration");

const MAX_TRANSCRIPT_LENGTH = 2900; // Slack section text limit is 3000 chars.

function truncateTranscript(transcript) {
  const safe = transcript?.trim?.() ? transcript : null;
  if (!safe) return "_No transcript available_";

  if (safe.length <= MAX_TRANSCRIPT_LENGTH) return safe;

  return `${safe.slice(0, MAX_TRANSCRIPT_LENGTH)}\n... _(truncated)_`;
}

async function sendCallAlert({ id, agent_id, duration, transcript }) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    // In some environments (e.g. fresh deploy), the webhook may be invoked before env vars are set.
    // Do not throw here; the webhook handler should stay 200 OK to avoid upstream retries.
    // eslint-disable-next-line no-console
    console.warn("SLACK_WEBHOOK_URL is not set; skipping Slack alert.");
    return;
  }

  const durationText = duration !== null ? formatDuration(duration) : "N/A";
  const transcriptText = truncateTranscript(transcript);

  const slackPayload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Bolna Call Completed" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Call ID*\n\`${id ?? "N/A"}\`` },
          { type: "mrkdwn", text: `*Agent ID*\n\`${agent_id ?? "N/A"}\`` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Duration:* ${durationText}` },
      },
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Transcript*\n${transcriptText}` },
      },
    ],
  };

  const response = await axios.post(slackWebhookUrl, slackPayload, {
    headers: { "Content-Type": "application/json" },
    timeout: 10_000,
    // Slack incoming webhooks can return plain text; avoid axios trying to parse JSON.
    transformResponse: (r) => r,
    validateStatus: () => true,
  });

  if (response.status !== 200 || String(response.data).trim() !== "ok") {
    throw new Error(
      `Slack webhook failed: status=${response.status} body=${JSON.stringify(response.data)}`
    );
  }
}

module.exports = { sendCallAlert };

