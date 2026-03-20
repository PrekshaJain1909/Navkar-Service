const express = require("express");
const Settings = require("../models/Settings");
const router = express.Router();

// Get current settings
router.get("/", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    let settings = await Settings.findOne({ owner: ownerId });
    if (!settings) {
      settings = await Settings.create({ owner: ownerId });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put("/", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const { owner: _, ...payload } = req.body || {};

    let settings = await Settings.findOne({ owner: ownerId });
    if (!settings) {
      settings = await Settings.create({
        ...payload,
        owner: ownerId,
      });
    } else {
      settings = await Settings.findOneAndUpdate(
        { owner: ownerId },
        payload,
        { new: true }
      );
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/test-email", async (req, res) => {
  return res.json({ message: "Test email trigger accepted" });
});

router.post("/test-sms", async (req, res) => {
  return res.json({ message: "Test SMS trigger accepted" });
});

router.post("/test-whatsapp", async (req, res) => {
  return res.json({ message: "Test WhatsApp trigger accepted" });
});

module.exports = router;