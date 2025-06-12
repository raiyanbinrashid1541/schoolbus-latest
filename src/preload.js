const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Route Management
  getRoutes: () => ipcRenderer.invoke('get-routes'),
  addRoute: (routeData) => ipcRenderer.invoke('add-route', routeData),
  deleteRoute: (id) => ipcRenderer.invoke('delete-route', id),
  updateRoute: (id, field, value) => ipcRenderer.invoke('update-route', id, field, value),
  
  // Bus Management
  getBuses: () => ipcRenderer.invoke('get-buses'),
  getActiveBuses: () => ipcRenderer.invoke('get-active-buses'),
  addBus: (busData) => ipcRenderer.invoke('add-bus', busData),
  deleteBus: (id) => ipcRenderer.invoke('delete-bus', id),
  updateBus: (id, field, value) => ipcRenderer.invoke('update-bus', id, field, value),
  updateBusStatus: (id, isActive) => ipcRenderer.invoke('update-bus-status', id, isActive),
  
  // Student Management
  getStudents: (searchTerm, shift) => ipcRenderer.invoke('get-students', searchTerm, shift),
  addStudent: (studentData) => ipcRenderer.invoke('add-student', studentData),
  updateStudent: (id, field, value) => ipcRenderer.invoke('update-student', id, field, value),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  
  // Audio Management
  getAudioForRoute: (routeId) => ipcRenderer.invoke('get-audio-for-route', routeId),
  saveAudioForRoute: (audioData) => ipcRenderer.invoke('save-audio-for-route', audioData),
  deleteAudioForRoute: (routeId) => ipcRenderer.invoke('delete-audio-for-route', routeId),
  getAudioPhrases: () => ipcRenderer.invoke('get-audio-phrases'),
  addAudioPhrase: (phraseData) => ipcRenderer.invoke('add-audio-phrase', phraseData),
  deleteAudioPhrase: (id) => ipcRenderer.invoke('delete-audio-phrase', id),
  getAllAudioFiles: () => ipcRenderer.invoke('get-all-audio-files'),
  
  // Data Management
  eraseAllData: () => ipcRenderer.invoke('erase-all-data'),
  exportData: (type) => ipcRenderer.invoke('export-data', type),
  importData: (data) => ipcRenderer.invoke('import-data', data),
  
  // Window Management
  openDisplayWindow: () => ipcRenderer.invoke('open-display-window'),
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
  closeSettingsWindow: () => ipcRenderer.invoke('close-settings-window'),
  
  // Print Functionality
  printDocument: () => ipcRenderer.invoke('print-document'),
  
  // Display Data
  getDisplayData: () => ipcRenderer.invoke('get-display-data')
});