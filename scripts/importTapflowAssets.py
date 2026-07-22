from __future__ import annotations

from io import BytesIO
from pathlib import Path
import json
import urllib.request

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
ASSET_LIST = WORKSPACE / "tapflow-assets.json"
OUT_ROOT = ROOT / "public" / "assets" / "tapflow"


ASSETS: dict[str, list[tuple[str, str, tuple[int, int], int]]] = {
    "scenes": [
        ("hall", "大厅", (1600, 900), 82),
        ("plaza", "广场", (1600, 900), 82),
        ("dormitory", "宿舍", (1600, 900), 82),
        ("sister-room", "师姐居室", (1600, 900), 82),
        ("meditation-room", "闭关室", (1600, 900), 82),
        ("forge", "炼器坊", (1600, 900), 82),
        ("alchemy-room", "炼丹房", (1600, 900), 82),
        ("spirit-garden", "灵植园", (1600, 900), 82),
        ("teleport-array", "传送阵", (1600, 900), 82),
    ],
    "portraits": [
        ("player-normal", "主角-普通", (640, 960), 80),
        ("player-happy", "主角-开心", (640, 960), 80),
        ("player-serious", "主角-认真", (640, 960), 80),
        ("player-snark", "主角-吐槽", (640, 960), 80),
        ("player-combat", "主角-战斗", (640, 960), 80),
        ("lu-normal", "鹿真人-普通", (640, 960), 80),
        ("lu-happy", "鹿真人-开心", (640, 960), 80),
        ("lu-serious", "鹿真人-认真", (640, 960), 80),
        ("lu-snark", "鹿真人-吐槽", (640, 960), 80),
        ("xiaoxian-normal", "小娴-普通", (640, 960), 80),
        ("xiaoxian-happy", "小娴-开心", (640, 960), 80),
        ("xiaoxian-serious", "小娴-认真", (640, 960), 80),
        ("xiaoxian-snark", "小娴-吐槽", (640, 960), 80),
        ("xiaozhang-normal", "小张-普通", (640, 960), 80),
        ("xiaozhang-happy", "小张-开心", (640, 960), 80),
        ("xiaozhang-serious", "小张-认真", (640, 960), 80),
        ("xiaozhang-snark", "小张-吐槽", (640, 960), 80),
        ("yangqi", "羊七", (640, 960), 80),
        ("douran", "豆髯", (640, 960), 80),
        ("chuchu", "楚凌", (640, 960), 80),
        ("xiaolu", "鹿宁", (640, 960), 80),
        ("chunqiong", "春琼", (640, 960), 80),
        ("wanhua-body", "万化道躯", (640, 960), 80),
    ],
    "ui": [
        ("dialogue-box", "对话框", (1200, 340), 86),
        ("nameplate", "姓名框", (600, 180), 86),
        ("scene-button", "场景切换按钮", (360, 120), 86),
        ("avatar-frame", "头像", (180, 180), 86),
        ("spirit-stone", "灵石", (256, 256), 86),
        ("spirit-marrow", "灵髓", (256, 256), 86),
        ("herb", "草药", (256, 256), 86),
        ("ore", "矿石", (256, 256), 86),
        ("pill", "丹药", (256, 256), 86),
        ("wanhua-body-icon", "万化道躯", (256, 256), 86),
    ],
    "events": [
        ("mouse-cave-mouth", "山鼠洞洞口", (1600, 900), 82),
        ("mouse-cave-depths", "山鼠洞深处", (1600, 900), 82),
        ("mouse-cave", "山鼠洞", (1600, 900), 82),
        ("mouse-cave-battle", "山鼠洞战斗示意", (1600, 900), 82),
        ("mouse-king-appears", "山鼠王出现", (1600, 900), 82),
        ("mouse-king-defeated", "山鼠王落败", (1600, 900), 82),
        ("bridge-village-gate", "断桥村村口", (1600, 900), 82),
        ("bridge-broken-side", "断桥村-断桥边", (1600, 900), 82),
        ("bridge-battle", "断桥村战斗示意图", (1600, 900), 82),
        ("wish-eater-reveal", "啖愿妖失去伪装", (1600, 900), 82),
        ("wish-eater", "啖愿妖", (1600, 900), 82),
        ("battle-end", "战斗结束", (1600, 900), 82),
    ],
    "monsters": [
        ("mouse-king", "山鼠王", (900, 900), 82),
        ("mouse-minion", "山鼠仔", (640, 640), 82),
        ("wish-eater", "啖愿妖", (900, 900), 82),
    ],
}


def download_image(url: str) -> Image.Image:
    with urllib.request.urlopen(url) as response:
        payload = response.read()
    return Image.open(BytesIO(payload)).convert("RGBA")


def main() -> None:
    source_items = json.loads(ASSET_LIST.read_text(encoding="utf-8"))
    source_by_title = {
        item["title"]: item["url"]
        for item in source_items
        if item.get("type") == "image" and item.get("title") and item.get("url")
    }

    manifest: dict[str, dict[str, str | int]] = {}
    for section, items in ASSETS.items():
        for filename, title, max_size, quality in items:
            if title not in source_by_title:
                raise RuntimeError(f"TapFlow asset title not found: {title}")

            url = source_by_title[title]
            image = download_image(url)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)

            out_path = OUT_ROOT / section / f"{filename}.webp"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            image.save(out_path, format="WEBP", quality=quality, method=6)

            manifest[f"{section}/{filename}"] = {
                "title": title,
                "source": url,
                "file": out_path.relative_to(ROOT).as_posix(),
                "bytes": out_path.stat().st_size,
            }
            print(f"{out_path.relative_to(ROOT).as_posix()} {out_path.stat().st_size}")

    (OUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
