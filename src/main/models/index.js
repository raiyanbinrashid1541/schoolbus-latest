const { getDb } = require('../database/db');

class RouteModel {
  static getAllRoutes() {
    const db = getDb();
    const routes = db.prepare('SELECT * FROM routes ORDER BY name').all();
    // Ensure stands is properly formatted
    return routes.map(route => ({
      ...route,
      stands: typeof route.stands === 'string' ? JSON.parse(route.stands) : route.stands
    }));
  }

  static addRoute(name, stands, boysCount, girlsCount) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO routes (name, stands, boys_count, girls_count) 
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, JSON.stringify(stands), boysCount, girlsCount);
    return info.lastInsertRowid;
  }

  static updateRoute(id, field, value) {
    const db = getDb();
    if (field === 'stands') {
      value = JSON.stringify(value);
    }
    const stmt = db.prepare(`UPDATE routes SET ${field} = ? WHERE id = ?`);
    stmt.run(value, id);
    return true;
  }

  static deleteRoute(id) {
    const db = getDb();
    db.prepare('DELETE FROM routes WHERE id = ?').run(id);
    return true;
  }
}

class BusModel {
  static getAllBuses() {
    const db = getDb();
    return db.prepare('SELECT * FROM buses ORDER BY number').all();
  }

  static getActiveBuses() {
    const db = getDb();
    return db.prepare('SELECT * FROM buses WHERE is_active = 1 ORDER BY number').all();
  }

  static addBus(number, capacity, type = 'mixed') {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO buses (number, capacity, type, is_active) 
      VALUES (?, ?, ?, 1)
    `);
    const info = stmt.run(number, capacity, type);
    return info.lastInsertRowid;
  }

  static updateBus(id, field, value) {
    const db = getDb();
    const stmt = db.prepare(`UPDATE buses SET ${field} = ? WHERE id = ?`);
    stmt.run(value, id);
    return true;
  }

  static updateBusStatus(id, isActive) {
    const db = getDb();
    const stmt = db.prepare('UPDATE buses SET is_active = ? WHERE id = ?');
    stmt.run(isActive ? 1 : 0, id);
    return true;
  }

  static deleteBus(id) {
    const db = getDb();
    db.prepare('DELETE FROM buses WHERE id = ?').run(id);
    return true;
  }
}

class StudentModel {
  static getStudents(searchTerm = '', shift = 'morning') {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT s.*, r.name as route_name 
      FROM students s
      LEFT JOIN routes r ON s.stand_id = r.id
      WHERE s.shift = ?
      ${searchTerm ? 'AND (s.name LIKE ? OR s.class LIKE ? OR s.roll LIKE ?)' : ''}
      ORDER BY s.name
    `);
    
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      return stmt.all(shift, searchPattern, searchPattern, searchPattern);
    }
    return stmt.all(shift);
  }

  static addStudent(studentData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO students (
        name, class, roll, stand_id, stand, shift, contact, address, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      studentData.name,
      studentData.class,
      studentData.roll,
      studentData.stand_id,
      studentData.stand,
      studentData.shift,
      studentData.contact || '',
      studentData.address || '',
      studentData.image_path || ''
    );
    return info.lastInsertRowid;
  }

  static updateStudent(id, field, value) {
    const db = getDb();
    const stmt = db.prepare(`UPDATE students SET ${field} = ? WHERE id = ?`);
    stmt.run(value, id);
    return true;
  }

  static deleteStudent(id) {
    const db = getDb();
    const student = db.prepare('SELECT image_path FROM students WHERE id = ?').get(id);
    
    if (student && student.image_path) {
      try {
        require('fs').unlinkSync(student.image_path);
      } catch (error) {
        console.error('Error deleting student image:', error);
      }
    }
    
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return true;
  }
}

class AudioPhraseModel {
  static getAudioPhrases() {
    const db = getDb();
    return db.prepare('SELECT * FROM audio_phrases ORDER BY type, text').all();
  }

  static addAudioPhrase(phraseData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO audio_phrases (type, text, file_path)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(phraseData.type, phraseData.text, phraseData.file_path);
    return info.lastInsertRowid;
  }

  static deleteAudioPhrase(id) {
    const db = getDb();
    const phrase = db.prepare('SELECT file_path FROM audio_phrases WHERE id = ?').get(id);
    
    if (phrase && phrase.file_path) {
      try {
        require('fs').unlinkSync(phrase.file_path);
      } catch (error) {
        console.error('Error deleting audio phrase file:', error);
      }
    }
    
    db.prepare('DELETE FROM audio_phrases WHERE id = ?').run(id);
    return true;
  }
}

class AssignmentModel {
  static getAssignments() {
    const db = getDb();
    return db.prepare(`
      SELECT 
        a.id,
        r.name as route_name,
        r.stands as route_stands,
        r.boys_count,
        r.girls_count,
        b1.number as boys_bus,
        b2.number as girls_bus
      FROM assignments a
      LEFT JOIN routes r ON a.route_id = r.id
      LEFT JOIN buses b1 ON a.boys_bus_id = b1.id
      LEFT JOIN buses b2 ON a.girls_bus_id = b2.id
      ORDER BY r.name
    `).all();
  }

  static saveAssignment(routeId, boysBusId, girlsBusId) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO assignments (route_id, boys_bus_id, girls_bus_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(routeId, boysBusId, girlsBusId);
    return true;
  }

  static deleteAssignment(id) {
    const db = getDb();
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
    return true;
  }

  static autoAssignBuses() {
    const db = getDb();
    
    // Get all routes and buses
    const routes = db.prepare('SELECT * FROM routes ORDER BY (boys_count + girls_count) DESC').all();
    const boysBuses = db.prepare('SELECT * FROM buses WHERE type = "boys" OR type = "mixed" ORDER BY capacity DESC').all();
    const girlsBuses = db.prepare('SELECT * FROM buses WHERE type = "girls" OR type = "mixed" ORDER BY capacity DESC').all();
    
    // Clear existing assignments
    db.prepare('DELETE FROM assignments').run();
    
    // Assign buses to routes
    const assignments = [];
    
    for (const route of routes) {
      let boysBusId = null;
      let girlsBusId = null;
      
      // Assign boys bus
      if (route.boys_count > 0) {
        for (let i = 0; i < boysBuses.length; i++) {
          if (boysBuses[i] && boysBuses[i].capacity >= route.boys_count) {
            boysBusId = boysBuses[i].id;
            boysBuses[i] = null; // Mark as used
            break;
          }
        }
      }
      
      // Assign girls bus
      if (route.girls_count > 0) {
        for (let i = 0; i < girlsBuses.length; i++) {
          if (girlsBuses[i] && girlsBuses[i].capacity >= route.girls_count) {
            girlsBusId = girlsBuses[i].id;
            girlsBuses[i] = null; // Mark as used
            break;
          }
        }
      }
      
      if (boysBusId || girlsBusId) {
        db.prepare(`
          INSERT INTO assignments (route_id, boys_bus_id, girls_bus_id)
          VALUES (?, ?, ?)
        `).run(route.id, boysBusId, girlsBusId);
        
        assignments.push({
          routeId: route.id,
          boysBusId,
          girlsBusId
        });
      }
    }
    
    return assignments;
  }
}

class AudioModel {
  static getAudioForRoute(routeId) {
    const db = getDb();
    return db.prepare('SELECT * FROM audio_files WHERE route_id = ?').get(routeId);
  }

  static saveAudioForRoute(routeId, filePath) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO audio_files (route_id, file_path)
      VALUES (?, ?)
    `);
    stmt.run(routeId, filePath);
    return { filePath };
  }

  static deleteAudioForRoute(routeId) {
    const db = getDb();
    const audio = db.prepare('SELECT file_path FROM audio_files WHERE route_id = ?').get(routeId);
    
    if (audio) {
      try {
        require('fs').unlinkSync(audio.file_path);
      } catch (error) {
        console.error('Error deleting audio file:', error);
      }
    }
    
    db.prepare('DELETE FROM audio_files WHERE route_id = ?').run(routeId);
    return true;
  }
}

// Combined model for display data
class DisplayModel {
  static getDisplayData() {
    const db = getDb();
    return db.prepare(`
      SELECT 
        r.id as route_id,
        r.name as route_name,
        r.stands as route_stands,
        r.boys_count,
        r.girls_count,
        b1.number as boys_bus,
        b2.number as girls_bus,
        af.file_path as audio_path
      FROM routes r
      LEFT JOIN assignments a ON r.id = a.route_id
      LEFT JOIN buses b1 ON a.boys_bus_id = b1.id
      LEFT JOIN buses b2 ON a.girls_bus_id = b2.id
      LEFT JOIN audio_files af ON r.id = af.route_id
      ORDER BY r.name
    `).all().map(row => ({
      ...row,
      audio: row.audio_path ? { filePath: row.audio_path } : null
    }));
  }
}

// Add DataModel class for data management operations
class DataModel {
  static eraseAllData() {
    const db = getDb();
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron');

    // Start a transaction to ensure all operations succeed or fail together
    const transaction = db.transaction(() => {
      // First, get all file paths that need to be deleted
      const audioFiles = db.prepare('SELECT file_path FROM audio_files').all();
      const audioPhrases = db.prepare('SELECT file_path FROM audio_phrases').all();
      const students = db.prepare('SELECT image_path FROM students WHERE image_path IS NOT NULL').all();

      // Delete all data from all tables
      db.prepare('DELETE FROM assignments').run();
      db.prepare('DELETE FROM audio_files').run();
      db.prepare('DELETE FROM audio_phrases').run();
      db.prepare('DELETE FROM students').run();
      db.prepare('DELETE FROM buses').run();
      db.prepare('DELETE FROM routes').run();

      // Delete all associated files
      const audioDir = path.join(app.getPath('userData'), 'audio');
      const studentImagesDir = path.join(app.getPath('userData'), 'student-images');

      // Delete audio files
      audioFiles.forEach(file => {
        try {
          if (file.file_path && fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
          }
        } catch (error) {
          console.error('Error deleting audio file:', error);
        }
      });

      // Delete audio phrase files
      audioPhrases.forEach(phrase => {
        try {
          if (phrase.file_path && fs.existsSync(phrase.file_path)) {
            fs.unlinkSync(phrase.file_path);
          }
        } catch (error) {
          console.error('Error deleting audio phrase file:', error);
        }
      });

      // Delete student images
      students.forEach(student => {
        try {
          if (student.image_path && fs.existsSync(student.image_path)) {
            fs.unlinkSync(student.image_path);
          }
        } catch (error) {
          console.error('Error deleting student image:', error);
        }
      });

      // Clean up empty directories
      try {
        if (fs.existsSync(audioDir)) {
          fs.rmdirSync(audioDir, { recursive: true });
        }
        if (fs.existsSync(studentImagesDir)) {
          fs.rmdirSync(studentImagesDir, { recursive: true });
        }
      } catch (error) {
        console.error('Error cleaning up directories:', error);
      }
    });
    
    try {
      transaction();
      return true;
    } catch (error) {
      console.error('Error erasing all data:', error);
      throw error;
    }
  }
}

// Export all model methods as a single db object
const db = {
  // Route methods
  getAllRoutes: RouteModel.getAllRoutes,
  addRoute: RouteModel.addRoute,
  updateRoute: RouteModel.updateRoute,
  deleteRoute: RouteModel.deleteRoute,

  // Bus methods
  getAllBuses: BusModel.getAllBuses,
  getActiveBuses: BusModel.getActiveBuses,
  addBus: BusModel.addBus,
  updateBus: BusModel.updateBus,
  updateBusStatus: BusModel.updateBusStatus,
  deleteBus: BusModel.deleteBus,

  // Student methods
  getStudents: StudentModel.getStudents,
  addStudent: StudentModel.addStudent,
  updateStudent: StudentModel.updateStudent,
  deleteStudent: StudentModel.deleteStudent,

  // Audio phrase methods
  getAudioPhrases: AudioPhraseModel.getAudioPhrases,
  addAudioPhrase: AudioPhraseModel.addAudioPhrase,
  deleteAudioPhrase: AudioPhraseModel.deleteAudioPhrase,

  // Assignment methods
  getAssignments: AssignmentModel.getAssignments,
  saveAssignment: AssignmentModel.saveAssignment,
  deleteAssignment: AssignmentModel.deleteAssignment,
  autoAssignBuses: AssignmentModel.autoAssignBuses,

  // Audio methods
  getAudioForRoute: AudioModel.getAudioForRoute,
  saveAudioForRoute: AudioModel.saveAudioForRoute,
  deleteAudioForRoute: AudioModel.deleteAudioForRoute,

  // Display methods
  getDisplayData: DisplayModel.getDisplayData,

  // Data management methods
  eraseAllData: DataModel.eraseAllData
};

module.exports = db;