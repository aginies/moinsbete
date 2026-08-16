# MoinsBete Testing Plan

## 1. Unit Test Strategy

### 1.1 Test Categories

| Category | Description | Coverage Target |
|----------|-------------|-----------------|
| Core Logic | Bookmark operations, auth, utilities | 90% |
| Error Handling | Invalid IDs, nulls, edge cases | 85% |
| Data Validation | Schema validation, type checking | 85% |
| Performance | Hotspots, memory, timing | 80% |
| External Dependencies | Mocking, stubbing | 90% |

### 1.2 Tools

- **Jest / Vitest** – Core testing framework
- **Mockito / Jest.mock** – Dependency mocking
- **Nyc / Istanbul** – Code coverage
- **Performance testing tools** – Profiling, benchmarking

### 1.3 Test Structure

```diff
src/
├── tests/
│   ├── actions/
│   │   ├── bookmark-actions.test.ts
│   │   ├── card-actions.test.ts
│   │   └── ...
│   ├── components/
│   │   ├── feed/
│   │   │   ├── card.test.tsx
│   │   │   ├── navbar.test.tsx
│   │   │   └── ...
│   │   └── ...
│   ├── lib/
│   │   ├── bookmark-manager.test.ts
│   │   └── ip.test.ts
│   ├── api/
│   │   ├── card-visibility.test.ts
│   │   └── ...
│   └── utils/
│       └── ...
├── tests/setup.ts
└── tests/cleanup.ts
```