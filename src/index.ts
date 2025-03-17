#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_KEY_DEMO = "gjOH22LyxtKxPax5ALRx46i5rHv9B8Ya1WnD0ma3";
const BASE_URL = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev/elizatradeboard";
const PROTOCOLS = "derive,aevo,premia,moby,ithaca,zomma,deribit";
const CACHE_TTL = 30000; // 30 seconds cache

// Type definitions
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
let optionsCache: {
	lastUpdate: number;
	data: Record<string, OptionData[]>;
} = {
	lastUpdate: 0,
	data: {},
};

// Create the MCP server with the new Server class
const server = new Server(
	{
		name: "GRIX MCP",
		version: "1.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

async function fetchOptionsData(
	asset: string,
	optionType: string,
	positionType: string
): Promise<OptionData[]> {
	const cacheKey = `${asset}-${optionType}-${positionType}`;
	const now = Date.now();

	if (optionsCache.data[cacheKey] && now - optionsCache.lastUpdate < CACHE_TTL) {
		return optionsCache.data[cacheKey];
	}

	try {
		const response = await axios.get(BASE_URL, {
			params: {
				positionType: positionType.toLowerCase(),
				optionType: optionType.toLowerCase(),
				asset: asset,
				protocols: PROTOCOLS,
			},
			headers: {
				"x-api-key": API_KEY_DEMO,
			},
		});

		if (!response.data || !Array.isArray(response.data)) {
			throw new Error(
				`Invalid API response format. Response: ${JSON.stringify(response.data)}`
			);
		}

		const sortedData = response.data
			.sort((a: OptionData, b: OptionData) => a.strike - b.strike)
			.slice(0, 10);

		optionsCache.lastUpdate = now;
		optionsCache.data[cacheKey] = sortedData;
		return sortedData;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const params = new URLSearchParams({
				positionType: positionType.toLowerCase(),
				optionType: optionType.toLowerCase(),
				asset: asset,
				protocols: PROTOCOLS,
			});
			const requestUrl = `${BASE_URL}?${params.toString()}`;

			const errorDetails = {
				url: requestUrl,
				status: error.response?.status,
				statusText: error.response?.statusText,
				responseData: error.response?.data,
				message: error.message,
			};

			throw new Error(`API Request Failed: ${JSON.stringify(errorDetails, null, 2)}`);
		}
		throw error;
	}
}

// Define tools using ListToolsRequestSchema
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "options",
				description: "Get options data from Grix",
				inputSchema: {
					type: "object",
					properties: {
						asset: { type: "string", enum: ["BTC", "ETH"], default: "BTC" },
						optionType: { type: "string", enum: ["call", "put"], default: "call" },
						positionType: { type: "string", enum: ["long", "short"], default: "long" },
					},
				},
			},
		],
	};
});

// Handle tool calls using CallToolRequestSchema
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	if (name === "options") {
		try {
			const asset = (args?.asset as string) || "BTC";
			const optionType = (args?.optionType as string) || "call";
			const positionType = (args?.positionType as string) || "long";

			const data = await fetchOptionsData(asset, optionType, positionType);

			if (!data || data.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "No options data available for the specified parameters.",
						},
					],
				};
			}

			const formattedData = data.map((option) => ({
				id: option.optionId,
				symbol: option.symbol,
				strike: `$${option.strike.toLocaleString()}`,
				type: option.type.toLowerCase(),
				expiry: new Date(option.expiry).toLocaleDateString(),
				protocol: option.protocol.toLowerCase(),
				price: option.contractPrice.toFixed(4),
				amount: parseFloat(option.availableAmount).toFixed(4),
				market: option.marketName,
			}));

			const formattedOutput = formattedData
				.map(
					(option, index) =>
						`Option ${index + 1}:\n` +
						`  Symbol: ${option.symbol}\n` +
						`  Strike: ${option.strike}\n` +
						`  Type: ${option.type}\n` +
						`  Expiry: ${option.expiry}\n` +
						`  Protocol: ${option.protocol}\n` +
						`  Price: ${option.price}\n` +
						`  Amount: ${option.amount}\n` +
						`  Market: ${option.market}\n`
				)
				.join("\n");

			return {
				content: [
					{
						type: "text",
						text: formattedOutput,
					},
				],
			};
		} catch (error: unknown) {
			return {
				content: [
					{
						type: "text",
						text: error instanceof Error ? error.message : "Unknown error occurred",
					},
				],
			};
		}
	}

	throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
	try {
		console.error("Initializing Grix MCP Server...");
		const transport = new StdioServerTransport();
		await server.connect(transport);
		console.error("Grix MCP Server running on stdio");
	} catch (error) {
		console.error("Fatal error in main():", error);
		if (error instanceof Error) {
			console.error("Error details:", error.message);
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}
}

// Add unhandled rejection handler
process.on("unhandledRejection", (error: unknown) => {
	console.error("Unhandled rejection:", error);
	process.exit(1);
});

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
