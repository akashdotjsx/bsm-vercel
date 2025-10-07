# Typography Components and Utilities

This folder centralizes Kroolo Enterprise Search Frontend typography patterns.

What’s included
- heading.tsx: Reusable Heading component with HEADING_SIZES mapping
- paragraph.tsx: Reusable Paragraph component with PARAGRAPH_SIZES mapping

Design tokens used
- Base sizes
  - text-xs = 10px
  - text-xs-sm = 11px
  - text-sm = 12px
  - text-base = 13px
  - text-lg ≈ 18px
- Custom utilities (from app/globals.css)
  - .text-10, .text-11, .text-13
  - .font-inter, .font-dmmono

Usage
```tsx
import { Heading } from "@/components/ui/typography/heading"
import { Paragraph } from "@/components/ui/typography/paragraph"

<Heading level={1}>Page Title</Heading>
<Paragraph size="default">Body 13px</Paragraph>
<Paragraph size="lead">Lead copy</Paragraph>
<Paragraph size="mono">Code-ish small</Paragraph>
```

Guidelines
- Prefer text-xs, text-xs-sm, text-sm, text-base, text-lg over arbitrary text-[..px]
- Use Paragraph special variants (lead,title,body,mono,xsmall) where applicable
- Keep Heading levels semantic (h1–h6); style via size mapping, not arbitrary classes
