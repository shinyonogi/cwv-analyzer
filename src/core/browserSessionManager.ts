import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";

/**
 * Initializes and returns a Puppeteer Browser instance with specified options.
 * @returns A promise that resolves to the initialized Browser instance.
 *
 * The Puppeteer options include:
 * - headless: Whether to run the browser in headless mode.
 * - defaultViewport: Default viewport settings (null for no default).
 * - args: Additional arguments for launching the browser.
 */
export async function initializeBrowser(): Promise<Browser> {
    const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
        headless: "new",
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=0', '--disable-dev-shm-usage']
    };

    const browser: Browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    console.log('Browser initialized');

    return browser;
};

/**
 * Closes the given Puppeteer Browser instance.
 * @param browser The Browser instance to close.
 */
export async function closeBrowser(browser: Browser): Promise<void> {
    await browser.close();
    console.log('Browser closed');
};

/**
 * Opens a new page in the given browser and navigates to the specified domain.
 * @param browser The Puppeteer Browser instance to use.
 * @param domain The domain to navigate to.
 * @returns A promise that resolves to the opened Page instance.
 *
 * Logs the process of opening and navigating to the page. In case of a navigation error,
 * the opened page is closed and the error is rethrown.
 */
export async function openPageWithBrowser(browser: Browser, domain: string): Promise<Page> {
    const url: string = `https://www.${domain}`;
    const page: Page = await browser.newPage();
    console.log('New Page initiated');
    try {
        console.log(`Attempting to visit: ${url}`)
        await page.goto(url);
        console.log(`Successfully visited: ${url}`);
    } catch(domainError) {
        console.log(`Could not visit: ${url}`);
        await closeCurrentPage(page);
        throw new Error(String(domainError));
    }

    return page;
}

/**
 * Closes the given Puppeteer Page instance.
 * @param page The Page instance to close.
 */
export async function closeCurrentPage(page: Page): Promise<void> {
    await page.close();
    console.log(`Closed Page`);
};

/**
 * Retrieves the port number of the WebSocket endpoint for the given Browser instance.
 * @param browser The Browser instance.
 * @returns The port number.
 */
export function getPortOfBrowser(browser: Browser): number {
    return parseInt((new URL(browser.wsEndpoint())).port);
}

/**
 * Retrieves the current URL of the given Page instance.
 * @param page The Page instance.
 * @returns The current URL of the page.
 */
export function getUrlOfPage(page: Page): string {
    return String(new URL(page.url()));
}
