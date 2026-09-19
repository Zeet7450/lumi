from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = "http://127.0.0.1:3000"
OUTPUT = Path(__file__).parent / "public" / "screens"


def capture(page, route: str, filename: str, viewport: dict[str, int], dark: bool = False) -> None:
    page.set_viewport_size(viewport)
    page.goto(f"{ROOT}{route}", wait_until="networkidle")
    if dark:
        page.emulate_media(color_scheme="dark")
        page.reload(wait_until="networkidle")
    page.screenshot(path=OUTPUT / filename, full_page=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 960})
    page.set_default_timeout(10_000)

    capture(page, "/", "citizen-desktop.png", {"width": 1440, "height": 960})
    capture(page, "/", "citizen-desktop-dark.png", {"width": 1440, "height": 960}, dark=True)
    capture(page, "/", "citizen-mobile.png", {"width": 430, "height": 932})
    capture(page, "/panduan", "citizen-guidance.png", {"width": 1440, "height": 960})

    page.set_viewport_size({"width": 1440, "height": 960})
    page.goto(ROOT, wait_until="networkidle")
    page.evaluate("""sessionStorage.setItem('lumi-ops-preview-session', JSON.stringify({
        actor: {userId: 'video-demo-dlh', role: 'DLH'}, preview: true
    }))""")
    capture(page, "/ops/insiden", "ops-incidents.png", {"width": 1440, "height": 960})
    capture(page, "/ops/simulasi", "ops-simulation.png", {"width": 1440, "height": 960})
    capture(page, "/ops/publikasi", "ops-publication.png", {"width": 1440, "height": 960})
    browser.close()
