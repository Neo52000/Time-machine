import { expect, test } from "@playwright/test";

test("sitemap lists every era and museum gallery", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  for (const eraId of ["1985", "1992", "1998", "2005"]) {
    expect(xml).toContain(`/museum/${eraId}</loc>`);
    expect(xml).toContain(`/era/${eraId}/loading</loc>`);
  }
  expect(xml).not.toContain("/desktop</loc>");
});

test("robots keeps desktops and local analytics out of the index", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Disallow: /analytics");
  expect(txt).toContain("Disallow: /era/*/desktop");
  expect(txt).toMatch(/Sitemap: .*\/sitemap\.xml/);
});

test("shared pages carry a share card", async ({ page, request }) => {
  await page.goto("/museum/1992");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toContain("/museum/1992/opengraph-image");
  const res = await request.get(new URL(image!).pathname + new URL(image!).search);
  expect(res.headers()["content-type"]).toBe("image/png");
});
