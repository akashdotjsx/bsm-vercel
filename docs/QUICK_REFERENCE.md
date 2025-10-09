# 📚 Quick Reference Card

## 🎯 Where to Find What

### Getting Started
- **Main Index** → `docs/README.md` ⭐
- **Organization Summary** → `docs/ORGANIZATION.md`
- **This Reference** → `docs/QUICK_REFERENCE.md`

### GraphQL Development
```bash
docs/graphql/
├── QUICKSTART.md          # Start here for GraphQL
├── README.md              # Main GraphQL documentation
├── MUTATIONS.md           # All GraphQL mutations
├── TESTS_QUICKSTART.md    # Testing guide
└── PAGES_CONVERTED.md     # Migration tracking
```

### Theme Customization
```bash
docs/theme/
├── README.md                   # ⭐ Theme system overview
├── IMPLEMENTATION_GUIDE.md     # Step-by-step guide
├── STATUS_SUMMARY.md           # Current status
├── ANALYSIS.md                 # Theme decisions
└── DESIGN_SYSTEM_ANALYSIS.md   # Design system
```

### Component Development
```bash
docs/components/
├── main-components/       # All UI components
│   ├── README.md
│   ├── buttons.md
│   ├── cards.md
│   ├── inputs.md
│   └── ...24 more files
└── typography-README.md
```

### Migration & Guides
```bash
docs/migration/            # Migration guides
docs/guides/              # Implementation guides
docs/archived/            # Historical documents
```

---

## 🚀 Common Tasks

### Start Development
```bash
npm run dev
# Visit http://localhost:3000
```

### View Theme Test Page
```bash
# Navigate to: http://localhost:3000/theme-test
```

### Migrate Font Sizes
```bash
./scripts/migrate-font-sizes.sh --dry-run
./scripts/migrate-font-sizes.sh --backup
```

### View Documentation
```bash
open docs/README.md
open docs/graphql/QUICKSTART.md
open docs/theme/IMPLEMENTATION_GUIDE.md
```

---

## 📊 Documentation Stats

- **Total Documentation Files**: 55 markdown files
- **Root Directory**: Clean (only WARP.md)
- **Organized Categories**: 6 main categories
- **Component Docs**: 24 component guides
- **Archived**: 11 historical documents

---

## 🔍 Search Documentation

### Find by Topic
```bash
# Search all docs
grep -r "search term" docs/

# Search specific category
grep -r "GraphQL" docs/graphql/
grep -r "theme" docs/theme/
```

### List All Docs
```bash
# All markdown files
find docs -name "*.md" | sort

# By category
find docs/graphql -name "*.md"
find docs/theme -name "*.md"
find docs/components -name "*.md"
```

---

## 📝 Contributing Docs

When adding new documentation:

1. **Choose Category**
   - GraphQL → `docs/graphql/`
   - Theme → `docs/theme/`
   - Components → `docs/components/`
   - Migration → `docs/migration/`
   - General → `docs/guides/`
   - Old/Done → `docs/archived/`

2. **Update Index**
   - Add link to `docs/README.md`

3. **Follow Conventions**
   - Use clear, descriptive names
   - Use `.md` extension
   - Include examples and code snippets

---

## 🆘 Getting Help

### GraphQL Issues
→ `docs/graphql/README.md`

### Styling/Theme Issues
→ `docs/theme/IMPLEMENTATION_GUIDE.md`

### Component Questions
→ `docs/components/main-components/README.md`

### Authentication Setup
→ `docs/guides/AUTH_SETUP.md`

### Caching Questions
→ `docs/CACHING_GUIDE.md`

---

**Last Updated**: January 2025  
**Organization Status**: ✅ Production Ready
