# Project Structure

## Root Directory Layout
```
├── src/                    # Source code
│   ├── client/            # React frontend application
│   ├── server/            # Express.js backend application
│   └── shared/            # Shared TypeScript types and utilities
├── database/              # SQLite database files
├── dist/                  # Compiled output and executables
├── logs/                  # Application log files
├── node_modules/          # Dependencies
└── .kiro/                 # Kiro IDE configuration and specs
```

## Frontend Structure (`src/client/`)
```
src/client/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Analytics/     # Analytics and reporting components
│   │   ├── Category/      # Category management components
│   │   ├── Timer/         # Timer and session components
│   │   └── Layout.tsx     # Main application layout
│   ├── pages/             # Top-level page components
│   │   ├── Dashboard.tsx  # Main dashboard view
│   │   ├── Analytics.tsx  # Analytics page
│   │   └── Settings.tsx   # Settings page
│   ├── stores/            # Zustand state management
│   │   ├── timerStore.ts  # Timer state and actions
│   │   ├── categoryStore.ts # Category management
│   │   └── analyticsStore.ts # Analytics data
│   ├── services/          # API communication and business logic
│   ├── hooks/             # Custom React hooks
│   ├── __tests__/         # Component and unit tests
│   └── utils/             # Utility functions
├── package.json           # Frontend dependencies
└── tailwind.config.js     # Tailwind CSS configuration
```

## Backend Structure (`src/server/`)
```
src/server/
├── database/              # Database layer
│   ├── repositories/      # Data access layer (Repository pattern)
│   │   ├── BaseRepository.ts     # Base repository with common operations
│   │   ├── SessionRepository.ts  # Session data operations
│   │   ├── TaskRepository.ts     # Task data operations
│   │   ├── CategoryRepository.ts # Category data operations
│   │   └── DailyStatsRepository.ts # Analytics data operations
│   └── DatabaseManager.ts # Database connection and initialization
├── routes/                # Express.js route handlers
│   ├── timerRoutes.ts     # Timer and session endpoints
│   ├── categoryRoutes.ts  # Category management endpoints
│   └── analyticsRoutes.ts # Analytics and reporting endpoints
├── services/              # Business logic and external integrations
│   ├── BackgroundTimerService.ts # Timer background processing
│   ├── SystemTrayService.ts      # Windows system tray integration
│   └── NotificationService.ts    # Windows notifications
├── middleware/            # Express middleware
│   └── errorHandler.ts    # Global error handling
├── utils/                 # Utility functions
│   └── logger.ts          # Logging configuration
├── __tests__/             # Server-side tests
└── index.ts               # Application entry point
```

## Shared Code (`src/shared/`)
- `types.ts` - TypeScript interfaces and types used by both client and server
- Ensures type safety across the full stack
- Includes API response types, data models, and form interfaces

## Key Architectural Patterns

### Repository Pattern
- All database operations go through repository classes
- `BaseRepository` provides common CRUD operations
- Specific repositories extend base for domain-specific logic
- Promotes separation of concerns and testability

### Store Pattern (Frontend)
- Zustand stores manage client-side state
- Each domain (timer, categories, analytics) has its own store
- Stores handle both state and actions for their domain

### Service Layer
- Business logic separated into service classes
- Services handle complex operations and external integrations
- Clean separation between routes (HTTP) and business logic

## File Naming Conventions
- **Components**: PascalCase (e.g., `TimerComponent.tsx`)
- **Stores**: camelCase with "Store" suffix (e.g., `timerStore.ts`)
- **Services**: PascalCase with "Service" suffix (e.g., `TimerService.ts`)
- **Repositories**: PascalCase with "Repository" suffix (e.g., `TaskRepository.ts`)
- **Routes**: camelCase with "Routes" suffix (e.g., `timerRoutes.ts`)
- **Tests**: Match source file with `.test.ts` or `.test.tsx` extension

## Import Organization
1. External libraries (React, Express, etc.)
2. Internal shared types from `src/shared/`
3. Local imports (relative paths)
4. Type-only imports should use `import type` syntax