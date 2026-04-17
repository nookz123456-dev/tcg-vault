data = open(r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\discussions\page.tsx', 'rb').read()
print('BOM:', data[:3].hex())
lines = data.split(b'\n')
print(f'Total lines: {len(lines)}')
line196 = lines[195]
print(f'Line 196 hex: {line196.hex()}')
print(f'Line 196 text: {line196.decode("utf-8", errors="replace")}')