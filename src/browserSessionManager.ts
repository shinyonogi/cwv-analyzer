import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";


export async function initializeBrowser() {
    const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
        headless: "new",
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=0', '--disable-dev-shm-usage']
    };

    const browser: Browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    console.log('Browser initialized');

    return browser;
};


export async function closeBrowser(browser: Browser) {
    await browser.close();
    console.log('Browser closed');
};


export async function openPageWithBrowser(browser: Browser, domain: string): Promise<Page> {
    const url: string = `https://www.${domain}`;
    const page: Page = await browser.newPage();
    console.log('New Page initiated');
    try {
        await page.goto(url);
        console.log(`Visited: ${url}`);
    } catch(error) {
        console.log(`Could not visit: ${url}`);
        await closeCurrentPage(page);
        throw new Error(String(error));
    }

    return page;
}


export async function closeCurrentPage(page: Page) {
    await page.close();
    console.log(`Closed Page`);
};


export function getPortOfBrowser(browser: Browser): number {
    return parseInt((new URL(browser.wsEndpoint())).port);
}


export function getUrlOfPage(page: Page): string {
    return String(new URL(page.url()));
}
