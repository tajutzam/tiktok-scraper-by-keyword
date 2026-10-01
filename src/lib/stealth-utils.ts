import type { Page } from "playwright";
import { Actor } from "apify";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
];

export function randomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function randomViewport(): { width: number; height: number } {
    return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}

/** Jeda acak dalam rentang [minMs, maxMs], meniru variasi waktu reaksi manusia. */
export async function humanDelay(minMs: number, maxMs: number): Promise<void> {
    const ms = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Gerakkan mouse dengan beberapa langkah kecil acak, lalu scroll bertahap — meniru pola manusia. */
export async function humanScroll(page: Page, distance = 1200): Promise<void> {
    const steps = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < steps; i++) {
        const x = 300 + Math.random() * 800;
        const y = 200 + Math.random() * 500;
        await page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 10) });
        await humanDelay(80, 250);
    }

    const wheelSteps = 2 + Math.floor(Math.random() * 3);
    const perStep = distance / wheelSteps;
    for (let i = 0; i < wheelSteps; i++) {
        await page.mouse.wheel(0, perStep + (Math.random() * 100 - 50));
        await humanDelay(150, 400);
    }
}

const SESSION_STORE_ID = process.env.STEALTH_SESSION_STORE_ID ?? "tiktok-stealth-sessions";

/** Simpan cookies browser saat ini ke KV store, dikunci per keyword (biar sesi bisa dipakai ulang). */
export async function saveSessionCookies(page: Page, sessionKey: string): Promise<void> {
    try {
        const cookies = await page.context().cookies();
        const store = await Actor.openKeyValueStore(SESSION_STORE_ID);
        await store.setValue(sessionKey, { cookies, savedAt: new Date().toISOString() });
    } catch {
        // Non-fatal: gagal menyimpan sesi tidak boleh menghentikan run.
    }
}

/** Muat cookies tersimpan (jika ada dan belum kedaluwarsa) supaya sesi terlihat "sudah lama ada". */
export async function loadSessionCookies(page: Page, sessionKey: string, maxAgeHours = 12): Promise<boolean> {
    try {
        const store = await Actor.openKeyValueStore(SESSION_STORE_ID);
        const saved = await store.getValue<{ cookies: any[]; savedAt: string }>(sessionKey);
        if (!saved?.cookies?.length) return false;

        const ageHours = (Date.now() - new Date(saved.savedAt).getTime()) / 3600000;
        if (ageHours > maxAgeHours) return false;

        await page.context().addCookies(saved.cookies);
        return true;
    } catch {
        return false;
    }
}
