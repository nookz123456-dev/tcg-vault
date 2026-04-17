data = open(r'C:\Users\suwij\.openclaw\workspace\tcg-vault\src\app\discussions\page.tsx', encoding='utf-8').readlines()
for i, line in enumerate(data):
    if 193 <= i <= 200:
        print(f'{i+1}: {repr(line.rstrip())}')