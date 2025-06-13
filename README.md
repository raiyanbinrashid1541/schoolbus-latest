# School Bus Management

An Electron-based desktop application for managing school bus operations.

## Features

- Student management
- Database integration with SQLite
- Audio Management
## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/raiyanbinrashid1541/schoolbus-latest.git
   cd schoolbus-latest
   npm i
   npm rebuild better-sqlite3 --runtime=electron --target=<electron-version> --dist-url=https://electronjs.org/headers
   rm -rf node_modules
   npm install
   npm install -g electron-rebuild
   npx electron-rebuild
   npx electron --version
   npm cache clean --force
   ```
2. Start the application:
   ```bash
      npm start
      ```

