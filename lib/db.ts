import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'prompt-generator.db');

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    
    // Initialize tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS excel_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        data TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS generated_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        row_data TEXT NOT NULL,
        template_id INTEGER,
        prompt TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES prompt_templates (id)
      );
    `);

    // Insert default template if none exists
    const count = db.prepare('SELECT COUNT(*) as count FROM prompt_templates').get() as { count: number };
    if (count.count === 0) {
      db.prepare(`
        INSERT INTO prompt_templates (name, template)
        VALUES ('Default Template', 'Generate a professional response based on the following information:\n\n{{data}}')
      `).run();
    }
  }
  
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
