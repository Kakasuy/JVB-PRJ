# Codebase Structure

## Root Directory
```
├── .serena/                 # Serena configuration
├── public/                  # Static assets
├── src/                     # Source code
├── .env.local.example       # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Git ignore rules
├── AMADEUS_HOTEL_API_DOCUMENTATION.md  # API documentation
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── prettier.config.mjs     # Prettier configuration
└── tsconfig.json           # TypeScript configuration
```

## Source Directory Structure (`src/`)

### App Directory (Next.js App Router)
```
src/app/
├── (account)/              # Account-related pages (grouped route)
│   ├── account/            # Main account page
│   ├── account-billing/    # Billing settings
│   ├── account-password/   # Password management
│   └── account-savelists/  # Saved listings
├── (app)/                  # Main application pages
│   ├── (categories)/       # Category pages for different booking types
│   │   ├── (car)/         # Car rental categories
│   │   ├── (experience)/  # Experience categories
│   │   ├── (flight)/      # Flight categories
│   │   ├── (real-estate)/ # Real estate categories
│   │   └── (stay)/        # Stay/hotel categories
│   ├── (home-pages)/      # Different home page variants
│   ├── (listings)/        # Individual listing detail pages
│   └── (other-pages)/     # Additional pages (about, contact, etc.)
├── (auth)/                # Authentication pages
│   ├── login/
│   ├── signup/
│   └── forgot-password/
├── api/                   # API routes
│   ├── hello/            # Test API
│   ├── hotels-search/    # Amadeus hotel search
│   ├── location-search/  # Location search
│   └── test-amadeus/     # Amadeus API testing
└── layout.tsx            # Root layout
```

### Components Directory
```
src/components/
├── aside/                 # Sidebar components
├── blog/                  # Blog-related components
├── Header/                # Header and navigation
│   └── Navigation/        # Navigation components
├── hero-sections/         # Hero section variants
├── HeroSearchForm/        # Main search form components
│   └── ui/               # Search form UI components
└── HeroSearchFormMobile/  # Mobile search forms
    ├── car-search-form/
    ├── experience-search-form/
    ├── flight-search-form/
    ├── real-estate-search-form/
    └── stay-search-form/
```

### Shared Components
```
src/shared/
├── Avatar.tsx
├── Button.tsx, ButtonPrimary.tsx, etc.
├── Input.tsx, Select.tsx, Checkbox.tsx
├── Modal components (NcModal.tsx)
├── Navigation components
└── UI primitives (Badge, Heading, etc.)
```

### Data & Configuration
```
src/
├── contains/              # Constants and configuration
├── data/                  # Static data and type definitions
│   ├── authors.ts
│   ├── categories.ts
│   ├── listings.ts
│   ├── navigation.ts
│   └── types.ts
├── hooks/                 # Custom React hooks
├── images/                # Image assets (organized by category)
├── routers/               # Routing configuration
├── styles/                # Global styles
└── utils/                 # Utility functions
```

## Key Architecture Patterns

### Next.js App Router
- **Route groups** with `()` for organization without affecting URL structure
- **Dynamic routes** with `[handle]` for listing details
- **Catch-all routes** with `[[...handle]]` for category filtering
- **Layout files** for shared UI between routes

### Component Organization
- **Feature-based** organization in `/components`
- **Shared/reusable** components in `/shared`
- **Page-specific** components co-located with pages
- **Form components** grouped by functionality (search forms)

### Data Layer
- **Static data** in `/data` directory
- **API integration** in `/app/api` routes
- **Type definitions** centralized in `types.ts`
- **Custom hooks** for data fetching and state management