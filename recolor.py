import re, sys

filepath = sys.argv[1]
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    ('bg-[var(--card-bg)]', 'bg-white'),
    ('border-[var(--card-border)]', 'border-[#e8eaf0]'),
    ('text-gray-100', 'text-[#1e2235]'),
    ('text-gray-300', 'text-[#3b3f56]'),
    ('text-gray-400', 'text-[#5c6078]'),
    ('text-gray-500', 'text-[#8b8fa6]'),
    ('text-amber-400', 'text-[#6366f1]'),
    ('text-amber-500', 'text-[#6366f1]'),
    ('bg-amber-500', 'bg-[#6366f1]'),
    ('hover:bg-amber-400', 'hover:bg-[#4f46e5]'),
    ('bg-amber-500/10', 'bg-[#6366f1]/10'),
    ('bg-amber-500/15', 'bg-[#6366f1]/10'),
    ('text-amber-100', 'text-[#6366f1]'),
    ('hover:border-amber-500/40', 'hover:border-[#6366f1]/30'),
    ('hover:border-amber-500/30', 'hover:border-[#6366f1]/30'),
    ('shadow-amber-500/5', 'shadow-[#6366f1]/5'),
    ('shadow-amber-500/20', 'shadow-[#6366f1]/20'),
    ('from-gray-800/50 to-gray-900/50', 'from-[#f5f6fa] to-[#e8eaf0]'),
    ('bg-amber-950/70', 'bg-white/80'),
    ('bg-[var(--surface-1)]', 'bg-[#f5f6fa]'),
    ('bg-[var(--surface-2)]', 'bg-[#e8eaf0]'),
    ('text-[var(--warm-900)]', 'text-white'),
    ('text-[var(--warm-300)]', 'text-[#5c6078]'),
    ('text-[var(--warm-400)]', 'text-[#8b8fa6]'),
    ('text-[var(--warm-500)]', 'text-[#b5b8c8]'),
    ('border-amber-500/20', 'border-[#6366f1]/20'),
    ('bg-emerald-500/15', 'bg-emerald-50'),
    ('text-emerald-400', 'text-emerald-500'),
    ('border-emerald-500/30', 'border-emerald-200'),
    ('text-[var(--foreground)]', 'text-[#1e2235]'),
    ('shadow-lg shadow-amber-500/20', 'shadow-lg shadow-[#6366f1]/20'),
    ('shadow-lg shadow-amber-500/5', 'shadow-lg'),
]

# Replace text-white carefully — not inside text-[#...] already
for old, new in replacements:
    c = c.replace(old, new)

# Fix text-white that's NOT already inside text-[...]
# Only replace standalone "text-white" (not text-[#1e2235] etc)
c = re.sub(r'(?<!\[)text-white(?!-)', 'text-[#1e2235]', c)

# Fix bg-amber-950/80 (modal overlay)
c = c.replace('bg-amber-950/80', 'bg-[#1e2235]/80')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print(f'Done: {filepath}')