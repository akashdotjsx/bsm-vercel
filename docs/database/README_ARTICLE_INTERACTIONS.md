# Article Interactions Migration Guide

## Overview
This migration adds full interaction support for Knowledge Base articles including bookmarks, comments, votes/reactions, and revision history.

## New Tables Created
1. **article_bookmarks** - Track user-saved articles
2. **article_comments** - Article comments and feedback
3. **article_votes** - Helpful/not helpful reactions
4. **article_revisions** - Article change history

## How to Apply Migration

### Using Supabase CLI
```bash
# Connect to your Supabase project
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `add_article_interactions.sql`
4. Copy all contents and paste into the SQL editor
5. Click **Run** to execute

### Using psql
```bash
psql postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres -f add_article_interactions.sql
```

## Features Enabled

### 1. Bookmarks
- Users can bookmark articles for quick access
- Bookmarked articles appear on Knowledge Base landing page
- Toggle bookmark functionality on article pages

### 2. Comments & Feedback
- Add comments to articles
- View comment history with user info
- Delete own comments
- Support for internal comments (future)

### 3. Votes/Reactions
- Helpful/Not Helpful voting
- Real-time vote counts
- Visual feedback on user's vote
- Prevents duplicate votes per user

### 4. Revision History
- Track all article changes
- Version numbering
- Change descriptions
- Audit trail with timestamps and authors

## GraphQL Integration

All features use GraphQL via Supabase's pg_graphql extension:

```typescript
// Example: Get bookmarked articles
const { data } = useArticleBookmarks()

// Example: Add comment
const addComment = useAddArticleComment()
await addComment.mutateAsync({
  articleId,
  userId,
  organizationId,
  content: "Great article!",
})

// Example: Vote on article
const { vote } = useVoteArticle()
await vote(articleId, 'helpful')
```

## UI Components

### Article Actions Tray
- Replaces old dialog modals
- Side-sliding tray similar to ticket modal
- Three tabs: Settings, Comments, History
- Fully functional with real-time updates

### Article Page Enhancements
- Bookmark button with status indicator
- Like/Dislike buttons with counts
- Share article button
- Tags display
- All actions use GraphQL

### Knowledge Base Landing Page
- Bookmarked articles section
- Shows up to 6 recent bookmarks
- Quick navigation to bookmarked content

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only:
  - View data in their organization
  - Create their own bookmarks/comments/votes
  - Delete only their own content
  - Read all revisions but only create for their edits

## Testing

After applying the migration:

1. **Test Bookmarks**
   - Go to any article
   - Click bookmark button
   - Verify it appears on Knowledge Base home

2. **Test Comments**
   - Open "Manage Article" tray
   - Go to Comments tab
   - Add a comment
   - Verify it appears and can be deleted

3. **Test Votes**
   - Click thumbs up/down on article
   - Verify count updates
   - Check that re-voting changes vote type

4. **Test History**
   - Make changes to an article
   - Open History tab in tray
   - Verify revisions appear

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS public.article_revisions CASCADE;
DROP TABLE IF EXISTS public.article_votes CASCADE;
DROP TABLE IF EXISTS public.article_comments CASCADE;
DROP TABLE IF EXISTS public.article_bookmarks CASCADE;
```

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Verify RLS policies are active
3. Ensure GraphQL extension is enabled
4. Check browser console for client-side errors
