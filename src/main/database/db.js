const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');

let dbInstance;

const initialize = () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'school-bus.db');
    dbInstance = new Database(dbPath);
    
    // Enable foreign key constraints
    dbInstance.pragma('foreign_keys = ON');
    
    // Create tables if they don't exist
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stands TEXT NOT NULL,
        boys_count INTEGER DEFAULT 0,
        girls_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL,
        type TEXT CHECK(type IN ('boys', 'girls', 'mixed')),
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL,
        boys_bus_id INTEGER,
        girls_bus_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (boys_bus_id) REFERENCES buses(id) ON DELETE SET NULL,
        FOREIGN KEY (girls_bus_id) REFERENCES buses(id) ON DELETE SET NULL,
        UNIQUE(route_id)
      );
      
      CREATE TABLE IF NOT EXISTS audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        UNIQUE(route_id)
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        roll INTEGER NOT NULL,
        stand_id INTEGER NOT NULL,
        stand TEXT NOT NULL,
        shift TEXT CHECK(shift IN ('morning', 'day')) NOT NULL,
        contact TEXT,
        address TEXT,
        image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stand_id) REFERENCES routes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audio_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database initialized at:', dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const getDb = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return dbInstance;
};

const backupDatabase = () => {
  const dbPath = path.join(app.getPath('userData'), 'school-bus.db');
  const backupPath = path.join(app.getPath('userData'), 'school-bus-backup.db');
  
  try {
    fs.copyFileSync(dbPath, backupPath);
    return true;
  } catch (error) {
    console.error('Database backup failed:', error);
    return false;
  }
};

module.exports = {
  initialize,
  getDb,
  backupDatabase
};