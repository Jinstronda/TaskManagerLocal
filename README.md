# Local Task Tracker

A Windows-optimized desktop productivity application that combines time tracking, task management, and habit building. Built with React frontend and Express.js backend, running entirely on localhost for maximum performance and privacy.

## Features

- **Focus Timer**: Pomodoro-style timer with customizable session types
- **Task Management**: Organize tasks by categories with time tracking
- **Habit Building**: Daily streaks and weekly goals
- **Analytics**: Detailed productivity insights and patterns
- **Local Storage**: All data stored locally in SQLite database
- **Windows Integration**: System tray, notifications, and auto-start

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   npm install
   cd src/client && npm install
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```
   This starts both the Express server (localhost:3001) and React dev server (localhost:3000).

3. **Run tests**:
   ```bash
   npm test
   ```

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Create executable**:
   ```bash
   npm run package
   ```
   This creates a single executable file in the `dist/` directory.

3. **Install as Windows service** (optional):
   ```bash
   npm run install:service
   ```

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Zustand
- **Backend**: Express.js + TypeScript + better-sqlite3
- **Database**: SQLite with optimized indexes
- **Packaging**: pkg for single executable creation
- **Windows Integration**: node-windows for service management

## Performance Targets

- Startup time: < 1.5 seconds
- Memory usage: < 80MB RAM
- Database queries: < 50ms response time
- Timer accuracy: ±500ms
- UI responsiveness: 60fps

## Project Structure

```
src/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── utils/
│   └── package.json
├── server/          # Express.js backend
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
└── shared/          # Shared TypeScript types
```

## Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write unit tests for core functionality
- Optimize for Windows performance
- Maintain WCAG 2.1 AA accessibility standards

## License

MIT License - see LICENSE file for details.