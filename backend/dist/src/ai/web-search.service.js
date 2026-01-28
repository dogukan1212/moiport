"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WebSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
let WebSearchService = WebSearchService_1 = class WebSearchService {
    logger = new common_1.Logger(WebSearchService_1.name);
    serperApiKey = process.env.SERPER_API_KEY;
    async search(query) {
        if (!this.serperApiKey) {
            this.logger.warn('SERPER_API_KEY not found. Falling back to basic simulation.');
            return [];
        }
        try {
            const response = await axios_1.default.post('https://google.serper.dev/search', { q: query, gl: 'tr', hl: 'tr' }, {
                headers: {
                    'X-API-KEY': this.serperApiKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.organic.map((item) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
            }));
        }
        catch (error) {
            this.logger.error('Search error:', error);
            return [];
        }
    }
    async scrapeWebsite(url) {
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio.load(String(response.data ?? ''));
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
        }
        catch (error) {
            this.logger.warn(`Could not scrape ${url}: ${error.message}`);
            return `Site: ${url} (Erişilemedi)`;
        }
    }
};
exports.WebSearchService = WebSearchService;
exports.WebSearchService = WebSearchService = WebSearchService_1 = __decorate([
    (0, common_1.Injectable)()
], WebSearchService);
//# sourceMappingURL=web-search.service.js.map