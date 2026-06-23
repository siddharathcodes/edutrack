const Application = require("../models/Application");

// Lazily require the SDK so the rest of the app still works if it isn't installed yet
// (the person only needs this if they actually use the AI Analysis feature).
let Anthropic;
try {
  Anthropic = require("@anthropic-ai/sdk");
} catch (e) {
  Anthropic = null;
}

function buildClient() {
  if (!Anthropic) return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Aggregates the numbers the AI will reason over. Keeping this as plain counts (not raw
// applicant records) means no applicant PII is ever sent to the AI API.
async function buildStatsSummary(filter) {
  const [byStage, byCountry, byLevel, total] = await Promise.all([
    Application.aggregate([{ $match: filter }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
    Application.aggregate([{ $match: filter }, { $group: { _id: "$country", count: { $sum: 1 } } }]),
    Application.aggregate([{ $match: filter }, { $group: { _id: "$level", count: { $sum: 1 } } }]),
    Application.countDocuments(filter),
  ]);

  const refunds = byStage.find((s) => s._id === "Refund")?.count || 0;
  const outcomes = byStage.find((s) => s._id === "Visa Outcome")?.count || 0;
  const withdrawn = byStage.find((s) => s._id === "Withdrawn/Cancelled")?.count || 0;

  return { total, byStage, byCountry, byLevel, refunds, outcomes, withdrawn };
}

async function generateAnalysis(req, res) {
  const client = buildClient();
  if (!client) {
    return res.status(503).json({
      error: "AI analysis isn't configured yet. Set ANTHROPIC_API_KEY in the backend's .env and run `npm install @anthropic-ai/sdk`.",
    });
  }

  // Reuse the same country/date scoping as the rest of the app, so staff only ever
  // get an analysis of data they're allowed to see.
  const { country, dateFrom, dateTo } = req.query;
  const filter = {};
  if (req.user.role !== "admin") {
    filter.country = { $in: req.user.countries || [] };
  }
  if (country && country !== "All") filter.country = country;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const stats = await buildStatsSummary(filter);

  if (stats.total === 0) {
    return res.json({ analysis: "No applications in this range to analyze yet." });
  }

  const prompt = `You are analyzing study-abroad visa application data for an education consultancy.
Here are the aggregated counts (no personal data included):

Total applications: ${stats.total}
By stage: ${JSON.stringify(stats.byStage)}
By country: ${JSON.stringify(stats.byCountry)}
By level: ${JSON.stringify(stats.byLevel)}

Write a short, plain-language analysis (3-5 short paragraphs, no headers, no bullet lists) covering:
1. What's going well (strengths) — e.g. countries or levels with strong progress to outcome/payment.
2. What's concerning (weaknesses) — e.g. high refund/withdrawal rates, countries with applications stuck early in the pipeline.
3. One or two concrete, practical suggestions for the team.
Be specific with the numbers given. Don't invent data not present above. Keep the tone factual and useful for a busy consultancy team, not generic.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
    res.json({ analysis: text, stats });
  } catch (err) {
    console.error("AI analysis failed:", err.message);
    res.status(502).json({ error: "Couldn't generate the analysis right now. Please try again shortly." });
  }
}

module.exports = { generateAnalysis };
