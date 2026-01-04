import fs from 'fs';
import path from 'path';

export type InitialBalance = {
  amount: number;
  date: string; // "YYYY-MM-DD"
};

type SettingsFile = {
  initialBalance: InitialBalance;
};

const SETTINGS_PATH = path.join(__dirname, '..', 'data', 'settings.json');


export function readSettings(): SettingsFile {
  if (!fs.existsSync(SETTINGS_PATH)) {
    const defaultSettings: SettingsFile = {
      initialBalance: {
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
      },
    };
    fs.writeFileSync(
      SETTINGS_PATH,
      JSON.stringify(defaultSettings, null, 2),
      'utf-8'
    );
    return defaultSettings;
  }

  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  return JSON.parse(raw) as SettingsFile;
}

export function writeSettings(settings: SettingsFile) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
