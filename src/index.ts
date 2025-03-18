#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { GrixTools } from "./services/GrixTools.js";

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
if (!process.env.OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY is not set");
}

// Remove the fetchOptionsData function and optionsCache as they're handled by GrixTools now
const grixTools = new GrixTools(API_KEY_DEMO, process.env.OPENAI_API_KEY);

// // Define tools using ListToolsRequestSchema
// server.setRequestHandler(ListToolsRequestSchema, async () => {
// 	return {
// 		tools: [
// 			{
// 				name: "options",
// 				description: "Get options data from Grix",
// 				inputSchema: {
// 					type: "object",
// 					properties: {
// 						asset: { type: "string", enum: ["BTC", "ETH"], default: "BTC" },
// 						optionType: { type: "string", enum: ["call", "put"], default: "call" },
// 						positionType: { type: "string", enum: ["long", "short"], default: "long" },
// 					},
// 				},
// 			},
// 		],
// 	};
// });

// // Handle tool calls using CallToolRequestSchema
// server.setRequestHandler(CallToolRequestSchema, async (request) => {
// 	const { name, arguments: args } = request.params;

// 	if (name === "options") {
// 		try {
// 			const asset = (args?.asset as string) || "BTC";
// 			const optionType = (args?.optionType as string) || "call";
// 			const positionType = (args?.positionType as string) || "long";

// 			const data = await grixTools.getOptionsData({
// 				asset: asset as UnderlyingAsset,
// 				optionType: optionType as OptionType,
// 				positionType: positionType as PositionType,
// 			});

// 			if (!data || data.length === 0) {
// 				return {
// 					content: [
// 						{
// 							type: "text",
// 							text: "No options data available for the specified parameters.",
// 						},
// 					],
// 				};
// 			}

// 			const formattedOutput = data
// 				.map(
// 					(option, index) =>
// 						`Option ${index + 1}:\n` +
// 						`  Symbol: ${option.symbol}\n` +
// 						`  Strike: $${option.strike.toLocaleString()}\n` +
// 						`  Type: ${option.type}\n` +
// 						`  Expiry: ${new Date(option.expiry).toLocaleDateString()}\n` +
// 						`  Protocol: ${option.protocol.toLowerCase()}\n` +
// 						`  Price: ${option.price.toFixed(4)}\n` +
// 						`  Amount: ${option.amount}\n` +
// 						`  Market: ${option.market}\n`
// 				)
// 				.join("\n");

// 			return {
// 				content: [
// 					{
// 						type: "text",
// 						text: formattedOutput,
// 					},
// 				],
// 			};
// 		} catch (error: unknown) {
// 			return {
// 				content: [
// 					{
// 						type: "text",
// 						text: error instanceof Error ? error.message : "Unknown error occurred",
// 					},
// 				],
// 			};
// 		}
// 	}

// 	throw new Error(`Unknown tool: ${name}`);
// });

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
