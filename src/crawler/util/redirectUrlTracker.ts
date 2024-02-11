import axios, { AxiosError } from 'axios';

interface IUrl {
    _url: string | null;
    get url(): string | null;
    preCheckUrl(): Promise<void>;
}

export default async function urlPreCheckFactory(domain: string): Promise<string | null> {
    const url: IUrl = {
        _url: domain,
        get url() { return this._url; },
        preCheckUrl: preCheckUrl
    }
    await url.preCheckUrl();
    return url.url;
}

async function preCheckUrl(this: IUrl): Promise<void> {
    const prefixes = ['https://www.', 'https://', 'http://www.', 'http://'];
    for (const prefix of prefixes) {
      try {
        const fullUrl = prefix + this._url;
        const response = await axios.get(fullUrl, {
          maxRedirects: 5,
          timeout: 10000
        });

        if (response.status === 200 || (response.status >= 300 && response.status < 400)) {
          this._url = response.request.res.responseUrl || fullUrl;
          return;
        }
      } catch (error) {
        if (error instanceof AxiosError) console.log(`Failed to fetch ${prefix}${this._url}: ${error}`);
        else console.error(`Failed to fetch ${prefix}${this._url}: ${error}`);
      }
    }
    console.log(`Url pre-checking did not work for ${this._url}`);
    this._url = null;
}

