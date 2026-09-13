import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const dir = new URL("../shots/", import.meta.url);
mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: [
    "--use-angle=d3d11",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--window-size=1440,900",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

page.on("pageerror", (err) => console.log("PAGEERROR", err.message, err.stack));
page.on("requestfailed", (req) =>
  console.log("REQFAIL", req.url(), req.failure()?.errorText),
);
page.on("response", (res) => {
  if (res.status() >= 400) console.log("HTTP", res.status(), res.url());
});
page.on("console", (msg) => {
  console.log("CONSOLE", msg.type(), msg.text());
});

await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 20000 });
await page.waitForSelector("#stage");
await new Promise((r) => setTimeout(r, 4000));

const gl = await page.evaluate(() => {
  const c = document.querySelector("#stage");
  if (!(c instanceof HTMLCanvasElement)) return "no canvas";
  const ctx = c.getContext("webgl2") || c.getContext("webgl");
  return ctx ? `ok ${c.width}x${c.height}` : "no gl";
});
console.log("GL", gl);

await page.screenshot({ path: new URL("hero.png", dir), type: "png" });

await page.keyboard.type("The quick brown fox", { delay: 40 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: new URL("typed.png", dir), type: "png" });

await page.click('[data-focus="typebars"]');
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: new URL("typebars.png", dir), type: "png" });

await browser.close();
console.log("ok");
