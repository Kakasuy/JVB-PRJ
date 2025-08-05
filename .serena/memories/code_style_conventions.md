# Code Style & Conventions

## Prettier Configuration
```javascript
{
  semi: false,                    // No semicolons
  singleQuote: true,             // Single quotes
  printWidth: 120,               // Line width 120 characters
  trailingComma: 'es5',          // Trailing commas where valid
  tailwindFunctions: ['clsx', 'tw'], // Tailwind function names
  plugins: [
    'prettier-plugin-organize-imports',    // Auto-organize imports
    'prettier-plugin-tailwindcss'         // Sort Tailwind classes
  ]
}
```

## ESLint Rules
- Extends `next/core-web-vitals`
- Custom rule: `@next/next/no-img-element: off` (allows <img> tags)

## TypeScript Configuration
- **Strict mode enabled**
- **Modern module resolution** (bundler)
- **Path aliases**: `@/*` maps to `./src/*`
- **Target**: ES2017
- **JSX**: preserve (handled by Next.js)

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `HeroSearchForm.tsx`)
- **Pages**: lowercase with hyphens (e.g., `stay-categories`)
- **Utilities**: camelCase (e.g., `convertNumbThousand.ts`)
- **Types**: camelCase (e.g., `types.ts`)

### Code Conventions
- **Components**: PascalCase exports
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE in constants files
- **Types**: PascalCase for interfaces/types
- **CSS Classes**: Tailwind utility classes

## Import Organization
```typescript
// 1. Next.js/React imports
import { Metadata } from 'next'
import React from 'react'

// 2. Third-party libraries
import clsx from 'clsx'

// 3. Internal components (absolute paths with @/)
import HeroSearchForm from '@/components/HeroSearchForm/HeroSearchForm'
import ButtonPrimary from '@/shared/ButtonPrimary'

// 4. Data/utils
import { getStayListings } from '@/data/listings'

// 5. Images/assets
import heroImage from '@/images/hero-right.png'
```

## Component Structure
- **Async components** for pages that fetch data
- **Metadata exports** for SEO
- **Proper TypeScript typing** for props
- **Shared components** in `/shared` directory
- **Feature-specific components** in `/components`

## Styling Approach
- **Tailwind-first** styling
- **Dark mode support** with `dark:` prefix
- **Responsive design** with mobile-first breakpoints
- **Component variants** using clsx for conditional classes
- **CSS modules** avoided in favor of Tailwind