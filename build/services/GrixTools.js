import { z } from "zod";
import axios from "axios";
// Request schemas
export const OptionsRequestSchema = z.object({
    asset: z.enum(["BTC", "ETH"]).optional().default("BTC"),
    optionType: z.enum(["call", "put"]).optional().default("call"),
    positionType: z.enum(["long", "short"]).optional().default("long"),
});
export class GrixTools {
    constructor() {
        this.cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
        this.apiKey = process.env.GRIX_API_KEY || "";
        this.baseUrl = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev";
        this.defaultProtocols = ["derive", "aevo", "premia", "moby", "ithaca", "zomma", "deribit"];
        this.optionsCache = {
            lastUpdate: 0,
            data: null,
        };
    }
    shouldRefreshCache() {
        return Date.now() - this.optionsCache.lastUpdate > this.cacheExpiryMs;
    }
    formatOptionData(option) {
        return {
            id: option.optionId,
            symbol: option.symbol,
            type: option.type,
            expiry: option.expiry,
            strike: option.strike,
            protocol: option.protocol,
            price: option.contractPrice,
            amount: option.availableAmount,
            market: option.marketName,
        };
    }
    async makeRequest(endpoint, params = {}) {
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: {
                    "x-api-key": this.apiKey,
                },
                params,
            });
            return response.data;
        }
        catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }
    /**
     * Fetches options data from the Grix API
     * @param request Options request parameters
     * @returns Formatted options data
     */
    async getOptionsData(request) {
        try {
            if (this.shouldRefreshCache()) {
                console.error(`📡 Fetching options data for asset: ${request.asset}`);
                const optionsData = await this.makeRequest("/elizatradeboard", {
                    asset: request.asset.toUpperCase(),
                    optionType: request.optionType,
                    positionType: request.positionType,
                    protocols: this.defaultProtocols.join(","),
                });
                // Sort options by strike price
                const sortedData = optionsData.sort((a, b) => a.strike - b.strike);
                this.optionsCache = {
                    lastUpdate: Date.now(),
                    data: sortedData,
                };
            }
            // Format and return the cached data
            return this.optionsCache.data?.map((option) => this.formatOptionData(option)) || [];
        }
        catch (error) {
            console.error("Error fetching options data:", error);
            throw error;
        }
    }
}
