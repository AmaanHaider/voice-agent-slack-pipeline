const express = require("express");
const crypto = require("crypto");

const slackService = require("../services/slack");

const router = express.Router();

function isValidSecret(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(String(provided));
  const expectedBuf = Buffer.from(String(expected));
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function isLikelyUuid(value) {
  if (typeof value !== "string") return false;
  // Accept UUID v1-v5 (common format). Good enough to filter obvious test values like "test".
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function hasMeaningfulTranscript(value) {
  return typeof value === "string" && value.trim().length > 0;
}

router.post("/", async (req, res) => {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret = req.query?.secret;
    if (!isValidSecret(providedSecret, expectedSecret)) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  const payload = req.body || {};

  // eslint-disable-next-line no-console
  console.log(
    `Webhook received: id=${payload.id ?? "unknown"}, status=${payload.status ?? "unknown"}`
  );

  // Bolna sends multiple status transitions; only act on completed.
  if (payload.status !== "completed") {
    return res.status(200).json({ received: true, processed: false });
  }

  // Filter out obvious test/invalid payloads to avoid noisy Slack alerts.
  if (!isLikelyUuid(payload.id)) {
    return res.status(200).json({ received: true, processed: false });
  }

  // Some completed executions may not include a transcript (or it may arrive later).
  // For this assignment, skip Slack in that case to avoid "No transcript available" spam.
  if (!hasMeaningfulTranscript(payload.transcript)) {
    return res.status(200).json({ received: true, processed: false });
  }

  const callData = {
    id: payload.id ?? null,
    agent_id: payload.agent_id ?? null,
    duration: payload.telephony_data?.duration ?? null,
    transcript: payload.transcript ?? null,
  };

  try {
    await slackService.sendCallAlert(callData);
    // eslint-disable-next-line no-console
    console.log(`Slack alert sent for call: ${callData.id ?? "unknown"}`);
  } catch (err) {
    // Never fail the webhook response; Bolna may retry endlessly.
    // eslint-disable-next-line no-console
    console.error("Failed to send Slack alert:", err?.message || err);
  }

  return res.status(200).json({ received: true, processed: true });
});

module.exports = router;

