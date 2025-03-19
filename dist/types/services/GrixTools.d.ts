import { z } from "zod";
export interface OptionData {
    optionId: number;
    symbol: string;
    type: string;
    expiry: string;
    strike: number;
    protocol: string;
    marketName: string;
    contractPrice: number;
    availableAmount: string;
}
export interface FormattedOption {
    id: number;
    symbol: string;
    type: string;
    expiry: string;
    strike: number;
    protocol: string;
    price: number;
    amount: string;
    market: string;
}
export declare const OptionsRequestSchema: z.ZodObject<{
    asset: z.ZodDefault<z.ZodOptional<z.ZodEnum<["BTC", "ETH"]>>>;
    optionType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["call", "put"]>>>;
    positionType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["long", "short"]>>>;
}, "strip", z.ZodTypeAny, {
    asset: "BTC" | "ETH";
    optionType: "call" | "put";
    positionType: "long" | "short";
}, {
    asset?: "BTC" | "ETH" | undefined;
    optionType?: "call" | "put" | undefined;
    positionType?: "long" | "short" | undefined;
}>;
export type OptionsRequest = z.infer<typeof OptionsRequestSchema>;
export interface SignalRequestConfig {
    budget_usd: string;
    assets: ("BTC" | "ETH")[];
    trade_window_ms: number;
    context_window_ms: number;
    input_data: string[];
    protocols: string[];
    user_prompt: string;
}
export interface TradeAgentConfig {
    agent_name: string;
    is_simulation: boolean;
    signal_request_config: {
        protocols: string[];
        input_data: string[];
        context_window_ms: number;
        budget_usd: string;
        assets: string[];
        trade_window_ms: number;
    };
}
export interface Signal {
    id: string;
    action_type: string;
    position_type: string;
    instrument: string;
    instrument_type: string;
    size: string;
    expected_instrument_price_usd: string;
    expected_total_price_usd: string;
    reason: string;
    target_position_id?: string;
    created_at: string;
    updated_at: string;
}
export declare class GrixTools {
    private readonly apiKey;
    private readonly openAIApiKey;
    private sdk;
    private optionsCache;
    private readonly cacheExpiryMs;
    private readonly defaultProtocols;
    private readonly defaultTradeWindowMs;
    private readonly defaultContextWindowMs;
    constructor(_apiKey: string, _openAIApiKey: string);
    /**
     * Initializes the SDK instance
     */
    private initializeSDK;
    /**
     * Gets the current price of an asset
     */
    /**
     * Fetches options data from the Grix API using the SDK
     * @param request Options request parameters
     * @returns Formatted options data
     */
    getOptionsData(request: OptionsRequest): Promise<FormattedOption[]>;
}
export declare class GrixHelpers {
    /**
     * Formats option data into a standardized format
     */
    static formatOptionData(option: OptionData): FormattedOption;
    /**
     * Checks if cache should be refreshed based on last update time
     */
    static shouldRefreshCache(lastUpdate: number, cacheExpiryMs: number): boolean;
    /**
     * Formats price to a specified number of decimal places
     */
    static formatPrice(price: number, decimals?: number): string;
    /**
     * Formats date to ISO string
     */
    static formatDate(date: Date | string): string;
}
//# sourceMappingURL=GrixTools.d.ts.map