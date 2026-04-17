data = open(r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\discussions\page.tsx', 'rb').read()
lines = data.split(b'\n')
# Print lines around 185-205 with position markers
for i in range(183, 210):
    if i < len(lines):
        line = lines[i].decode('utf-8', errors='replace')
        print(f'{i+1:4d}: {line}')