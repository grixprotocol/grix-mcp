import { z } from "zod";
// import { GrixSDK, OptionType, PositionType, Underlyi ngAsset } from "@grixprotocol/sdk";
import { GrixSDK, UnderlyingAsset, OptionType, PositionType } from "@grixprotocol/sdk";

// Type definitions
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

export class GrixTools {
	private readonly apiKey: string;
	private sdk!: GrixSDK;
	private readonly defaultProtocols: string[];
	private optionsCache: {
		lastUpdate: number;
		data: OptionData[] | null;
	};
	private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

	constructor() {
		this.apiKey = process.env.GRIX_API_KEY || "";
		this.defaultProtocols = ["derive", "aevo", "premia", "moby", "ithaca", "zomma", "deribit"];
		this.optionsCache = {
			lastUpdate: 0,
			data: null,
		};
	}

	private shouldRefreshCache(): boolean {
		return Date.now() - this.optionsCache.lastUpdate > this.cacheExpiryMs;
	}

	private formatOptionData(option: OptionData): FormattedOption {
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
	private async initializeSDK() {
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
	public async getOptionsData(request: OptionsRequest): Promise<FormattedOption[]> {
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
					positionType: positionType as PositionType,
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
		} catch (error) {
			console.error("Error fetching options data:", error);
			throw error;
		}
	}
}
