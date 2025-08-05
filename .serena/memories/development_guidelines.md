# Development Guidelines

## Design Patterns & Architecture

### Component Patterns
- **Compound Components**: Used extensively for complex UI (e.g., HeroSearchForm with multiple field components)
- **Render Props**: Used in some cases for flexible component composition
- **Higher-Order Components**: Minimal usage, prefer hooks and composition
- **Custom Hooks**: Preferred for shared logic (see `/hooks` directory)

### State Management
- **React State**: Primary state management with useState/useReducer
- **Context API**: Used for theme management (dark/light mode)
- **Server State**: Managed through Next.js API routes and data fetching
- **No Global State Library**: No Redux, Zustand, or similar libraries detected

### Styling Approach
- **Tailwind-First**: All styling done with Tailwind utility classes
- **Component Variants**: Use `clsx` for conditional styling
- **Dark Mode**: Comprehensive dark mode support with `dark:` prefixes
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## API Integration Guidelines

### Amadeus Hotel API
- **Two-step process**: 
  1. Hotel List API (`/v1/reference-data/locations/hotels/by-city`)
  2. Hotel Offers API (`/v3/shopping/hotel-offers`)
- **Rate limiting**: ~10-15 requests/minute for test API
- **Error handling**: Implement proper fallbacks for API failures
- **Caching**: Consider implementing response caching for performance

### Location Services
- **Google Maps Integration**: Used for location display and search
- **Location Search API**: Custom endpoint for location autocomplete

## Performance Guidelines

### Image Optimization
- **Next.js Image Component**: Use `next/image` for all images
- **Remote Patterns**: Configured for external image sources (Pexels, Unsplash, etc.)
- **Cache TTL**: Set to 3 months for static images

### Code Splitting
- **Dynamic Imports**: Use for large components that aren't immediately needed
- **Route-based Splitting**: Automatic with Next.js App Router
- **Component Lazy Loading**: Implement for heavy components

### Bundle Optimization
- **Tree Shaking**: Ensure proper ES module imports
- **Bundle Analysis**: Regularly check bundle size
- **Third-party Libraries**: Audit and minimize external dependencies

## Accessibility Guidelines

### Required Standards
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meet WCAG AA standards for text contrast
- **Focus Management**: Visible focus indicators and logical tab order

### Component Requirements
- **Form Controls**: Proper labels and error messaging
- **Interactive Elements**: Clear purpose and state indication
- **Media Content**: Alt text for images, captions for videos
- **Navigation**: Clear hierarchy and breadcrumbs

## Security Considerations

### API Security
- **Environment Variables**: Never expose API keys in client-side code
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Implement on API routes
- **CORS**: Properly configure for production

### Data Protection
- **User Data**: Minimize collection and storage
- **Sensitive Information**: Never log or expose in errors
- **Third-party Services**: Audit data sharing with external APIs

## Testing Strategy

### Manual Testing (No Automated Tests Currently)
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Device Testing**: Mobile, tablet, desktop viewports
- **Accessibility Testing**: Screen reader and keyboard navigation
- **API Testing**: Manual verification of all endpoints

### Recommended Automated Testing (Future)
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright or Cypress for critical user flows
- **Accessibility Tests**: axe-core integration

## Code Review Guidelines

### What to Review
- **TypeScript Typing**: Proper types and interfaces
- **Component Structure**: Reusability and maintainability
- **Performance**: Unnecessary re-renders and heavy operations
- **Accessibility**: ARIA compliance and keyboard navigation
- **Security**: Input validation and data exposure

### Review Checklist
- [ ] Code follows established patterns
- [ ] Proper TypeScript usage
- [ ] No console.log statements in production code
- [ ] Accessibility standards met
- [ ] Mobile-responsive design
- [ ] Error handling implemented
- [ ] Performance considerations addressed