const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("video", { userId: req.session.user._id });
});

module.exports = router;
