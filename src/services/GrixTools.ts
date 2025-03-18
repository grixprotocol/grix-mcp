import { z } from "zod";
import { GrixSDK, UnderlyingAsset, OptionType, PositionType } from "@grixprotocol/sdk";

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

// Request schemas
export const OptionsRequestSchema = z.object({
	asset: z.enum(["BTC", "ETH"]).optional().default("BTC"),
	optionType: z.enum(["call", "put"]).optional().default("call"),
	positionType: z.enum(["long", "short"]).optional().default("long"),
});

export type OptionsRequest = z.infer<typeof OptionsRequestSchema>;

// Add new interfaces and schemas
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

export class GrixTools {
	private readonly apiKey: string;
	private readonly openAIApiKey: string;
	private sdk!: GrixSDK;
	private optionsCache: {
		lastUpdate: number;
		data: OptionData[] | null;
	};
	private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
	private readonly defaultProtocols = [
		"derive",
		"aevo",
		"premia",
		"moby",
		"ithaca",
		"zomma",
		"deribit",
	];
	private readonly defaultTradeWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days
	private readonly defaultContextWindowMs = 604800000; // 1 week

	constructor(_apiKey: string, _openAIApiKey: string) {
		this.apiKey = _apiKey;
		this.openAIApiKey = _openAIApiKey;

		if (!this.apiKey || !this.openAIApiKey) {
			throw new Error(
				"Missing required API keys. Please check GRIX_API_KEY and OPENAI_API_KEY in your environment variables."
			);
		}

		this.optionsCache = {
			lastUpdate: 0,
			data: null,
		};
	}

	/**
	 * Initializes the SDK instance
	 */
	private async initializeSDK() {
		if (!this.sdk) {
			try {
				this.sdk = await GrixSDK.initialize({
					apiKey: this.apiKey,
					openAIApiKey: this.openAIApiKey,
				});
			} catch (error) {
				console.error("Failed to initialize GrixSDK:", error);
				throw new Error(
					`SDK initialization failed: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
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
	public async getOptionsData(request: OptionsRequest): Promise<FormattedOption[]> {
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
					positionType: positionType as PositionType,
				});

				const sortedData = optionsData.results.sort((a, b) => a.strike - b.strike);

				this.optionsCache = {
					lastUpdate: Date.now(),
					data: sortedData,
				};
			}

			return (
				this.optionsCache.data?.map((option) => GrixHelpers.formatOptionData(option)) || []
			);
		} catch (error) {
			console.error("Error fetching options data:", error);
			throw error;
		}
	}

	/**
	 * Creates a trade agent for signal generation
	 */
	// public async createTradeAgent(
	// 	ownerAddress: string = "MCP",
	// 	budget: string = "5000",
	// 	assets: string[] = ["BTC"]
	// ): Promise<string> {
	// 	await this.initializeSDK();

	// 	const createRequest = {
	// 		ownerAddress,
	// 		config: {
	// 			agent_name: "OS-E",
	// 			is_simulation: true,
	// 			signal_request_config: {
	// 				budget_usd: budget,
	// 				assets: assets,
	// 				context_window_ms: this.defaultContextWindowMs,
	// 				input_data: ["marketData", "assetPrices"],
	// 				protocols: this.defaultProtocols,
	// 				trade_window_ms: this.defaultTradeWindowMs,
	// 			},
	// 		},
	// 	};

	// 	const result = await this.sdk.createTradeAgent(createRequest);
	// 	return result.agentId;
	// }

	// /**
	//  * Requests trading signals for a specific agent
	//  */
	// public async requestSignals(
	// 	agentId: number,
	// 	budget: string = "5000",
	// 	assets: string[] = ["BTC"],
	// 	userPrompt: string = "Generate moderate growth strategies"
	// ): Promise<void> {
	// 	await this.initializeSDK();

	// 	const signalRequest = {
	// 		config: {
	// 			budget_usd: budget,
	// 			assets: assets,
	// 			trade_window_ms: this.defaultTradeWindowMs,
	// 			context_window_ms: this.defaultContextWindowMs,
	// 			input_data: ["marketData", "assetPrices"],
	// 			protocols: this.defaultProtocols,
	// 			user_prompt: userPrompt,
	// 		},
	// 	};

	// 	await this.sdk.requestTradeAgentSignals(agentId, signalRequest);
	// }

	// /**
	//  * Waits for and retrieves trading signals
	//  */
	// public async waitForSignals(
	// 	agentId: number,
	// 	maxRetries: number = 10,
	// 	retryDelay: number = 2000
	// ) {
	// 	let retries = 0;

	// 	while (retries < maxRetries) {
	// 		const result = await this.sdk.getTradeSignals({ agentId: agentId.toString() });
	// 		const signalRequest = result.personalAgents[0]?.signal_requests[0];

	// 		if (signalRequest?.progress === "completed" && signalRequest?.signals?.length > 0) {
	// 			console.log("✅ Signals generated successfully");
	// 			return signalRequest.signals.map((s) => ({
	// 				id: s.id,
	// 				action_type: s.signal.action_type,
	// 				position_type: s.signal.position_type,
	// 				instrument: s.signal.instrument,
	// 				instrument_type: s.signal.instrument_type,
	// 				size: s.signal.size,
	// 				expected_instrument_price_usd: s.signal.expected_instrument_price_usd,
	// 				expected_total_price_usd: s.signal.expected_total_price_usd,
	// 				reason: s.signal.reason,
	// 				target_position_id: s.signal.target_position_id,
	// 				created_at: s.created_at,
	// 				updated_at: s.updated_at,
	// 			}));
	// 		}

	// 		console.log(`⏳ Waiting for signals... (attempt ${retries + 1}/${maxRetries})`);
	// 		await new Promise((resolve) => setTimeout(resolve, retryDelay));
	// 		retries++;
	// 	}

	// 	throw new Error("Timeout waiting for signals");
	// }

	// /**
	//  * Complete flow for generating trading signals
	//  */
	// public async generateTradingSignals(
	// 	budget: string = "5000",
	// 	assets: string[] = ["BTC"],
	// 	userPrompt: string = "Generate moderate growth strategies"
	// ) {
	// 	try {
	// 		// 1. Create trade agent
	// 		const agentId = await this.createTradeAgent("default", budget, assets);

	// 		// 2. Request signals
	// 		await this.requestSignals(Number(agentId), budget, assets, userPrompt);

	// 		// 3. Wait for and return signals
	// 		return await this.waitForSignals(Number(agentId));
	// 	} catch (error) {
	// 		console.error("Error generating trading signals:", error);
	// 		throw error;
	// 	}
	// }
}

export class GrixHelpers {
	/**
	 * Formats option data into a standardized format
	 */
	static formatOptionData(option: OptionData): FormattedOption {
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
	static shouldRefreshCache(lastUpdate: number, cacheExpiryMs: number): boolean {
		return Date.now() - lastUpdate > cacheExpiryMs;
	}

	/**
	 * Formats price to a specified number of decimal places
	 */
	static formatPrice(price: number, decimals: number = 4): string {
		return price.toFixed(decimals);
	}

	/**
	 * Formats date to ISO string
	 */
	static formatDate(date: Date | string): string {
		return new Date(date).toISOString();
	}
}
