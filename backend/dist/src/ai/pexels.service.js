"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PexelsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PexelsService = void 0;
const common_1 = require("@nestjs/common");
let PexelsService = PexelsService_1 = class PexelsService {
    logger = new common_1.Logger(PexelsService_1.name);
    apiKey = process.env.PEXELS_API_KEY ||
        '8BObfK1yHw1cGepDsc00zew3KINAIgKDSMqqx5fhd06Nrz9e1KjF7k8G';
    baseUrl = 'https://api.pexels.com/v1';
    async searchPhotos(query, perPage = 10, locale = 'tr-TR') {
        try {
            const url = new URL(`${this.baseUrl}/search`);
            url.searchParams.append('query', query);
            url.searchParams.append('per_page', perPage.toString());
            url.searchParams.append('locale', locale);
            url.searchParams.append('orientation', 'landscape');
            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: this.apiKey,
                },
            });
            if (!response.ok) {
                throw new Error(`Pexels API Error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.photos;
        }
        catch (error) {
            this.logger.error(`Error fetching photos from Pexels: ${error.message}`, error.stack);
            return [];
        }
    }
};
exports.PexelsService = PexelsService;
exports.PexelsService = PexelsService = PexelsService_1 = __decorate([
    (0, common_1.Injectable)()
], PexelsService);
//# sourceMappingURL=pexels.service.js.map