#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
// Constants
const API_BASE_URL = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev";
const DEFAULT_PROTOCOLS = ["derive", "aevo", "premia", "moby", "ithaca", "zomma", "deribit"];
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const KEY_DEMO = "YoQicEDVZP1ecpB3fqZ4U8y3MHCs1C6BaBPGpGTP";
// Cache configuration
let optionsCache = {
    lastUpdate: 0,
    data: null,
};
// Create the MCP server with the new Server class
const server = new Server({
    name: "Grix MCP",
    version: "1.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Sample hardcoded options data
const SAMPLE_OPTIONS_DATA = [
    {
        optionId: 1,
        symbol: "BTC-30JUN23-30000-C",
        type: "call",
        expiry: "2023-06-30T08:00:00.000Z",
        strike: 30000,
        protocol: "deribit",
        marketName: "BTC-30JUN23-30000-C",
        contractPrice: 0.0534,
        availableAmount: "1.5",
    },
    {
        optionId: 2,
        symbol: "BTC-30JUN23-35000-C",
        type: "call",
        expiry: "2023-06-30T08:00:00.000Z",
        strike: 35000,
        protocol: "derive",
        marketName: "BTC-30JUN23-35000-C",
        contractPrice: 0.0234,
        availableAmount: "2.0",
    },
    {
        optionId: 3,
        symbol: "BTC-30JUN23-25000-P",
        type: "put",
        expiry: "2023-06-30T08:00:00.000Z",
        strike: 25000,
        protocol: "aevo",
        marketName: "BTC-30JUN23-25000-P",
        contractPrice: 0.0156,
        availableAmount: "1.0",
    },
];
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
            const formattedData = SAMPLE_OPTIONS_DATA.map((option) => ({
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
                        text: JSON.stringify(formattedData, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "Failed to process options data",
                            details: errorMessage,
                        }),
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
    }
    catch (error) {
        console.error("Fatal error in main():", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
        }
        process.exit(1);
    }
}
// Add unhandled rejection handler
process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
    process.exit(1);
});
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
