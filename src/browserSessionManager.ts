import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";


export async function initializeBrowser() {
    const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
        headless: "new",
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=0', '--disable-dev-shm-usage']
    };

    const browser: Browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    if (browser) {
        console.log('Succesfully launched a new browser with Puppeteer');
    }

    return browser;
};


export async function closeBrowser(browser: Browser) {
    try {
        await browser.close();
        console.log('Browser closed successfully');
    } catch (error) {
        console.error('Error closing browser:', error);
    }
};


export async function openPageWithBrowser(browser: Browser, domain: string) {
    const url: string = `https://www.${domain}`;
    const page: Page = await browser.newPage();
    await page.goto(url);
    if (page) {
        console.log(`Successfully visited: ${url}`);
    }

    return page;
}


export async function closeCurrentPage(page: Page) {
    try {
        await page.close();
        console.log('Successfully closed page');
    } catch(error) {
        console.log('Error closing page', error);
    }
};


export function getPortOfBrowser(browser: Browser): number {
    return parseInt((new URL(browser.wsEndpoint())).port);
}


export function getUrlOfPage(page: Page): string {
    return String(new URL(page.url()));
}
