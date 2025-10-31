# Task Tracker

I built this for myself. Most productivity apps are bloated. I needed something that just works.

## What It Is

A minimalist desktop task manager. Runs on Windows. No cloud. No subscriptions. No nonsense.

Features:
- Pomodoro timer
- Task lists with categories
- Time tracking
- Habit streaks
- Everything stored locally in SQLite

Stack: React + Express + SQLite. Packaged as a standalone `.exe` using Neutralino.

## Why I Built It

Every task manager I tried was either:
1. Too complex (enterprise features I'll never use)
2. Cloud-based (my tasks aren't their business)
3. Subscription model (paying monthly for a todo list?)

I wanted something that starts in under 2 seconds, uses less than 80MB RAM, and keeps my data on my machine. So I built it.

## How to Use

### Quick Start

**Run from source:**
```bash
npm install
npm run app
```

**Build standalone executable:**
```bash
npm run build:exe
```

This creates `dist-exe/TaskTracker.exe` - double-click to launch.

### That's It

Double-click `TaskTracker.exe`. Your tasks are stored locally. No setup. No configuration.

## Technical Details

Three parts:
1. **Backend**: Express server (port 8765)
2. **Frontend**: React SPA
3. **Shell**: Neutralino window

The build creates:
```
dist-exe/
├── TaskTracker.exe    # Double-click this
├── task-tracker.exe   # UI window (auto-launched)
└── database/          # Your data (created on first run)
```

Total size: ~60MB. Self-contained.

### Build Process

```bash
# Check prerequisites
npm run check:build

# Build everything
npm run build:exe

# Result: dist-exe/ folder
# Distribute: Zip and share
```

### Development

```bash
# Install
npm install
cd src/client && npm install

# Run dev servers
npm run dev

# Build for production
npm run build
```

### Performance

- Startup: <1.5s
- Memory: <80MB
- Database queries: <50ms
- No external dependencies at runtime

## Architecture

```
src/
├── client/    # React + TypeScript + Tailwind
├── server/    # Express + SQLite
└── shared/    # Shared types
```

Clean separation. The backend is a REST API. The frontend is a static SPA. Simple.

## Philosophy

Most software tries to be everything. This does one thing: manage tasks locally with minimal friction.

No AI features. No blockchain. No social sharing. No analytics dashboards I'll never check.

Just tasks, time tracking, and data that stays on your machine.

## License

MIT. Use it. Fork it. Build your own version.

---

Built because I needed it. Shared because you might too.