# 📄 AI-Powered Document Import

The knowledge base now supports AI-powered document import with automatic categorization, tagging, and content enhancement.

## ✨ Features

- **Multi-Format Support**: PDF, Word (.docx), Markdown (.md), Text (.txt), HTML
- **AI Enhancement**: Automatic title generation, summarization, categorization, and tagging
- **Quality Scoring**: AI rates content completeness and provides feedback
- **Markdown Conversion**: Automatically converts documents to clean Markdown
- **Drag & Drop**: Easy file upload with drag-and-drop support
- **Real-time Processing**: Live progress feedback during upload

## 🚀 Setup

### 1. Install Dependencies

Already installed:
```bash
npm install portkey-ai mammoth pdf-parse turndown
```

### 2. Configure Portkey

Add to your `.env.local`:

```bash
NEXT_PUBLIC_PORTKEY_API_KEY=pk_xxxxxxxxxxxxx
VIRTUAL_KEY_OPENAI=your_openai_virtual_key
```

**Get your keys:**
1. Sign up at https://app.portkey.ai
2. Create an API key
3. Add your OpenAI key as a virtual key in Portkey
4. Copy both keys to `.env.local`

### 3. Test Without AI (Optional)

The feature works WITHOUT Portkey keys - it will:
- ✅ Parse documents
- ✅ Extract text
- ✅ Convert to Markdown
- ❌ No AI categorization
- ❌ No auto-tagging
- ❌ No quality scoring

## 📖 Usage

### For Users:

1. Go to Knowledge Base → New Article
2. Click "Import Document" tab
3. Drag & drop or click to upload a document
4. Wait for AI processing (5-10 seconds)
5. Review and edit the extracted content
6. Click "Publish" or "Save Draft"

### Supported Formats:

| Format | Extension | AI Enhancement | Notes |
|--------|-----------|----------------|-------|
| Markdown | `.md` | ✅ Yes | Best format, preserves structure |
| Text | `.txt` | ✅ Yes | Simple text extraction |
| Word | `.docx` | ✅ Yes | Converts formatting to Markdown |
| PDF | `.pdf` | ✅ Yes | Text extraction (no OCR) |
| HTML | `.html`, `.htm` | ✅ Yes | Converts to Markdown |

## 🤖 AI Enhancement Details

When a document is uploaded, AI analyzes it and provides:

1. **Title Generation**: Creates or improves the title
2. **Summary**: 2-3 sentence overview
3. **Category Suggestion**: Matches to existing categories
4. **Tag Generation**: 3-5 relevant tags
5. **Content Cleaning**: Fixes formatting and structure
6. **Quality Score**: 0-100 rating of content quality

### Example AI Output:

```json
{
  "title": "How to Configure Email Notifications",
  "summary": "Step-by-step guide for setting up email notifications...",
  "category": "User Management",
  "tags": ["email", "notifications", "configuration", "setup"],
  "content": "# How to Configure Email Notifications\n\n## Overview...",
  "qualityScore": 85
}
```

## 💰 Cost Estimation

Using Portkey with GPT-4o-mini:

- Small document (1-2 pages): ~$0.01
- Medium document (5-10 pages): ~$0.03
- Large document (20+ pages): ~$0.05-0.10

**Monthly estimate (100 imports):** ~$3-5

### Cost Optimization:

Portkey provides:
- **Caching**: Duplicate document uploads use cached response
- **Fallbacks**: If OpenAI fails, auto-switch to cheaper models
- **Monitoring**: Track spending per feature
- **Rate Limiting**: Prevent abuse

## 🛠️ Technical Details

### API Endpoint:

```
POST /api/knowledge/import
```

**Request:**
```typescript
FormData {
  file: File,
  categories: string (JSON array of category names)
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    originalFileName: string,
    fileSize: number,
    fileType: string,
    title: string,
    summary: string,
    category: string | null,
    tags: string[],
    content: string,
    qualityScore: number
  }
}
```

### Processing Flow:

```
1. Upload File
   ↓
2. Parse Document (mammoth/pdf-parse)
   ↓
3. Convert to Markdown (turndown)
   ↓
4. Extract Initial Title
   ↓
5. Send to Portkey/OpenAI
   ↓
6. AI Analyzes & Enhances
   ↓
7. Return Structured Data
   ↓
8. Populate Form
```

## 🔒 Security

- ✅ File size limits enforced
- ✅ Only allowed file types accepted
- ✅ Content sanitized before storage
- ✅ API keys not exposed to client
- ✅ Rate limiting via Portkey
- ✅ Organization-scoped data

## 🐛 Troubleshooting

### "Failed to process document"

**Cause**: Document parsing failed or AI unavailable

**Solutions:**
1. Check file is not corrupted
2. Verify file format is supported
3. Check Portkey API keys in `.env.local`
4. Check Portkey dashboard for errors

### "AI enhancement not working"

**Cause**: Portkey keys missing or invalid

**Solutions:**
1. Verify `NEXT_PUBLIC_PORTKEY_API_KEY` in `.env.local`
2. Verify `VIRTUAL_KEY_OPENAI` in `.env.local`
3. Check keys at https://app.portkey.ai
4. Restart Next.js server after adding keys

### "Quality score always 50"

**Cause**: AI enhancement fallback (no keys)

**Solutions:**
- Add Portkey keys to enable AI features
- Documents still parse correctly, just without AI

## 🎯 Future Enhancements

Planned features:
- [ ] Batch document import
- [ ] OCR for scanned PDFs
- [ ] Image extraction and upload
- [ ] Table formatting preservation
- [ ] Multi-language support
- [ ] Custom AI prompts per category
- [ ] Document comparison/deduplication

## 📚 Resources

- [Portkey Documentation](https://portkey.ai/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js)
- [PDF Parse](https://www.npmjs.com/package/pdf-parse)
- [Turndown](https://github.com/mixmark-io/turndown)
