const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./database/db');
delete require.cache[require.resolve('./models')];
const db = require('./models');

let mainWindow;
let displayWindow;
let settingsWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, '../renderer/assets/bcpsc.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open dev tools if in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  Database.initialize();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Communication

// Route Management
ipcMain.handle('get-routes', async () => {
  return db.getAllRoutes();
});

ipcMain.handle('add-route', async (event, { name, stands, boysCount, girlsCount }) => {
  return db.addRoute(name, stands, boysCount, girlsCount);
});

ipcMain.handle('delete-route', async (event, id) => {
  return db.deleteRoute(id);
});

// Bus Management
ipcMain.handle('get-buses', async () => {
  return db.getAllBuses();
});

ipcMain.handle('get-active-buses', async () => {
  return db.getActiveBuses();
});

ipcMain.handle('add-bus', async (event, { number, capacity, type }) => {
  return db.addBus(number, capacity, type);
});

ipcMain.handle('delete-bus', async (event, id) => {
  return db.deleteBus(id);
});

ipcMain.handle('update-bus-status', async (event, id, isActive) => {
  return db.updateBusStatus(id, isActive);
});

// Assignment Management
ipcMain.handle('get-assignments', async () => {
  return db.getAssignments();
});

ipcMain.handle('save-assignment', async (event, { routeId, boysBusId, girlsBusId }) => {
  return db.saveAssignment(routeId, boysBusId, girlsBusId);
});

ipcMain.handle('delete-assignment', async (event, id) => {
  return db.deleteAssignment(id);
});

ipcMain.handle('auto-assign', async () => {
  return db.autoAssignBuses();
});

// Audio Management
ipcMain.handle('get-audio-for-route', async (event, routeId) => {
  try {
    return db.getAudioForRoute(routeId);
  } catch (error) {
    console.error('Error getting audio for route:', error);
    throw error;
  }
});

ipcMain.handle('save-audio-for-route', async (event, { routeId, audioData, fileName }) => {
  try {
    const audioDir = path.join(app.getPath('userData'), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const filePath = path.join(audioDir, `${routeId}_${Date.now()}${path.extname(fileName)}`);
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(audioData);
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    // Save to database
    return db.saveAudioForRoute(routeId, filePath);
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw error;
  }
});

ipcMain.handle('delete-audio-for-route', async (event, routeId) => {
  try {
    return db.deleteAudioForRoute(routeId);
  } catch (error) {
    console.error('Error deleting audio for route:', error);
    throw error;
  }
});

// Window Management
ipcMain.handle('open-display-window', () => {
  if (displayWindow) {
    displayWindow.focus();
    return;
  }

  displayWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true
    },
    icon: path.join(__dirname, '../renderer/assets/bcpsc.png'),
    fullscreenable: true,
    autoHideMenuBar: true
  });

  displayWindow.loadFile(path.join(__dirname, '../renderer/display.html'));

  displayWindow.on('closed', () => {
    displayWindow = null;
  });
});

ipcMain.handle('open-settings-window', () => {
  try {
    if (settingsWindow) {
      settingsWindow.focus();
      return true;
    }

    settingsWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      icon: path.join(__dirname, '../renderer/assets/bcpsc.png'),
      show: false
    });

    settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));

    settingsWindow.once('ready-to-show', () => {
      settingsWindow.show();
    });

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });

    return true;
  } catch (error) {
    console.error('Error creating settings window:', error);
    throw error;
  }
});

ipcMain.handle('close-settings-window', () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

// Print Functionality
ipcMain.handle('print-document', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.webContents.print({ silent: false, printBackground: true });
});

// Get display data
ipcMain.handle('get-display-data', async () => {
  return db.getDisplayData();
});

// Student Management
ipcMain.handle('get-students', async (event, searchTerm = '', shift = 'morning') => {
  try {
    const students = await db.getStudents(searchTerm, shift);
    return students.map(student => ({
      ...student,
      image_path: student.image_path ? `file://${student.image_path}` : null
    }));
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
});

ipcMain.handle('add-student', async (event, studentData) => {
  try {
    const imagesDir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    let imagePath = null;
    if (studentData.image) {
      const fileName = `${Date.now()}_${studentData.imageName}`;
      imagePath = path.join(imagesDir, fileName);
      fs.writeFileSync(imagePath, Buffer.from(studentData.image));
    }

    const studentId = await db.addStudent({
      ...studentData,
      image_path: imagePath
    });

    return studentId;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
});

ipcMain.handle('update-student', async (event, id, field, value) => {
  return db.updateStudent(id, field, value);
});

ipcMain.handle('delete-student', async (event, id) => {
  return db.deleteStudent(id);
});

// Audio Phrase Management
ipcMain.handle('get-audio-phrases', async () => {
  return db.getAudioPhrases();
});

ipcMain.handle('add-audio-phrase', async (event, phraseData) => {
  return db.addAudioPhrase(phraseData);
});

ipcMain.handle('delete-audio-phrase', async (event, id) => {
  return db.deleteAudioPhrase(id);
});

// Data Management
ipcMain.handle('erase-all-data', async () => {
  return db.eraseAllData();
});

ipcMain.handle('export-data', async (event, type) => {
  return db.exportData(type);
});

ipcMain.handle('import-data', async (event, data) => {
  return db.importData(data);
});

// Audio List Modal
ipcMain.handle('get-all-audio-files', async () => {
  try {
    const audioDir = path.join(app.getPath('userData'), 'audio');
    if (!fs.existsSync(audioDir)) {
      return [];
    }

    const files = fs.readdirSync(audioDir);
    const audioFiles = [];

    for (const file of files) {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      audioFiles.push({
        name: file,
        path: `file://${filePath}`,
        size: stats.size,
        date: stats.mtime
      });
    }

    return audioFiles;
  } catch (error) {
    console.error('Error getting audio files:', error);
    throw error;
  }
});