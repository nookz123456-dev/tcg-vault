data = open(r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\discussions\page.tsx', 'rb').read()
lines = data.split(b'\n')
line196 = lines[195]  # 0-indexed
print(f'Line 196 length: {len(line196)}')
print(f'Chars around col 31: {line196[28:35]}')
print(f'Full line: {line196.decode("utf-8")}')
# Check if there are any zero-width chars
for i, b in enumerate(line196):
    if b > 127:
        print(f'  Non-ASCII at pos {i}: 0x{b:02x}')