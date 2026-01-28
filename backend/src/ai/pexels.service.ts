import { Injectable, Logger } from '@nestjs/common';

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

@Injectable()
export class PexelsService {
  private readonly logger = new Logger(PexelsService.name);
  private readonly apiKey =
    process.env.PEXELS_API_KEY ||
    '8BObfK1yHw1cGepDsc00zew3KINAIgKDSMqqx5fhd06Nrz9e1KjF7k8G'; // Fallback for dev
  private readonly baseUrl = 'https://api.pexels.com/v1';

  async searchPhotos(
    query: string,
    perPage: number = 10,
    locale: string = 'tr-TR',
  ): Promise<PexelsPhoto[]> {
    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.append('query', query);
      url.searchParams.append('per_page', perPage.toString());
      url.searchParams.append('locale', locale);
      url.searchParams.append('orientation', 'landscape'); // Blog posts usually use landscape

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API Error: ${response.statusText}`);
      }

      const data: PexelsResponse = await response.json();
      return data.photos;
    } catch (error) {
      this.logger.error(
        `Error fetching photos from Pexels: ${error.message}`,
        error.stack,
      );
      return []; // Return empty array on error to avoid breaking the UI
    }
  }
}
