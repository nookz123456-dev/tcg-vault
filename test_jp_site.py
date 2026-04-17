import urllib.request, json

# Try PokeAPI for Japanese names
# Pikachu = 25
url = 'https://pokeapi.co/api/v2/pokemon-species/25/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urllib.request.urlopen(req, timeout=10)
    data = json.loads(r.read().decode('utf-8'))
    print(f'PokeAPI species 25:')
    print(f'  English name: {data["name"]}')
    names = data.get('names', [])
    for n in names:
        print(f'  {n["language"]["name"]}: {n["name"]}')
except Exception as e:
    print(f'Error: {e}')

# Try with Charizard (6)
print('\n--- Charizard (6) ---')
url2 = 'https://pokeapi.co/api/v2/pokemon-species/6/'
try:
    req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    r2 = urllib.request.urlopen(req2, timeout=10)
    data2 = json.loads(r2.read().decode('utf-8'))
    for n in data2.get('names', []):
        if n['language']['name'] in ('ja', 'ja-Hrkt', 'en'):
            print(f'  {n["language"]["name"]}: {n["name"]}')
except Exception as e:
    print(f'Error: {e}')

# Try with Mewtwo (150)
print('\n--- Mewtwo (150) ---')
url3 = 'https://pokeapi.co/api/v2/pokemon-species/150/'
try:
    req3 = urllib.request.Request(url3, headers={'User-Agent': 'Mozilla/5.0'})
    r3 = urllib.request.urlopen(req3, timeout=10)
    data3 = json.loads(r3.read().decode('utf-8'))
    for n in data3.get('names', []):
        if n['language']['name'] in ('ja', 'ja-Hrkt', 'en'):
            print(f'  {n["language"]["name"]}: {n["name"]}')
except Exception as e:
    print(f'Error: {e}')