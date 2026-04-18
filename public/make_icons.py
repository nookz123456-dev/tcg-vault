from PIL import Image, ImageDraw, ImageFont
import os

# Create 192x192 icon
img = Image.new('RGBA', (192, 192), (99, 102, 241, 255))
draw = ImageDraw.Draw(img)
# Draw a simple card shape
draw.rounded_rectangle([40, 20, 152, 172], radius=12, fill=(255, 255, 255, 240), outline=(255, 255, 255, 255), width=2)
# Draw "V" letter
try:
    font = ImageFont.truetype("arial.ttf", 80)
except:
    font = ImageFont.load_default()
draw.text((65, 45), "V", fill=(99, 102, 241, 255), font=font)

img.save(os.path.join(os.path.dirname(__file__), 'icon-192.png'))
# Create 512x512 icon
img2 = img.resize((512, 512), Image.Resampling.LANCZOS)
img2.save(os.path.join(os.path.dirname(__file__), 'icon-512.png'))
# Create favicon
img3 = img.resize((32, 32), Image.Resampling.LANCZOS)
img3.save(os.path.join(os.path.dirname(__file__), 'favicon.ico'))
print("Icons created!")