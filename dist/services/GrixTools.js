import { z } from "zod";
import { GrixSDK, UnderlyingAsset, OptionType } from "@grixprotocol/sdk";
// Request schemas
export const OptionsRequestSchema = z.object({
    asset: z.enum(["BTC", "ETH"]).optional().default("BTC"),
    optionType: z.enum(["call", "put"]).optional().default("call"),
    positionType: z.enum(["long", "short"]).optional().default("long"),
});
export class GrixTools {
    apiKey;
    openAIApiKey;
    sdk;
    optionsCache;
    cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
    defaultProtocols = [
        "derive",
        "aevo",
        "premia",
        "moby",
        "ithaca",
        "zomma",
        "deribit",
    ];
    defaultTradeWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    defaultContextWindowMs = 604800000; // 1 week
    constructor(_apiKey, _openAIApiKey) {
        this.apiKey = _apiKey;
        this.openAIApiKey = _openAIApiKey;
        if (!this.apiKey || !this.openAIApiKey) {
            throw new Error("Missing required API keys. Please check GRIX_API_KEY and OPENAI_API_KEY in your environment variables.");
        }
        this.optionsCache = {
            lastUpdate: 0,
            data: null,
        };
    }
    /**
     * Initializes the SDK instance
     */
    async initializeSDK() {
        if (!this.sdk) {
            this.sdk = await GrixSDK.initialize({
                apiKey: this.apiKey,
                openAIApiKey: this.openAIApiKey,
            });
        }
    }
    /**
     * Gets the current price of an asset
     */
    // public async getAssetPrice(asset: UnderlyingAsset): Promise<number> {
    // 	await this.initializeSDK();
    // 	const assetString =
    // 		asset.toUpperCase() === "BTC" ? UnderlyingAsset.BTC : UnderlyingAsset.ETH;
    // 	const priceData = await this.sdk.fetchAssetPrice(assetString);
    // 	return priceData;
    // }
    /**
     * Fetches options data from the Grix API using the SDK
     * @param request Options request parameters
     * @returns Formatted options data
     */
    async getOptionsData(request) {
        try {
            await this.initializeSDK();
            if (GrixHelpers.shouldRefreshCache(this.optionsCache.lastUpdate, this.cacheExpiryMs)) {
                console.error(`📡 Fetching options data for asset: ${request.asset}`);
                const asset = request.asset === "BTC" ? UnderlyingAsset.BTC : UnderlyingAsset.ETH;
                const optionType = request.optionType === "call" ? OptionType.call : OptionType.put;
                const positionType = request.positionType === "long" ? "long" : "short";
                const optionsData = await this.sdk.getOptionsMarketBoard({
                    asset: asset,
                    optionType: optionType,
                    positionType: positionType,
                });
                const sortedData = optionsData.results.sort((a, b) => a.strike - b.strike);
                this.optionsCache = {
                    lastUpdate: Date.now(),
                    data: sortedData,
                };
            }
            return (this.optionsCache.data?.map((option) => GrixHelpers.formatOptionData(option)) || []);
        }
        catch (error) {
            console.error("Error fetching options data:", error);
            throw error;
        }
    }
}
export class GrixHelpers {
    /**
     * Formats option data into a standardized format
     */
    static formatOptionData(option) {
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
     * Checks if cache should be refreshed based on last update time
     */
    static shouldRefreshCache(lastUpdate, cacheExpiryMs) {
        return Date.now() - lastUpdate > cacheExpiryMs;
    }
    /**
     * Formats price to a specified number of decimal places
     */
    static formatPrice(price, decimals = 4) {
        return price.toFixed(decimals);
    }
    /**
     * Formats date to ISO string
     */
    static formatDate(date) {
        return new Date(date).toISOString();
    }
}
