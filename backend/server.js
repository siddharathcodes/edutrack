require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const countryRoutes = require("./routes/countryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dailyReportRoutes = require("./routes/dailyReportRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// Basic protection against brute-force login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again in a few minutes." },
});
app.use("/api/auth/login", loginLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/daily-reports", dailyReportRoutes);
app.use("/api/analysis", analysisRoutes);

// Fallback error handler so unexpected errors don't crash the process or leak stack traces
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`EduTrack API running on port ${PORT}`));

  // Once a day, check for applications stuck at "Visa Lodged" too long and create alerts.
  // Render's free tier can spin the service down when idle, so this won't fire on a perfect
  // schedule there — it's a best-effort daily check, not a guarantee. Runs at 6am server time.
  cron.schedule("0 6 * * *", async () => {
    try {
      const { generateAutoAlerts } = require("./controllers/notificationController");
      await generateAutoAlerts({ body: { staleDays: 30 } }, { json: (data) => console.log("Auto-alert check:", data) });
    } catch (err) {
      console.error("Scheduled auto-alert generation failed:", err.message);
    }
  });
});
