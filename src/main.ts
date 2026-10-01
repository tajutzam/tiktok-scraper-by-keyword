import { Actor } from "apify";
import { PlaywrightCrawler, ProxyConfiguration } from "crawlee";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { Input } from "./interfaces/Input.js";
import { mapAwemeInfoToSimple, mapAwemeInfoToSnakeCase } from "./lib/transform.js";
import { humanDelay, humanScroll, loadSessionCookies, randomUserAgent, randomViewport, saveSessionCookies } from "./lib/stealth-utils.js";

chromium.use(stealth());

await Actor.init();
const input: Input = (await Actor.getInput<Input>()) ?? ({} as any);

const proxyConfiguration = process.env.PROXY_URL
    ? new ProxyConfiguration({ proxyUrls: [process.env.PROXY_URL] })
    : process.env.APIFY_PROXY_PASSWORD
      ? await Actor.createProxyConfiguration()
      : undefined;

if (!input.keyword) {
    throw new Error('Input "keyword" is required.');
}

const outputFormat = input.outputFormat === "simple" ? "simple" : "transform";

const crawler = new PlaywrightCrawler({
    headless: true,
    maxConcurrency: 1,
    proxyConfiguration,
    requestHandlerTimeoutSecs: 300,
    browserPoolOptions: {
        useFingerprints: false,
    },
    launchContext: {
        launcher: chromium,
        launchOptions: {
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ],
        },
        userAgent: randomUserAgent(),
    },
    preNavigationHooks: [
        async ({ page }) => {
            await page.setViewportSize(randomViewport());
        },
    ],
    async requestHandler({ page, log }) {
        let responsesCaptured = 0;
        let itemsCaptured = 0;
        const processedIds = new Set<string>();
        const maxItems = Number(input.maxItems) || 50;

        const sessionKey = `keyword-${input.keyword}`;
        const hasSession = await loadSessionCookies(page, sessionKey);
        log.info(hasSession ? 'Sesi tersimpan ditemukan, cookies dimuat ulang.' : 'Tidak ada sesi tersimpan, mulai sebagai guest baru.');

        log.info('Membuka halaman home TikTok untuk mendapatkan cookies guest...');

        await page.goto('https://www.tiktok.com', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        // Tunggu halaman selesai dimuat dan cookies guest terbentuk (jeda acak, bukan tetap)
        await humanDelay(4000, 7000);

        // Ambil cookies dari browser context untuk log/debugging
        const cookies = await page.context().cookies();
        log.info(`Berhasil mendapatkan ${cookies.length} cookies guest dari halaman home.`);

        // Log beberapa cookies penting untuk debugging
        const importantCookies = cookies
            .filter(c => ['sessionid', 'tt_webid', 'tt_webid_v2', 'ttwid', 'msToken', 's_v_web_id'].includes(c.name))
            .map(c => c.name);
        log.info(`Cookies penting yang ditemukan: ${importantCookies.join(', ') || '(tidak ada yang cocok)'}`);

        page.on("response", async (response) => {
            const url = response.url();

            // Tangkap hanya endpoint API search yang spesifik
            if (!url.includes("/api/search/general/full/")) return;

            try {
                const json = await response.json();

                // Ambil data yang type 1 saja (video)
                const type1Data = (json?.data || []).filter((entry: any) => entry.type === 1);

                if (type1Data.length > 0) {
                    responsesCaptured++;

                    if (outputFormat === "simple") {
                        for (const entry of type1Data) {
                            if (itemsCaptured >= maxItems) break;

                            const rawItem = entry.item ?? entry.aweme_info;
                            const id = rawItem?.id ?? rawItem?.aweme_id;
                            if (!id || processedIds.has(id)) continue;

                            await Actor.pushData(mapAwemeInfoToSimple(rawItem, input.keyword));
                            processedIds.add(id);
                            itemsCaptured++;
                        }
                        log.info(`Captured: ${itemsCaptured}/${maxItems} - Response API #${responsesCaptured}.`);
                    } else {
                        const dataItems: any[] = [];
                        for (const entry of type1Data) {
                            if (itemsCaptured >= maxItems) break;

                            const rawItem = entry.item ?? entry.aweme_info;
                            const id = rawItem?.id ?? rawItem?.aweme_id;
                            if (!id || processedIds.has(id)) continue;

                            const { item, ...restEntry } = entry;
                            dataItems.push({ ...restEntry, aweme_info: mapAwemeInfoToSnakeCase(rawItem) });
                            processedIds.add(id);
                            itemsCaptured++;
                        }

                        if (dataItems.length > 0) {
                            await Actor.pushData({
                                data: {
                                    nextCursor: json?.cursor ?? json?.nextCursor,
                                    data: dataItems,
                                },
                            });
                            log.info(`Captured: ${itemsCaptured}/${maxItems} - Response API #${responsesCaptured} berisi ${dataItems.length} item baru.`);
                        }
                    }
                }
            } catch (e: any) {
                // Response preflight/OPTIONS tidak punya JSON body, abaikan saja
            }
        });

        const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(input.keyword)}`;
        log.info(`Navigasi ke halaman search: ${searchUrl}`);

        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        await humanDelay(4000, 6000);

        const captchaSelectors = [
            'div#captcha-verify-container',
            'div.captcha_verify_container',
            'iframe[src*="captcha"]',
            'text=Verify to continue',
        ];

        let captchaDetected = false;
        for (const selector of captchaSelectors) {
            if (await page.locator(selector).first().isVisible().catch(() => false)) {
                captchaDetected = true;
                break;
            }
        }

        if (captchaDetected) {
            await page.screenshot({ path: 'captcha-detected.png', fullPage: false }).catch(() => {});
            log.error('Captcha terdeteksi di halaman search. Actor dihentikan — butuh proxy/session baru atau penyelesaian captcha manual.');
            await Actor.exit('Captcha terdeteksi, run dihentikan.');
        }

        const maxReloadAttempts = 5;
        for (let attempt = 1; attempt <= maxReloadAttempts; attempt++) {
            const errorVisible = await page
                .getByText('Something went wrong', { exact: false })
                .isVisible()
                .catch(() => false);

            if (!errorVisible) break;

            log.warning(`Search page error (percobaan ${attempt}/${maxReloadAttempts}), reload...`);
            const tryAgainButton = page.getByText('Try again', { exact: false });
            if (await tryAgainButton.isVisible().catch(() => false)) {
                await tryAgainButton.click();
            } else {
                await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
            }
            await humanDelay(2000, 4000);
        }

        let retries = 0;
        while (retries < 7 && itemsCaptured < maxItems) {
            const beforeCount = itemsCaptured;

            log.info(`Scrolling... Status: ${itemsCaptured}/${maxItems} (Percobaan stagnant: ${retries})`);

            await humanScroll(page, 1200 + Math.random() * 600);
            await humanDelay(3500, 6500);

            if (itemsCaptured === beforeCount) {
                retries++;
            } else {
                retries = 0;
            }
        }

        await saveSessionCookies(page, sessionKey);
        log.info(`Selesai! Total item terkumpul: ${itemsCaptured} (dari ${responsesCaptured} response API)`);
    },
});

const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(input.keyword)}`;
await crawler.run([searchUrl]);
await Actor.exit();
