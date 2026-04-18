import os, re

PAGES = [
    r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\card\pokemon\[id]\page.tsx',
    r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\card\pokemon-jp\[id]\page.tsx',
    r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\card\onepiece\[id]\page.tsx',
]

REPLACEMENTS = [
    # Background
    (r'min-h-screen\s*$', 'min-h-screen bg-[#fafbfc]'),
    (r'style=\{\s*\{background:\s*[\'"]var\(--background\)[\'"]\s*\}\s*\}', ''),
    (r'bg-\[#f5f6fa\](?!\s*")', 'bg-[#fafbfc]'),
    
    # Remove gradients
    (r'bg-gradient-to-r\s+from-\S+\s+to-\S+', 'bg-[#6366f1]'),
    (r'bg-gradient-to-br\s+from-\S+\s+to-\S+', 'bg-[#6366f1]'),
    
    # Dark theme colors -> minimal
    (r'\btext-gray-200\b', 'text-[#5c6078]'),
    (r'\btext-gray-100\b', 'text-[#8b8fa6]'),
    (r'\btext-gray-300\b', 'text-[#8b8fa6]'),
    (r'\btext-gray-400\b', 'text-[#8b8fa6]'),
    (r'\btext-gray-500\b', 'text-[#8b8fa6]'),
    (r'\btext-gray-600\b', 'text-[#5c6078]'),
    (r'\bbg-gray-700\b', 'bg-[#f5f6fa]'),
    (r'\bbg-gray-800\b', 'bg-[#1e2235]'),
    (r'\bbg-gray-900\b', 'bg-[#1e2235]'),
    
    # Border/hover dark -> minimal
    (r'\bborder-gray-\d+\b', 'border-[#e8eaf0]'),
    (r'\bhover:border-gray-\d+\b', 'hover:border-[#6366f1]/30'),
    (r'\bhover:bg-gray-\d+\b', 'hover:bg-[#f5f6fa]'),
    (r'\bhover:text-gray-\d+\b', 'hover:text-[#1e2235]'),
    (r'\bfocus:ring-amber-\d+\b', 'focus:ring-[#6366f1]/20'),
    (r'\bfocus:border-amber-\d+\b', 'focus:border-[#6366f1]'),
    
    # Indigo -> #6366f1
    (r'\btext-indigo-\d+\b', 'text-[#6366f1]'),
    (r'\bbg-indigo-\d+\b', 'bg-[#6366f1]'),
    (r'\bhover:bg-indigo-\d+\b', 'hover:bg-[#4f46e5]'),
    (r'\bborder-indigo-\d+\b', 'border-[#6366f1]'),
    (r'\bhover:border-indigo-\d+\b', 'hover:border-[#6366f1]/30'),
    (r'\btext-indigo-600\b', 'text-[#6366f1]'),
    (r'\bbg-indigo-50\b', 'bg-[#6366f1]/10'),
    
    # Amber -> #6366f1 for accents
    (r'\btext-amber-\d+\b', 'text-[#6366f1]'),
    (r'\bbg-amber-\d+\b', 'bg-[#6366f1]/10'),
    (r'\bborder-amber-\d+\b', 'border-[#6366f1]/20'),
    (r'\bfocus:ring-amber\b', 'focus:ring-[#6366f1]/20'),
    (r'\bfocus:border-amber\b', 'focus:border-[#6366f1]'),
    (r'\bshadow-amber-\d+\b', ''),
    
    # font-bold -> font-semibold
    (r'\bfont-extrabold\b', 'font-bold'),
    (r'\bfont-bold\b', 'font-semibold'),
    
    # shadow-lg -> shadow-md
    (r'\bshadow-lg\b', 'shadow-md'),
    (r'\bshadow-xl\b', 'shadow-md'),
    (r'\bshadow-2xl\b', 'shadow-md'),
    
    # rounded-3xl -> rounded-2xl
    (r'\brounded-3xl\b', 'rounded-2xl'),
    
    # Fix placeholder text colors
    (r'\bplaceholder-gray-\d+\b', 'placeholder:text-[#b5b8c8]'),
    
    # Ring indigo -> ring-[#6366f1]
    (r'\bfocus:ring-indigo-\d+\b', 'focus:ring-[#6366f1]/20'),
    (r'\bfocus:border-indigo-\d+\b', 'focus:border-[#6366f1]'),
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    # Clean up double spaces and empty class attrs
    content = re.sub(r'  +', ' ', content)
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
    if process_file(page):
        updated += 1

print(f"\nDone: {updated} files updated")