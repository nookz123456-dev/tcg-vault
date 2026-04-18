#!/usr/bin/env python3
"""Minimal style redesign for TCG Vault pages - batch update"""
import os, re

PAGES_DIR = r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app'

# Pages to update
PAGES = [
    'community/page.tsx',
    'discussions/page.tsx',
    'notifications/page.tsx',
    'badges/page.tsx',
    'trades/page.tsx',
    'collection/page.tsx',
    'alerts/page.tsx',
    'sets/page.tsx',
    'sealed/page.tsx',
    'login/page.tsx',
    'page.tsx',  # homepage
]

# Global replacements for minimal style
REPLACEMENTS = [
    # Background
    (r'min-h-screen\s*$', 'min-h-screen bg-[#fafbfc]'),
    (r'style=\{\s*{background:\s*[\'"]var\(--background\)[\'"]\s*}\s*\}', ''),
    (r'style=\{\s*{background:\s*[\'"]#f5f6fa[\'"]\s*}\s*\}', ''),
    (r'bg-\[#f5f6fa\]', 'bg-[#fafbfc]'),
    
    # Remove shimmer, use animate-pulse
    (r'\bshimmer\b', 'animate-pulse'),
    
    # Remove gradient backgrounds
    (r'bg-gradient-to-r\s+from-\S+\s+to-\S+', 'bg-[#6366f1]'),
    (r'bg-gradient-to-br\s+from-\S+\s+to-\S+', 'bg-[#6366f1]'),
    
    # Remove shadow-lg on buttons
    (r'shadow-lg\s+shadow-\S+', ''),
    (r'shadow-sm\s+shadow-\S+', ''),
    
    # Fix dark theme colors  
    (r'text-gray-200', 'text-[#5c6078]'),
    (r'text-gray-100', 'text-[#8b8fa6]'),
    (r'text-gray-300', 'text-[#8b8fa6]'),
    (r'bg-gray-700', 'bg-[#f5f6fa]'),
    (r'bg-gray-800', 'bg-[#1e2235]'),
    (r'bg-gray-900', 'bg-[#1e2235]'),
    (r'text-gray-400', 'text-[#8b8fa6]'),
    (r'text-gray-500', 'text-[#8b8fa6]'),
    (r'text-gray-600', 'text-[#5c6078]'),
    (r'border-gray-\d+', 'border-[#e8eaf0]'),
    (r'hover:border-gray-\d+', 'hover:border-[#6366f1]/30'),
    (r'hover:bg-gray-\d+', 'hover:bg-[#f5f6fa]'),
    (r'focus:ring-amber-\d+', 'focus:ring-[#6366f1]/20'),
    (r'focus:border-amber-\d+', 'focus:border-[#6366f1]'),
    (r'hover:text-gray-\d+', 'hover:text-[#1e2235]'),
    
    # Fix shadow-amber references
    (r'shadow-amber-\d+', ''),
    (r'shadow-red-\d+', ''),
    
    # Card hover style
    (r'card-hover', 'hover:shadow-md hover:shadow-[#6366f1]/5 transition-all'),
    
    # Rounded adjustments
    (r'rounded-3xl', 'rounded-2xl'),
]

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} not found")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    # Clean up double spaces
    content = re.sub(r'  +', ' ', content)
    # Clean up empty class attributes 
    content = re.sub(r'className=""', '', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"UPDATED: {os.path.basename(os.path.dirname(filepath))}/{os.path.basename(filepath)}")
        return True
    else:
        print(f"NO CHANGE: {os.path.basename(filepath)}")
        return False

updated = 0
for page in PAGES:
    filepath = os.path.join(PAGES_DIR, page)
    if process_file(filepath):
        updated += 1

print(f"\nDone: {updated} files updated")