const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyFirebaseToken, isAdmin } = require("../middleware/auth");

// Protect all routes
router.use(verifyFirebaseToken);
router.use(isAdmin);

// GET all users with filters
router.get("/users", async (req, res) => {
  try {
    const { search = "", role = "" } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
});

module.exports = router;
