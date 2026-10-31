"""Prepare scroll frames from the supplied brand reveal (requires PyAV and Pillow)."""
import argparse
import json
from pathlib import Path

import av
from PIL import Image, ImageStat

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("--output", type=Path, default=Path("public/experience/brand-reveal"))
parser.add_argument("--start-frame", type=int, default=30)
parser.add_argument("--desktop-width", type=int, default=1120)
parser.add_argument("--quality", type=int, default=83)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
for folder in ("desktop", "mobile"):
    (args.output / folder).mkdir(exist_ok=True)

# The original opening is cropped at both edges. At 1.25 seconds the full emblem
# has breathing room; use that exact source frame as the poster and frame zero.
first_source_frame = args.start_frame
desktop_size = (args.desktop_width, round(args.desktop_width * 9 / 16))
count = 0
with av.open(str(args.source)) as container:
    stream = container.streams.video[0]
    rate = float(stream.average_rate)
    for source_index, frame in enumerate(container.decode(video=0)):
        if source_index < first_source_frame:
            continue
        image = frame.to_image()
        for folder, size, quality in [("desktop", desktop_size, args.quality), ("mobile", (640, 360), 81)]:
            image.resize(size).save(args.output / folder / f"{count:03}.webp", quality=quality, method=4)
        count += 1

manifest = {"frames": count, "fps": rate, "sourceStartSeconds": first_source_frame / rate,
            "sourceStartFrame": first_source_frame, "width": desktop_size[0], "height": desktop_size[1],
            "mobileWidth": 640, "mobileHeight": 360}
(args.output / "manifest.json").write_text(json.dumps(manifest, indent=2))
backdrops = []
for path in sorted((args.output / "desktop").glob("*.webp")):
    with Image.open(path) as image:
        width, height = image.size
        corners = [(2, 2, 28, 28), (width-28, 2, width-2, 28),
                   (2, height-28, 28, height-2), (width-28, height-28, width-2, height-2)]
        backdrops.append(["rgb(" + ",".join(str(round(v)) for v in ImageStat.Stat(image.crop(box)).mean[:3]) + ")" for box in corners])
(args.output / "backdrops.json").write_text(json.dumps(backdrops, separators=(",", ":")))
print(json.dumps(manifest))
print("Total frame bytes:", sum(p.stat().st_size for p in args.output.rglob("*.webp")))
