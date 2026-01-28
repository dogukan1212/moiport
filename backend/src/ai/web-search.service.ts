import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);
  private readonly serperApiKey = process.env.SERPER_API_KEY;

  async search(query: string) {
    if (!this.serperApiKey) {
      this.logger.warn(
        'SERPER_API_KEY not found. Falling back to basic simulation.',
      );
      return [];
    }

    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        { q: query, gl: 'tr', hl: 'tr' },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.organic.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
    } catch (error) {
      this.logger.error('Search error:', error);
      return [];
    }
  }

  async scrapeWebsite(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(String(response.data ?? ''));

      // Remove noise
      $('script, style, nav, footer, iframe, ads').remove();

      const title = $('title').text();
      const h1s = $('h1')
        .map((i, el) => $(el).text())
        .get()
        .join(' ');
      const h2s = $('h2')
        .map((i, el) => $(el).text())
        .get()
        .join(' ');
      const mainText = $('p')
        .map((i, el) => $(el).text())
        .get()
        .join(' ')
        .substring(0, 3000);

      return `Site: ${url}\nTitle: ${title}\nHeadings: ${h1s} ${h2s}\nContent: ${mainText}`;
    } catch (error) {
      this.logger.warn(`Could not scrape ${url}: ${error.message}`);
      return `Site: ${url} (Erişilemedi)`;
    }
  }
}
