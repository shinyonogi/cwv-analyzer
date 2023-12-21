import axios, { AxiosError } from 'axios';

interface IUrl {
    _url: string;
    get url(): string;
    checkUrl(): Promise<void>;
}

export default async function urlFactory(domain: string): Promise<string> {
    const url: IUrl = {
        _url: domain,
        get url() { return this._url; },
        checkUrl: checkUrl
    }
    await url.checkUrl();
    return url.url;
}

async function checkUrl(this: IUrl): Promise<void> {
    const prefixes = ['https://www.', 'https://', 'http://www.', 'http://'];
    for (const prefix of prefixes) {
      try {
        const fullUrl = prefix + this._url;
        const response = await axios.get(fullUrl, {
          maxRedirects: 5,
          timeout: 5000
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
    console.log(`Url ${this._url} seems not working. It will still try to access with the given url.`);
    this._url = `https://${this._url}`;
}

