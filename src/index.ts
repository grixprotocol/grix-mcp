import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// API Configuration
const API_BASE_URL = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev";
const DEFAULT_PROTOCOLS = ["derive", "aevo", "premia", "moby", "ithaca", "zomma", "deribit"];

// Type definitions for API response
interface OptionData {
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

// Cache configuration
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
let optionsCache: {
	lastUpdate: number;
	data: OptionData[] | null;
} = {
	lastUpdate: 0,
	data: null,
};

function shouldRefreshCache(): boolean {
	return Date.now() - optionsCache.lastUpdate > CACHE_EXPIRY_MS;
}

// Create server instance
const server = new McpServer({
	name: "grix-mcp",
	version: "1.0.0",
});

// Register options tool with enhanced functionality
server.tool(
	"options",
	"Get options data from Grix",
	{
		asset: z.enum(["BTC", "ETH"]).optional().default("BTC"),
		optionType: z.enum(["call", "put"]).optional().default("call"),
		positionType: z.enum(["long", "short"]).optional().default("long"),
	},
	async (request) => {
		try {
			const asset = request.asset || "BTC";
			const optionType = request.optionType || "call";
			const positionType = request.positionType || "long";

			// Fetch and cache options data if needed
			if (shouldRefreshCache()) {
				console.error(`📡 Fetching options data for asset: ${asset}`);

				const response = await axios.get(`${API_BASE_URL}/elizatradeboard`, {
					headers: {
						"x-api-key": process.env.GRIX_API_KEY || "",
					},
					params: {
						asset: asset.toUpperCase(),
						optionType,
						positionType,
						protocols: DEFAULT_PROTOCOLS.join(","),
					},
				});

				// Ensure the response data is an array
				const optionsData = Array.isArray(response.data) ? response.data : [];

				// Sort options by strike price for better readability
				const sortedData = optionsData.sort((a, b) => a.strike - b.strike);

				optionsCache = {
					lastUpdate: Date.now(),
					data: sortedData,
				};
			}

			// Format the response for better readability
			const formattedData = optionsCache.data?.map((option) => ({
				id: option.optionId,
				symbol: option.symbol,
				type: option.type,
				expiry: option.expiry,
				strike: option.strike,
				protocol: option.protocol,
				price: option.contractPrice,
				amount: option.availableAmount,
				market: option.marketName,
			}));

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedData || [], null, 2),
					},
				],
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			console.error("Error fetching options data:", error);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							error: "Failed to fetch options data",
							details: errorMessage,
						}),
					},
				],
			};
		}
	}
);

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
  
	console.error("Grix MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
