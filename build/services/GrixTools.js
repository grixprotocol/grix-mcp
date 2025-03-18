import { z } from "zod";
// import { GrixSDK, OptionType, PositionType, Underlyi ngAsset } from "@grixprotocol/sdk";
import { GrixSDK, UnderlyingAsset, OptionType } from "@grixprotocol/sdk";
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
    /**
     * Initializes the SDK instance
     */
    async initializeSDK() {
        if (!this.sdk) {
            this.sdk = await GrixSDK.initialize({
                apiKey: this.apiKey,
            });
        }
    }
    /**
     * Fetches options data from the Grix API using the SDK
     * @param request Options request parameters
     * @returns Formatted options data
     */
    async getOptionsData(request) {
        try {
            await this.initializeSDK();
            if (this.shouldRefreshCache()) {
                console.error(`📡 Fetching options data for asset: ${request.asset}`);
                const asset = request.asset === "BTC" ? UnderlyingAsset.BTC : UnderlyingAsset.ETH;
                const optionType = request.optionType === "call" ? OptionType.call : OptionType.put;
                const positionType = request.positionType === "long" ? "long" : "short";
                const optionsData = await this.sdk.getOptionsMarketBoard({
                    asset: asset,
                    optionType: optionType,
                    positionType: positionType,
                });
                // Sort options by strike price
                const sortedData = optionsData.results.sort((a, b) => a.strike - b.strike);
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
