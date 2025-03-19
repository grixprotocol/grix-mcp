#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { GrixTools } from "./services/GrixTools.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
// Load environment variables
dotenv.config();
// Create the MCP server with the new Server class
const server = new Server({
    name: "GRIX MCP",
    version: "1.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Remove the fetchOptionsData function and optionsCache as they're handled by GrixTools now
const GRIX_API_KEY = process.env.GRIX_API_KEY;
if (!GRIX_API_KEY) {
    throw new Error("GRIX_API_KEY is not set");
}
const grixTools = new GrixTools(GRIX_API_KEY);
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
            {
                name: "generateSignals",
                description: "Generate trading signals based on user parameters",
                inputSchema: {
                    type: "object",
                    properties: {
                        budget: { type: "string", default: "5000" },
                        assets: {
                            type: "array",
                            items: { type: "string", enum: ["BTC", "ETH"] },
                            default: ["BTC"],
                        },
                        userPrompt: {
                            type: "string",
                            default: "Generate moderate growth strategies",
                        },
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
            const asset = args?.asset || "BTC";
            const optionType = args?.optionType || "call";
            const positionType = args?.positionType || "long";
            const data = await grixTools.getOptionsData({
                asset: asset,
                optionType: optionType,
                positionType: positionType,
            });
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
            const formattedOutput = data
                .map((option, index) => `Option ${index + 1}:\n` +
                `  Symbol: ${option.symbol}\n` +
                `  Strike: $${option.strike.toLocaleString()}\n` +
                `  Type: ${option.type}\n` +
                `  Expiry: ${new Date(option.expiry).toLocaleDateString()}\n` +
                `  Protocol: ${option.protocol.toLowerCase()}\n` +
                `  Price: ${option.price.toFixed(4)}\n` +
                `  Amount: ${option.amount}\n` +
                `  Market: ${option.market}\n`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: formattedOutput,
                    },
                ],
            };
        }
        catch (error) {
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
    else if (name === "generateSignals") {
        try {
            const budget = args?.budget || "5000";
            const assets = args?.assets || ["BTC"];
            const userPrompt = args?.userPrompt || "Generate moderate growth strategies";
            console.error(`Generating trading signals with budget: $${budget}, assets: ${assets.join(", ")}`);
            const signals = await grixTools.generateTradingSignals(budget, assets, userPrompt);
            if (!signals || signals.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No trading signals were generated.",
                        },
                    ],
                };
            }
            const formattedOutput = signals
                .map((signal, index) => `Signal ${index + 1}:\n` +
                `  Action: ${signal.action_type}\n` +
                `  Position: ${signal.position_type}\n` +
                `  Instrument: ${signal.instrument}\n` +
                `  Type: ${signal.instrument_type}\n` +
                `  Size: ${signal.size}\n` +
                `  Expected Price: $${signal.expected_instrument_price_usd}\n` +
                `  Total Price: $${signal.expected_total_price_usd}\n` +
                `  Reason: ${signal.reason}\n` +
                `  Created: ${new Date(signal.created_at).toLocaleString()}\n`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: formattedOutput,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: error instanceof Error
                            ? error.message
                            : "Unknown error occurred while generating signals",
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
