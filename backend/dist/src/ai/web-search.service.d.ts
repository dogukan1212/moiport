export declare class WebSearchService {
    private readonly logger;
    private readonly serperApiKey;
    search(query: string): Promise<any>;
    scrapeWebsite(url: string): Promise<string>;
}
