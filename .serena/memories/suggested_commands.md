# Suggested Commands

## Development Commands

### Primary Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Quality (Manual - not in package.json)
Since the project uses Prettier but doesn't have format scripts:

```bash
# Format code with Prettier (manual)
npx prettier --write .

# Type check (manual)
npx tsc --noEmit
```

## Windows System Commands
Since this is a Windows environment:

### File Operations
```cmd
# List files
dir

# Change directory
cd <path>

# Find files
where <filename>

# Search in files (Windows equivalent of grep)
findstr /s /i "search_term" *.ts *.tsx
```

### Git Operations
```bash
# Standard git commands work on Windows
git status
git add .
git commit -m "message"
git push
git pull
```

## Project-Specific Workflows

### After Making Changes
1. **Lint**: `npm run lint`
2. **Format**: `npx prettier --write .` (manual)
3. **Type check**: `npx tsc --noEmit` (manual)
4. **Test build**: `npm run build`

### API Development
The project has API routes in `src/app/api/`:
- Test Amadeus integration: `GET /api/test-amadeus`
- Hotel search: `GET /api/hotels-search`
- Location search: `GET /api/location-search`

### Development Server
- Runs on `http://localhost:3000` by default
- Hot reload enabled
- TypeScript checking in development

## Important Notes
- **No test scripts** configured in package.json
- **No format script** - formatting must be done manually with Prettier
- **ReactStrictMode disabled** in next.config.mjs
- **No pre-commit hooks** configured