"""
Generate a clean, minimal Timestamp app icon.
Dark background, white clock face, subtle date stamp text.
"""
from PIL import Image, ImageDraw
import math

def make_icon(size=512):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2

    # --- Rounded square background ---
    r = int(size * 0.18)  # corner radius
    bg_color = (14, 14, 14, 255)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg_color)

    # --- Outer clock ring ---
    ring_r = int(size * 0.36)
    ring_w = int(size * 0.025)
    draw.ellipse(
        [cx - ring_r, cy - ring_r - int(size*0.04),
         cx + ring_r, cy + ring_r - int(size*0.04)],
        outline=(220, 220, 220, 255), width=ring_w
    )

    clock_cy = cy - int(size * 0.04)

    # --- Hour tick marks ---
    for i in range(12):
        angle = math.radians(i * 30 - 90)
        if i % 3 == 0:
            outer = ring_r - ring_w
            inner = outer - int(size * 0.045)
            lw = int(size * 0.018)
        else:
            outer = ring_r - ring_w
            inner = outer - int(size * 0.025)
            lw = int(size * 0.012)
        x1 = cx + outer * math.cos(angle)
        y1 = clock_cy + outer * math.sin(angle)
        x2 = cx + inner * math.cos(angle)
        y2 = clock_cy + inner * math.sin(angle)
        draw.line([x1, y1, x2, y2], fill=(200, 200, 200, 220), width=lw)

    # --- Hour hand (pointing ~10 o'clock) ---
    hour_angle = math.radians(300 - 90)  # 10 o'clock
    hour_len = ring_r * 0.52
    draw.line(
        [cx, clock_cy,
         cx + hour_len * math.cos(hour_angle),
         clock_cy + hour_len * math.sin(hour_angle)],
        fill=(255, 255, 255, 255), width=int(size * 0.028)
    )

    # --- Minute hand (pointing ~2 o'clock) ---
    min_angle = math.radians(60 - 90)  # 2 o'clock
    min_len = ring_r * 0.72
    draw.line(
        [cx, clock_cy,
         cx + min_len * math.cos(min_angle),
         clock_cy + min_len * math.sin(min_angle)],
        fill=(255, 255, 255, 255), width=int(size * 0.02)
    )

    # --- Center dot ---
    dot_r = int(size * 0.022)
    draw.ellipse(
        [cx - dot_r, clock_cy - dot_r, cx + dot_r, clock_cy + dot_r],
        fill=(255, 255, 255, 255)
    )

    # --- Date stamp bar at bottom ---
    bar_y = cy + int(size * 0.30)
    bar_h = int(size * 0.11)
    bar_w = int(size * 0.56)
    bar_x = cx - bar_w // 2
    bar_r2 = int(bar_h * 0.35)
    draw.rounded_rectangle(
        [bar_x, bar_y, bar_x + bar_w, bar_y + bar_h],
        radius=bar_r2,
        fill=(40, 40, 40, 255),
        outline=(80, 80, 80, 255),
        width=int(size * 0.007)
    )

    # Draw simple pixel-art style date digits "10·10"
    # Use basic block rects to represent digits since no font needed
    def draw_colon(px, py, dot_size):
        draw.ellipse([px, py, px+dot_size, py+dot_size], fill=(180,180,180,220))
        draw.ellipse([px, py+dot_size*2, px+dot_size, py+dot_size*3], fill=(180,180,180,220))

    # Small date text placeholder — three horizontal lines (like redacted lines)
    line_y = bar_y + int(bar_h * 0.28)
    line_h2 = int(bar_h * 0.12)
    lc = (150, 150, 150, 200)
    seg_w = int(bar_w * 0.26)
    gap = int(bar_w * 0.06)
    lx1 = bar_x + int(bar_w * 0.1)
    draw.rounded_rectangle([lx1, line_y, lx1 + seg_w, line_y + line_h2], radius=2, fill=lc)
    lx2 = lx1 + seg_w + gap
    draw.rounded_rectangle([lx2, line_y, lx2 + seg_w, line_y + line_h2], radius=2, fill=lc)
    lx3 = lx2 + seg_w + gap
    draw.rounded_rectangle([lx3, line_y, bar_x + int(bar_w*0.9), line_y + line_h2], radius=2, fill=lc)

    line_y2 = line_y + int(bar_h * 0.32)
    draw.rounded_rectangle([lx1, line_y2, lx1 + int(seg_w*1.6), line_y2 + line_h2], radius=2, fill=(120,120,120,160))

    return img


def save_ico(img, path):
    sizes = [16, 32, 48, 64, 128, 256]
    imgs = []
    for s in sizes:
        resized = img.resize((s, s), Image.LANCZOS)
        # Convert to RGBA for ICO
        imgs.append(resized)
    imgs[0].save(
        path,
        format='ICO',
        sizes=[(s, s) for s in sizes],
        append_images=imgs[1:]
    )
    print(f"Saved ICO: {path}")


if __name__ == '__main__':
    icon = make_icon(512)
    icon.save('icon.png', format='PNG')
    print("Saved icon.png")
    save_ico(icon, 'icon.ico')
    print("Done!")
