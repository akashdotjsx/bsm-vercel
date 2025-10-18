# 🚀 Knowledge Base Implementation - Quick Start Guide

**Status:** Tasks 1 & 3 Complete ✅ | 8 Tasks Remaining  
**Time Estimate:** 4-6 hours to complete all tasks  
**Date:** October 17, 2025

---

## ✅ COMPLETED TASKS

### Task 1: TypeScript Types & Zod Schemas ✅
- **File:** `lib/types/knowledge.ts`
- **Status:** Complete
- **Contains:**
  - `KnowledgeArticle` interface
  - `CreateArticleSchema`, `UpdateArticleSchema` (Zod)
  - `ArticleStatus` enum
  - `AIGenerationRequest/Response` types
  - GraphQL connection types

### Task 3: GraphQL Queries ✅
- **File:** `lib/graphql/knowledge-queries.ts`
- **Status:** Complete
- **Contains:**
  - 8 queries (list, get by ID, search, by category, trending, etc.)
  - 5 mutations (create, update, delete, increment views, update helpful)
  - Helper function `executeGraphQLQuery()`

### Task 7: cURL Test Script ✅
- **File:** `test-knowledge-api.sh` 
- **Status:** Complete, executable
- **Tests:** All 10 API endpoints with colored output

---

## 📋 REMAINING TASKS (Execute in Order)

### Task 2: Database Hooks (30 min)
```bash
# Create the hooks file
touch hooks/use-knowledge-articles.ts
```

Copy content from `KNOWLEDGE_BASE_AUDIT_AND_IMPLEMENTATION.md` Section: Phase 1, Step 1.2

**What to test:**
```typescript
// Import in any component
import { useKnowledgeArticles } from '@/hooks/use-knowledge-articles'

// Should work without errors
const { data, isLoading } = useKnowledgeArticles({ status: 'published' })
```

---

### Task 4: REST API - Articles Route (45 min)
```bash
# Create API directory and file
mkdir -p app/api/knowledge/articles
touch app/api/knowledge/articles/route.ts
```

Copy content from `KNOWLEDGE_BASE_AUDIT_AND_IMPLEMENTATION.md` Section: Phase 1, Step 1.3

**Test immediately:**
```bash
# Start dev server
npm run dev

# In another terminal, test GET
curl http://localhost:3000/api/knowledge/articles

# Test POST (create article)
curl -X POST http://localhost:3000/api/knowledge/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "content": "# Test Content",
    "status": "draft"
  }'
```

**Expected:** JSON response with articles array or created article

---

### Task 5: REST API - Single Article Route (30 min)
```bash
# Create the [id] route
mkdir -p app/api/knowledge/articles/[id]
touch app/api/knowledge/articles/[id]/route.ts
```

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UpdateArticleSchema } from '@/lib/types/knowledge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get article
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('*, author:profiles!author_id(*)')
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    
    // Increment view count
    await supabase.rpc('increment_article_views', { article_id: params.id })
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = UpdateArticleSchema.parse(body)
    
    const { data, error } = await supabase
      .from('knowledge_articles')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { error } = await supabase
      .from('knowledge_articles')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: 'Article deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Test:**
```bash
# Get article (replace ARTICLE_ID)
curl http://localhost:3000/api/knowledge/articles/ARTICLE_ID

# Update article
curl -X PUT http://localhost:3000/api/knowledge/articles/ARTICLE_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "status": "published"}'

# Delete article
curl -X DELETE http://localhost:3000/api/knowledge/articles/ARTICLE_ID
```

---

### Task 6: AI Generation Endpoint (45 min)
```bash
# Create AI generation route
mkdir -p app/api/knowledge/ai-generate
touch app/api/knowledge/ai-generate/route.ts
```

Copy content from `KNOWLEDGE_BASE_AUDIT_AND_IMPLEMENTATION.md` Section: Phase 2, Step 2.1

**Test:**
```bash
# Test AI generation (requires AI keys in .env.local)
curl -X POST http://localhost:3000/api/knowledge/ai-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write an article about password security",
    "style": "professional"
  }'
```

**Expected:** Streaming response with `data:` prefix

---

### Task 8: Database CRUD Tests (10 min)
```bash
# Run comprehensive database tests
npm run test:db

# Look for knowledge_articles in output
# Should show: ✅ CREATE, READ, UPDATE, DELETE all passing
```

**Expected output:**
```
🔬 Testing table: knowledge_articles
  ✅ CREATE test passed (ID: uuid-123...)
  ✅ READ test passed
  ✅ UPDATE test passed
  ✅ DELETE test passed - test data cleaned up
```

---

### Task 7: Run Full API Tests (5 min)
```bash
# Make script executable (already done)
chmod +x test-knowledge-api.sh

# Run comprehensive tests
./test-knowledge-api.sh

# Or with custom base URL
BASE_URL=http://localhost:3000 ./test-knowledge-api.sh
```

**Expected:** All 10 tests passing with ✅

---

### Task 9: Update Frontend Pages (60 min)

#### 9.1: Main Landing Page
```typescript
// app/(dashboard)/knowledge-base/page.tsx
// Replace lines 57-146 (hardcoded categories) with:

import { useArticleCategories, useKnowledgeArticles } from '@/hooks/use-knowledge-articles'

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Real data hooks
  const { data: categories, isLoading: categoriesLoading } = useArticleCategories()
  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles({
    status: 'published',
    query: searchQuery,
    limit: 50,
  })
  
  const loading = categoriesLoading || articlesLoading
  
  // Map categories to UI format
  const knowledgeCategories = (categories || []).map(cat => ({
    name: cat.name,
    articles: cat.count,
    description: `Articles in ${cat.name} category`,
    icon: CreditCard, // Map icons based on category name
    aiInsights: `${cat.count} articles available`,
    trending: cat.count > 10,
  }))
  
  // Rest of component logic...
}
```

#### 9.2: Category Page
```typescript
// app/(dashboard)/knowledge-base/category/[slug]/page.tsx
// Replace sampleArticles with:

const { data: articles, isLoading } = useKnowledgeArticles({
  category: categoryName,
  status: 'published',
})

const filteredArticles = articles?.filter(
  article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
) || []
```

#### 9.3: Article Viewer
```typescript
// app/(dashboard)/knowledge-base/article/[id]/page.tsx
// Replace article object with:

const { data: article, isLoading } = useArticle(params.id as string)

if (isLoading) return <div>Loading...</div>
if (!article) return <div>Article not found</div>
```

#### 9.4: Article Editor
```typescript
// app/(dashboard)/knowledge-base/article/[id]/edit/page.tsx
// Add save functionality:

const updateArticle = useUpdateArticle()

const handleSave = async () => {
  try {
    await updateArticle.mutateAsync({
      id: params.id as string,
      title,
      content: blocks.map(b => b.content).join('\n\n'),
      status: 'draft',
    })
    alert('Article saved!')
  } catch (error) {
    alert('Save failed: ' + error.message)
  }
}
```

---

### Task 10: Integration Testing (30 min)

**Test Flow:**
```bash
# 1. Start dev server
npm run dev

# 2. Open browser to /knowledge-base
open http://localhost:3000/knowledge-base

# 3. Test in order:
# - View categories (should load from DB)
# - Click a category (should show real articles)
# - Click an article (view count should increment)
# - Edit an article (changes should save)
# - Create new article via "Add Category" or "AI Generate"
# - Search for articles
# - Delete test article

# 4. Verify in database
npm run init:check
# Look for knowledge_articles count
```

**Validation Checklist:**
- [ ] Categories load from database
- [ ] Article counts are accurate
- [ ] Clicking article increments view count
- [ ] Search returns relevant results
- [ ] Create article persists to database
- [ ] Edit article updates database
- [ ] Delete article removes from database
- [ ] AI generation works (if keys configured)
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🧪 COMPREHENSIVE TESTING COMMANDS

### Quick Tests (Run After Each Task)
```bash
# Test database connection
npm run init:check

# Test database CRUD
npm run test:db

# Test TypeScript compilation
npm run build

# Start dev server
npm run dev
```

### Full API Testing
```bash
# Test with curl script
./test-knowledge-api.sh

# Manual curl tests
curl http://localhost:3000/api/knowledge/articles
curl http://localhost:3000/api/knowledge/categories

# GraphQL test
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/graphql/v1" \
  -H "Content-Type: application/json" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -d '{
    "query": "{ knowledge_articlesCollection(first: 5) { edges { node { id title } } } }"
  }'
```

---

## 📊 PROGRESS TRACKER

Update as you complete tasks:

- [x] Task 1: TypeScript Types ✅
- [x] Task 3: GraphQL Queries ✅  
- [x] Task 7: cURL Test Script ✅
- [ ] Task 2: Database Hooks
- [ ] Task 4: REST API - Articles Route
- [ ] Task 5: REST API - Single Article Route
- [ ] Task 6: AI Generation Endpoint
- [ ] Task 8: Database CRUD Tests
- [ ] Task 9: Update Frontend Pages
- [ ] Task 10: Integration Testing

---

## 🚨 TROUBLESHOOTING

### Issue: GraphQL queries fail
**Solution:**
```bash
# Check GraphQL endpoint is enabled
curl "$NEXT_PUBLIC_SUPABASE_URL/graphql/v1"

# Should return GraphQL schema info
```

### Issue: API returns 401 Unauthorized
**Solution:**
- Check `.env.local` has correct Supabase keys
- Ensure auth cookie is set (login required)
- Use Supabase service role key for testing

### Issue: TypeScript errors in hooks
**Solution:**
```bash
# Verify types file exists
ls -la lib/types/knowledge.ts

# Check imports
grep "import.*knowledge" hooks/use-knowledge-articles.ts
```

### Issue: Database tests fail
**Solution:**
```bash
# Check RLS policies
npm run init:check

# Look for RLS enabled on knowledge_articles
# If RLS is blocking, temporarily disable for testing
```

---

## 🎯 FINAL VALIDATION

After completing all tasks, run:

```bash
# 1. Database validation
npm run test:db

# 2. API validation  
./test-knowledge-api.sh

# 3. TypeScript validation
npm run build

# 4. Start server
npm run dev

# 5. Manual UI testing
open http://localhost:3000/knowledge-base
```

**All systems go when:**
- ✅ All database tests pass
- ✅ All curl tests pass
- ✅ Build completes without errors
- ✅ UI loads and shows real data
- ✅ CRUD operations work in UI
- ✅ No console errors

---

## 📞 NEXT STEPS AFTER COMPLETION

1. **Deploy to staging** - Test with production data
2. **Performance optimization** - Add indexes, caching
3. **Advanced features** - Full-text search, versioning
4. **Documentation** - Update user guides
5. **Monitoring** - Add analytics, error tracking

---

**Estimated Total Time:** 4-6 hours  
**Difficulty:** Intermediate  
**Skills Required:** TypeScript, Next.js, Supabase, REST/GraphQL

**Good luck! 🚀**
