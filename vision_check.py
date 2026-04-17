import base64, json, sys, urllib.request

img_path = sys.argv[1]
with open(img_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()

payload = json.dumps({
    "model": "gemma3:4b",
    "messages": [{"role": "user", "content": "Describe this screenshot of a TCG card website. What language is the card name in? Is there a Japanese name visible? What sections are shown?", "images": [b64]}],
    "stream": False
}).encode()

req = urllib.request.Request("http://localhost:11434/api/chat", data=payload, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req, timeout=60)
data = json.loads(resp.read())
print(data["message"]["content"])