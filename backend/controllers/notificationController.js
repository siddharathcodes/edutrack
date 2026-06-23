const Notification = require("../models/Notification");
const Application = require("../models/Application");

// Returns notices relevant to the logged-in user: broadcasts (no recipients/country set),
// notices addressed to them directly, or notices scoped to a country they have access to.
function visibilityFilter(user) {
  const or = [
    { recipients: { $size: 0 }, country: null }, // true broadcast
    { recipients: user._id },
  ];
  if (user.role === "admin") {
    or.push({ country: { $ne: null } }); // admin sees all country-scoped notices too
  } else {
    or.push({ country: { $in: user.countries || [] } });
  }
  return { $or: or };
}

async function list(req, res) {
  const notices = await Notification.find(visibilityFilter(req.user))
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sentBy", "name")
    .populate("relatedApplication", "name country stage");

  const unreadCount = notices.filter((n) => !n.readBy.some((id) => id.equals(req.user._id))).length;
  res.json({ notifications: notices, unreadCount });
}

async function create(req, res) {
  const { title, message, severity, recipients, country } = req.body;
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Title and message are required." });
  }
  const notice = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type: "manual",
    severity: severity || "info",
    sentBy: req.user._id,
    recipients: recipients || [],
    country: country || null,
  });
  res.status(201).json({ notification: notice });
}

async function markRead(req, res) {
  const notice = await Notification.findById(req.params.id);
  if (!notice) return res.status(404).json({ error: "Notification not found." });
  if (!notice.readBy.some((id) => id.equals(req.user._id))) {
    notice.readBy.push(req.user._id);
    await notice.save();
  }
  res.json({ success: true });
}

async function markAllRead(req, res) {
  const notices = await Notification.find(visibilityFilter(req.user));
  await Promise.all(
    notices.map((n) => {
      if (!n.readBy.some((id) => id.equals(req.user._id))) {
        n.readBy.push(req.user._id);
        return n.save();
      }
      return Promise.resolve();
    })
  );
  res.json({ success: true });
}

async function remove(req, res) {
  const notice = await Notification.findById(req.params.id);
  if (!notice) return res.status(404).json({ error: "Notification not found." });
  await notice.deleteOne();
  res.json({ success: true });
}

// Auto-alert generator: looks for applications stuck at "Visa Lodged" for more than
// `staleDays` with no outcome yet, and creates one alert per such application
// (skips ones that already have an open alert, to avoid spamming).
async function generateAutoAlerts(req, res) {
  const staleDays = Number(req.body?.staleDays) || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDays);

  const stale = await Application.find({
    stage: "Visa Lodged",
    visaLodgement: { $lte: cutoff },
  });

  let createdCount = 0;
  for (const app of stale) {
    const alreadyAlerted = await Notification.findOne({ type: "auto", relatedApplication: app._id });
    if (alreadyAlerted) continue;

    await Notification.create({
      title: "Visa outcome overdue",
      message: `${app.name} (${app.country}) has been at "Visa Lodged" for over ${staleDays} days with no recorded outcome. Worth a follow-up.`,
      type: "auto",
      severity: "warning",
      country: app.country,
      relatedApplication: app._id,
    });
    createdCount++;
  }

  res.json({ created: createdCount, checked: stale.length });
}

module.exports = { list, create, markRead, markAllRead, remove, generateAutoAlerts };
