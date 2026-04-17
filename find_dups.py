import re
data = open(r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\lib\i18n.ts', encoding='utf-8').read()
keys = re.findall(r"'([^']+)':\s*\{", data)
dups = set([k for k in keys if keys.count(k) > 1])
print(f"Duplicates ({len(dups)}):", dups)