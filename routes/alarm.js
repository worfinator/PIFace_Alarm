const config = require('config');
const auth = require('../middleware/auth');
const alarm = require("../controllers/alarm");
const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

commonConfig = config.get('Common');
apiConfig = config.get('API');

router.get("/on/", auth.validate, async (req, res) => {
  await alarm.setAlarm(true);
  let status = await alarm.getStatus();
  res.send(status);
});

router.get("/off/", auth.validate, async (req, res) => {
  await alarm.setAlarm(false);
  let status = await alarm.getStatus();
  res.send(status);
});

router.get("/status/", auth.validate, async (req, res) => {
  let status = await alarm.getStatus();
  res.send(status);
});

router.get("/token/", auth.validate, async (req, res) => {
  const token = auth.getToken();
  res.send(token);
});

router.get("/token/:key", auth.validate, async (req, res) => {
  const token = auth.getToken();
  res.send(token);
});

module.exports = router;