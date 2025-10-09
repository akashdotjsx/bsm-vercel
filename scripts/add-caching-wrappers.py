#!/usr/bin/env python3
"""
Automatically add caching wrappers to remaining API routes
"""

import os
import re

# Define routes to process with their cache configurations
ROUTES_CONFIG = {
    # Search routes - 60s cache (frequently changing)
    'app/api/search/tickets/route.ts': {
        'tag': 'CACHE_TAGS.tickets',
        'revalidate': 60,
        'cache_key_base': 'search-tickets',
        'query_pattern': r'(const \{ data: tickets.*?\} = await supabase.*?\.from\(.*?\).*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    'app/api/search/users/route.ts': {
        'tag': 'CACHE_TAGS.users',
        'revalidate': 60,
        'cache_key_base': 'search-users',
        'query_pattern': r'(const \{ data: users.*?\} = await supabase.*?\.from\(.*?\).*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    'app/api/search/assets/route.ts': {
        'tag': 'CACHE_TAGS.assets',
        'revalidate': 60,
        'cache_key_base': 'search-assets',
        'query_pattern': r'(const \{ data: assets.*?\} = await supabase.*?\.from\(.*?\).*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    'app/api/search/services/route.ts': {
        'tag': 'CACHE_TAGS.services',
        'revalidate': 60,
        'cache_key_base': 'search-services',
        'query_pattern': r'(const \{ data: services.*?\} = await supabase.*?\.from\(.*?\).*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    'app/api/search/suggestions/route.ts': {
        'tag': 'CACHE_TAGS.tickets',
        'revalidate': 60,
        'cache_key_base': 'search-suggestions',
        'query_pattern': r'(const \{ data:.*?\} = await supabase.*?\.from\(.*?\).*?\.limit\(.*?\))',
    },
    
    # Asset routes - 300s cache (moderately changing)
    'app/api/assets/route.ts': {
        'tag': 'CACHE_TAGS.assets',
        'revalidate': 300,
        'cache_key_base': 'assets',
        'query_pattern': r'(const \{ data: assets.*?\} = await query.*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    'app/api/asset-types/route.ts': {
        'tag': 'CACHE_TAGS.assets',
        'revalidate': 3600,
        'cache_key_base': 'asset-types',
        'query_pattern': r'(const \{ data: assetTypes.*?\} = await supabase.*?\.from\(.*?\).*?\.order\(.*?\))',
    },
    
    # User routes - 300s cache
    'app/api/users/[id]/route.ts': {
        'tag': 'CACHE_TAGS.users',
        'revalidate': 300,
        'cache_key_base': 'user',
        'query_pattern': r'(const \{ data: user.*?\} = await supabase.*?\.from\(.*?\).*?\.single\(\))',
    },
    'app/api/profiles/route.ts': {
        'tag': 'CACHE_TAGS.users',
        'revalidate': 300,
        'cache_key_base': 'profiles',
        'query_pattern': r'(const \{ data: profiles.*?\} = await supabase.*?\.from\(.*?\).*?\.order\(.*?\))',
    },
    
    # Service routes - 300-3600s cache
    'app/api/service-categories/route.ts': {
        'tag': 'CACHE_TAGS.services',
        'revalidate': 3600,
        'cache_key_base': 'service-categories',
        'query_pattern': r'(const \{ data: categories.*?\} = await supabase.*?\.from\(.*?\).*?\.order\(.*?\))',
    },
    'app/api/services/requestable/route.ts': {
        'tag': 'CACHE_TAGS.services',
        'revalidate': 300,
        'cache_key_base': 'services-requestable',
        'query_pattern': r'(const \{ data: services.*?\} = await supabase.*?\.from\(.*?\).*?(?:\.order\(.*?\)|\.range\(.*?\))+)',
    },
    
    # Other routes
    'app/api/check-config/route.ts': {
        'tag': 'CACHE_TAGS.tickets',
        'revalidate': 3600,
        'cache_key_base': 'check-config',
        'query_pattern': r'(const \{ data.*?\} = await supabase.*?\.from\(.*?\))',
    },
}

def wrap_with_cache(file_path, config):
    """Add caching wrapper to a route file"""
    
    if not os.path.exists(file_path):
        print(f"⚠️  File not found: {file_path}")
        return False
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if already cached
    if 'unstable_cache(' in content:
        print(f"✅ Already cached: {file_path}")
        return True
    
    # Add import if needed (already done by previous script)
    if 'revalidateTag' not in content:
        content = content.replace(
            "import { unstable_cache } from 'next/cache'",
            "import { unstable_cache, revalidateTag } from 'next/cache'"
        )
    
    # Find and wrap the query
    # This is a simplified approach - may need manual adjustment for complex queries
    print(f"📝 Processing: {file_path}")
    print(f"   Cache key: {config['cache_key_base']}")
    print(f"   Tag: {config['tag']}")
    print(f"   Revalidate: {config['revalidate']}s")
    
    # For now, just report what needs to be done
    # Manual wrapping is more reliable for complex queries
    return False

def main():
    print("🚀 Adding caching wrappers to remaining routes...\n")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    processed = 0
    skipped = 0
    
    for route_path, config in ROUTES_CONFIG.items():
        full_path = os.path.join(base_dir, route_path)
        
        if wrap_with_cache(full_path, config):
            processed += 1
        else:
            skipped += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Already cached: {processed}")
    print(f"   ⚠️  Need manual work: {skipped}")
    print(f"\nℹ️  Use the Quick Reference guide for manual wrapping")
    print(f"   Location: docs/CACHING_QUICK_REFERENCE.md")

if __name__ == '__main__':
    main()
