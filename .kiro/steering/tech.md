# Technology Stack

## Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript + Node.js
- **Database**: SQLite with better-sqlite3 driver
- **State Management**: Zustand for client-side state
- **Styling**: Tailwind CSS + Lucide React icons
- **Packaging**: pkg for single executable creation
- **Windows Integration**: node-windows for service management

## Key Libraries & Dependencies

### Backend
- `express` - Web framework
- `sqlite3` - Database driver
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware
- `compression` - Response compression
- `morgan` - HTTP request logger
- `express-rate-limit` - Rate limiting

### Frontend
- `react` + `react-dom` - UI framework
- `react-router-dom` - Client-side routing
- `zustand` - State management
- `dayjs` - Date manipulation
- `recharts` - Data visualization
- `react-hot-toast` - Notifications
- `clsx` - Conditional CSS classes

### Development
- `typescript` - Type safety
- `jest` - Testing framework
- `nodemon` - Development server
- `concurrently` - Run multiple commands
- `eslint` + `prettier` - Code quality

## Common Commands

### Development
```bash
# Install all dependencies (root + client)
npm install
cd src/client && npm install

# Start development servers (both backend and frontend)
npm run dev

# Start only backend server
npm run server:dev

# Start only frontend server
npm run client:dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking (client)
cd src/client && npm run type-check
```

### Building & Packaging
```bash
# Build both server and client
npm run build

# Build only server
npm run build:server

# Build only client
npm run build:client

# Create Windows executable
npm run package

# Start production server
npm start
```

### Windows Service Management
```bash
# Install as Windows service
npm run install:service

# Uninstall Windows service
npm run uninstall:service
```

## TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- ES2020 target for modern JavaScript features
- CommonJS modules for Node.js compatibility
- Source maps and declarations generated for debugging
- Separate tsconfig for server (`tsconfig.server.json`)

## Development Standards
- Follow TypeScript strict mode requirements
- Use ESLint and Prettier for consistent formatting
- Write unit tests for core functionality
- Optimize for Windows performance characteristics
- Maintain WCAG 2.1 AA accessibility standards