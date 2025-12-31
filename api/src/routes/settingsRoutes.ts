import { Router } from 'express';
import { readSettings, writeSettings, InitialBalance } from '../settingsService';

const router = Router();

// GET /settings/initial-balance
router.get('/initial-balance', (req, res) => {
  const settings = readSettings();
  res.json(settings.initialBalance || null);
});

// PUT /settings/initial-balance
router.put('/initial-balance', (req, res) => {
  const { amount, date } = req.body as Partial<InitialBalance>;

  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'amount must be a number' });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  const settings = readSettings();
  settings.initialBalance = { amount, date };
  writeSettings(settings);

  res.json(settings.initialBalance);
});

export default router;
