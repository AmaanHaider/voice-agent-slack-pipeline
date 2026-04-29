const express = require("express");

const slackService = require("../services/slack");

const router = express.Router();

router.post("/", async (req, res) => {
  const payload = req.body || {};

  // eslint-disable-next-line no-console
  console.log(
    `Webhook received: id=${payload.id ?? "unknown"}, status=${payload.status ?? "unknown"}`
  );

  // Bolna sends multiple status transitions; only act on completed.
  if (payload.status !== "completed") {
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

