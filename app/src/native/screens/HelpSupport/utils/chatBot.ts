// Very small canned-response engine to make the chat feel alive without a backend.
export function getAgentReply(userText: string): string {
  const t = userText.toLowerCase();

  if (t.includes("order") && (t.includes("where") || t.includes("track"))) {
    return "I can help with that! Could you share your Order ID (e.g. #FD12345) so I can check the live status?";
  }
  if (/#?fd\d{4,}/i.test(t)) {
    return "Thanks! I can see that order — it's currently out for delivery and should arrive within 15 minutes. Anything else I can help with?";
  }
  if (t.includes("refund")) {
    return "Refunds usually take 5-7 business days to reflect once approved. Do you have an order ID you'd like me to check?";
  }
  if (t.includes("cancel")) {
    return "I can help you cancel an order if it hasn't been prepared yet. Could you share the order ID?";
  }
  if (t.includes("thank")) {
    return "You're very welcome! 😊 Is there anything else I can help you with?";
  }
  if (t.includes("hi") || t.includes("hello") || t.includes("hey")) {
    return "Hey there! 👋 How can I help you today?";
  }

  return "Got it — let me look into that for you. In the meantime, is there an order ID or account email I should reference?";
}
