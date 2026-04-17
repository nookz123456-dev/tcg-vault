import urllib.request, json

# The asset URL returns HTML. Let's check what format the actual image is
url = 'https://assets.tcgdex.net/ja/SV/SV2D/017'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urllib.request.urlopen(req, timeout=10)
    html = r.read().decode('utf-8', 'ignore')
    print(f'Asset page HTML ({len(html)} bytes):')
    print(html[:1000])
except Exception as e:
    print(f'Error: {e}')

# Try common image extensions
print('\n=== Try image extensions ===')
base_url = 'https://assets.tcgdex.net/ja/SV/SV2D/017'
exts = ['.png', '.jpg', '.webp', '/high.webp', '/high.png', '/low.png', '/high.jpg']
for ext in exts:
    try:
        req = urllib.request.Request(base_url + ext, headers={'User-Agent': 'Mozilla/5.0'})
        r = urllib.request.urlopen(req, timeout=5)
        ct = r.headers.get('Content-Type', '')
        cl = r.headers.get('Content-Length', '?')
        print(f'{ext} => {r.status} | {ct} | {cl} bytes')
    except Exception as e:
        print(f'{ext} => {e}')

# Let's also check the full card data from TCGdex
print('\n=== Full card data from TCGdex ===')
# Try fetching a specific card by ID
url2 = 'https://api.tcgdex.net/v2/ja/cards/SV2D-017'
try:
    req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    r2 = urllib.request.urlopen(req2, timeout=10)
    data2 = json.loads(r2.read().decode('utf-8', 'ignore'))
    print(json.dumps(data2, ensure_ascii=False, indent=2)[:1500])
except Exception as e:
    print(f'Error: {e}')

# Try another format for card detail
url3 = 'https://api.tcgdex.net/v2/ja/SV2D/017'
try:
    req3 = urllib.request.Request(url3, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    r3 = urllib.request.urlopen(req3, timeout=10)
    data3 = json.loads(r3.read().decode('utf-8', 'ignore'))
    print(f'\nAlt format: {json.dumps(data3, ensure_ascii=False, indent=2)[:1500]}')
except Exception as e:
    print(f'Alt format error: {e}')