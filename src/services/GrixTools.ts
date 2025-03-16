import { z } from "zod";
import axios from "axios";

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
	private readonly baseUrl: string;
	private readonly defaultProtocols: string[];
	private optionsCache: {
		lastUpdate: number;
		data: OptionData[] | null;
	};
	private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

	constructor() {
		this.apiKey = process.env.GRIX_API_KEY || "";
		this.baseUrl = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev";
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

	private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
		try {
			const response = await axios.get(`${this.baseUrl}${endpoint}`, {
				headers: {
					"x-api-key": this.apiKey,
				},
				params,
			});
			return response.data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	/**
	 * Fetches options data from the Grix API
	 * @param request Options request parameters
	 * @returns Formatted options data
	 */
	public async getOptionsData(request: OptionsRequest): Promise<FormattedOption[]> {
		try {
			if (this.shouldRefreshCache()) {
				console.error(`📡 Fetching options data for asset: ${request.asset}`);

				const optionsData = await this.makeRequest<OptionData[]>("/elizatradeboard", {
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
		} catch (error) {
			console.error("Error fetching options data:", error);
			throw error;
		}
	}
}
