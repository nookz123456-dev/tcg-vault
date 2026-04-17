import re
import os

files = [
    'src/app/community/page.tsx',
    'src/app/discussions/page.tsx',
    'src/app/trades/page.tsx',
    'src/app/notifications/page.tsx',
    'src/app/badges/page.tsx',
]

all_keys = set()
for f in files:
    path = os.path.join(r'C:\Users\suwij\.openclaw\workspace\tcg-vault', f)
    if os.path.exists(path):
        data = open(path, encoding='utf-8').read()
        keys = re.findall(r"t\('([^']+)'\)", data)
        all_keys.update(keys)

# Read existing i18n keys
i18n_path = os.path.join(r'C:\Users\suwij\.openclaw\workspace\tcg-vault', 'src/lib/i18n.ts')
i18n_data = open(i18n_path, encoding='utf-8').read()
existing_keys = re.findall(r"'([^']+)':\s*\{", i18n_data)
existing_set = set(existing_keys)

# Find missing keys
missing = sorted(all_keys - existing_set)
print("Missing i18n keys:")
for k in missing:
    print(f"  '{k}'")
print(f"\nTotal: {len(missing)} missing out of {len(all_keys)} used")