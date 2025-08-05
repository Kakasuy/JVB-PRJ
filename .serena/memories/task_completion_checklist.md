# Task Completion Checklist

## Before Committing Code

### 1. Code Quality Checks
```bash
# Lint the code
npm run lint

# Format code (manual - no script available)
npx prettier --write .

# Type check (manual - no script available)
npx tsc --noEmit
```

### 2. Build Verification
```bash
# Test production build
npm run build

# Verify build succeeded without errors
# Check for TypeScript errors, missing dependencies, etc.
```

### 3. Visual Testing
```bash
# Start development server
npm run dev

# Manual testing checklist:
# - Test responsive design (mobile, tablet, desktop)
# - Verify dark/light theme switching
# - Test search functionality
# - Check API integrations (if modified)
# - Verify navigation and routing
```

## Specific Feature Testing

### For Search/Booking Features
- [ ] Test location search functionality
- [ ] Verify date picker interactions
- [ ] Check guest selection
- [ ] Test filtering and sorting
- [ ] Verify map integration (if applicable)

### For API Changes
- [ ] Test API endpoints manually or with tools
- [ ] Verify Amadeus API integration
- [ ] Check error handling
- [ ] Test rate limiting behavior

### For UI Components
- [ ] Test component in isolation
- [ ] Verify accessibility (keyboard navigation, screen readers)
- [ ] Test with different data scenarios
- [ ] Check mobile responsiveness

## Performance Considerations
- [ ] Check for console errors/warnings
- [ ] Verify image optimization
- [ ] Test loading states
- [ ] Check for memory leaks in interactive components

## Pre-Deployment Checklist
1. **All tests pass** (manual since no automated tests)
2. **Build succeeds** without warnings
3. **Code is formatted** and linted
4. **No TypeScript errors**
5. **Environment variables** are properly configured
6. **API keys and secrets** are not exposed in code

## Common Issues to Check
- Ensure all imports are correctly typed
- Verify Next.js dynamic imports are handled properly
- Check that all environment variables are used correctly
- Ensure proper error boundaries for API calls
- Verify that all images have proper alt tags and optimization

## Documentation Updates
If the change affects:
- [ ] Update API documentation if endpoints changed
- [ ] Update component documentation if public interface changed
- [ ] Update README if setup/deployment process changed