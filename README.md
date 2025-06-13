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
# Clone the project repository
git clone https://github.com/raiyanbinrashid1541/schoolbus-latest.git
cd schoolbus-latest

# Install project dependencies
npm install

# Install electron-rebuild as a development dependency
npm install --save-dev electron-rebuild

# Rebuild native modules (e.g., better-sqlite3) for Electron compatibility
npx electron-rebuild

# (Optional) Check Electron version
npx electron --version

# Run the Electron app
npx electron .

# Start the application
npm start
