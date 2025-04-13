// routes/backup.js
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change your DB credentials here
const DB_HOST = process.env.MYSQL_HOST; 
const DB_PORT = process.env.PORT ?? 8080;    
const DB_USER = process.env.MYSQL_USER;
const DB_PASSWORD = process.env.MYSQL_PASSWORD;
const DB_NAME = 'CryptoMindDB';

// Create backup folder if not exists
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

router.get('/', (req, res) => {
  res.render('backup');
});

router.get('/download', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filePath = path.join(backupDir, filename);

    const dumpCommand = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} ${DB_NAME} > "${filePath}"`;

  exec(dumpCommand, (error) => {
    if (error) {
      console.error('Backup failed:', error);
      return res.status(500).send('Error generating backup.');
    }

    res.download(filePath, filename, (err) => {
      if (err) console.error('Download error:', err);
      // Optional: Delete file after sending
      // fs.unlinkSync(filePath);
    });
  });
});

export default router;
