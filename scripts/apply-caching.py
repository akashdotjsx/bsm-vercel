#!/usr/bin/env python3
"""
Automated Caching Application Script
Adds React caching to all API GET routes
"""

import re
from pathlib import Path

# Routes and their cache durations
ROUTE_CACHE_CONFIG = {
    'dashboard': 300,      # 5 minutes
    'service-requests': 60,  # 1 minute
    'assets': 300,         # 5 minutes
    'users': 300,          # 5 minutes
    'profiles': 300,       # 5 minutes
    'analytics': 300,      # 5 minutes
    'notifications': 60,   # 1 minute
    'teams': 300,          # 5 minutes
    'accounts': 300,       # 5 minutes
    'knowledge': 3600,     # 1 hour
    'search': 60,          # 1 minute
    'service-categories': 3600,  # 1 hour
    'asset-types': 3600,   # 1 hour
}

def get_cache_duration(route_path: str) -> int:
    """Determine cache duration based on route path"""
    for key, duration in ROUTE_CACHE_CONFIG.items():
        if key in route_path:
            return duration
    return 300  # Default 5 minutes

def get_cache_tag(route_path: str) -> str:
    """Determine cache tag based on route path"""
    if 'ticket' in route_path:
        return 'CACHE_TAGS.tickets'
    elif 'service-request' in route_path:
        return 'CACHE_TAGS.serviceRequests'
    elif 'asset' in route_path:
        return 'CACHE_TAGS.assets'
    elif 'user' in route_path or 'profile' in route_path:
        return 'CACHE_TAGS.users'
    elif 'dashboard' in route_path:
        return 'CACHE_TAGS.dashboard'
    elif 'analytics' in route_path:
        return 'CACHE_TAGS.analytics'
    elif 'notification' in route_path:
        return 'CACHE_TAGS.notifications'
    elif 'team' in route_path:
        return 'CACHE_TAGS.teams'
    elif 'account' in route_path:
        return 'CACHE_TAGS.accounts'
    elif 'knowledge' in route_path:
        return 'CACHE_TAGS.knowledgeBase'
    elif 'service' in route_path:
        return 'CACHE_TAGS.services'
    return "'general'"

def add_imports(content: str) -> tuple[str, bool]:
    """Add caching imports if not present"""
    has_unstable_cache = 'unstable_cache' in content
    has_cache_tags = 'CACHE_TAGS' in content
    
    if has_unstable_cache and has_cache_tags:
        return content, False
    
    # Find import section
    import_pattern = r'(import.*?from.*?["\']next/server["\'])'
    match = re.search(import_pattern, content)
    
    if match:
        new_imports = match.group(1)
        if not has_unstable_cache:
            new_imports += "\nimport { unstable_cache } from 'next/cache'"
        if not has_cache_tags:
            new_imports += "\nimport { CACHE_TAGS } from '@/lib/cache'"
        
        content = content.replace(match.group(1), new_imports)
        return content, True
    
    return content, False

def wrap_query_with_cache(content: str, route_path: str) -> tuple[str, bool]:
    """Wrap database queries with caching"""
    # Look for patterns like: const { data } = await supabase.from(...)
    query_pattern = r'(const\s+{\s*data[^}]*}\s*=\s*await\s+(?:supabase|client|query)(?:\.|\[))'
    
    matches = list(re.finditer(query_pattern, content))
    if not matches:
        return content, False
    
    cache_duration = get_cache_duration(route_path)
    cache_tag = get_cache_tag(route_path)
    
    # Only wrap if not already cached
    if 'unstable_cache' in content:
        return content, False
    
    # Add cache wrapper (simplified - would need more complex logic for production)
    return content, False

def should_cache_route(filepath: Path) -> bool:
    """Determine if route should be cached"""
    # Skip auth routes and mutations
    skip_patterns = ['auth/', 'create-', 'token-sync', 'reset-password']
    path_str = str(filepath)
    
    return not any(pattern in path_str for pattern in skip_patterns)

def process_route_file(filepath: Path) -> dict:
    """Process a single route file"""
    content = filepath.read_text()
    route_path = str(filepath)
    
    # Check if it's a GET route
    if 'export async function GET' not in content:
        return {'status': 'skipped', 'reason': 'No GET handler'}
    
    # Check if already cached
    if 'unstable_cache' in content:
        return {'status': 'skipped', 'reason': 'Already cached'}
    
    # Check if should cache
    if not should_cache_route(filepath):
        return {'status': 'skipped', 'reason': 'Auth/mutation route'}
    
    # Add imports
    modified_content, imports_added = add_imports(content)
    
    if imports_added:
        filepath.write_text(modified_content)
        return {'status': 'imports_added', 'reason': 'Added caching imports'}
    
    return {'status': 'needs_manual', 'reason': 'Complex query - manual review needed'}

def main():
    print("🚀 Starting automated caching application...\n")
    
    routes = list(Path("app/api").rglob("route.ts"))
    
    stats = {
        'total': len(routes),
        'imports_added': 0,
        'already_cached': 0,
        'skipped': 0,
        'needs_manual': 0,
    }
    
    manual_review = []
    
    for route in routes:
        result = process_route_file(route)
        
        if result['status'] == 'imports_added':
            stats['imports_added'] += 1
            print(f"✅ {route}: Added imports")
        elif result['reason'] == 'Already cached':
            stats['already_cached'] += 1
        elif result['status'] == 'needs_manual':
            stats['needs_manual'] += 1
            manual_review.append(str(route))
        else:
            stats['skipped'] += 1
    
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"Total routes: {stats['total']}")
    print(f"✅ Imports added: {stats['imports_added']}")
    print(f"⚠️  Already cached: {stats['already_cached']}")
    print(f"⏭️  Skipped (auth/mutations): {stats['skipped']}")
    print(f"📝 Needs manual review: {stats['needs_manual']}")
    
    if manual_review:
        print(f"\n📝 Routes needing manual caching:")
        for route in manual_review[:10]:
            print(f"  • {route}")
        if len(manual_review) > 10:
            print(f"  ... and {len(manual_review)-10} more")

if __name__ == "__main__":
    main()
