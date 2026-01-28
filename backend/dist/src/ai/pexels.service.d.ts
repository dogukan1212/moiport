export interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    alt: string;
}
export interface PexelsResponse {
    total_results: number;
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    next_page?: string;
}
export declare class PexelsService {
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    searchPhotos(query: string, perPage?: number, locale?: string): Promise<PexelsPhoto[]>;
}
