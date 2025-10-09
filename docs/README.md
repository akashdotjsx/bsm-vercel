# Kroolo BSM Documentation

Welcome to the Kroolo Business Success Management documentation. This directory contains all project documentation organized by topic.

> 📌 **Quick Links**: [Quick Reference Card](./QUICK_REFERENCE.md) | [Organization Summary](./ORGANIZATION.md) | [Caching Guide](./CACHING_GUIDE.md)

## 📚 Documentation Structure

### 🔷 GraphQL (`/graphql`)
Documentation for GraphQL implementation and usage:
- **[QUICKSTART.md](./graphql/QUICKSTART.md)** - Quick start guide for GraphQL
- **[README.md](./graphql/README.md)** - Main GraphQL documentation
- **[MUTATIONS.md](./graphql/MUTATIONS.md)** - GraphQL mutations reference
- **[TESTS_QUICKSTART.md](./graphql/TESTS_QUICKSTART.md)** - Testing guide for GraphQL
- **[PAGES_CONVERTED.md](./graphql/PAGES_CONVERTED.md)** - List of pages converted to GraphQL

### 🎨 Theme System (`/theme`)
Documentation for the centralized theme system:
- **[README.md](./theme/README.md)** - ⭐ Main theme system overview
- **[IMPLEMENTATION_GUIDE.md](./theme/IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation guide
- **[STATUS_SUMMARY.md](./theme/STATUS_SUMMARY.md)** - Current theme implementation status
- **[ANALYSIS.md](./theme/ANALYSIS.md)** - Theme analysis and decisions
- **[DESIGN_SYSTEM_ANALYSIS.md](./theme/DESIGN_SYSTEM_ANALYSIS.md)** - Design system analysis

### 🧩 Components (`/components`)
Component documentation and examples:
- **[main-components/](./components/main-components/)** - Main UI component documentation
  - Accordions, Action Menus, Avatars, Badges, Buttons, Cards, Checkboxes
  - Dialogs/Modals, Dropdowns, Inputs, Navbar, Popovers, Profile Menu
  - Progress, Scroll Area, Switches, Tables, Tabs, Toasts, Tooltips
- **[typography-README.md](./components/typography-README.md)** - Typography component guide

### 🔄 Migration (`/migration`)
Migration guides and historical records:
- **[GRAPHQL_MIGRATION.md](./migration/GRAPHQL_MIGRATION.md)** - GraphQL migration guide
- **[REST_TO_GRAPHQL_SUMMARY.md](./migration/REST_TO_GRAPHQL_SUMMARY.md)** - REST to GraphQL migration summary
- **[LAYOUT_MIGRATION_GUIDE.md](./migration/LAYOUT_MIGRATION_GUIDE.md)** - Layout migration guide

### 📖 Guides (`/guides`)
General implementation guides:
- **[AUTH_SETUP.md](./guides/AUTH_SETUP.md)** - Authentication setup guide
- **[NAVIGATION_IMPROVEMENTS.md](./guides/NAVIGATION_IMPROVEMENTS.md)** - Navigation improvements
- **[PERSISTENT_LAYOUT_IMPLEMENTATION.md](./guides/PERSISTENT_LAYOUT_IMPLEMENTATION.md)** - Persistent layout guide
- **[SIDEBAR_NAVIGATION_VERIFIED.md](./guides/SIDEBAR_NAVIGATION_VERIFIED.md)** - Sidebar navigation verification
- **[CACHING_GUIDE.md](./CACHING_GUIDE.md)** - Caching strategy guide

### 📦 Archived (`/archived`)
Completed migration docs and historical records (for reference only)

---

## 🚀 Quick Start

### For New Developers
1. Start with [GraphQL Quickstart](./graphql/QUICKSTART.md)
2. Review [Theme System README](./theme/README.md)
3. Explore [Component Documentation](./components/main-components/)

### For Theme Customization
1. Read [Theme Implementation Guide](./theme/IMPLEMENTATION_GUIDE.md)
2. Use the theme testing page: `/theme-test`
3. Run font migration: `./scripts/migrate-font-sizes.sh --dry-run`

### For API Development
1. Review [GraphQL README](./graphql/README.md)
2. Check [Mutations Guide](./graphql/MUTATIONS.md)
3. Run tests: See [Tests Quickstart](./graphql/TESTS_QUICKSTART.md)

---

## 📝 Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate category folder
2. Update this README with a link
3. Follow existing naming conventions (use underscores or hyphens)
4. Include examples and code snippets where helpful

---

## 🔍 Need Help?

- **GraphQL Issues**: Check [GraphQL README](./graphql/README.md)
- **Styling Issues**: Check [Theme System](./theme/README.md)
- **Component Usage**: Check [Components](./components/main-components/)
- **Authentication**: Check [Auth Setup](./guides/AUTH_SETUP.md)
- **Caching**: Check [Caching Guide](./CACHING_GUIDE.md)

---

**Last Updated**: January 2025  
**Maintained by**: Kroolo Development Team
