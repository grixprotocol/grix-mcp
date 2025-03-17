#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
// Constants
const API_BASE_URL = "https://z61hgkwkn8.execute-api.us-east-1.amazonaws.com/dev";
const DEFAULT_PROTOCOLS = ["derive", "aevo", "premia", "moby", "ithaca", "zomma", "deribit"];
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
// Cache configuration
let optionsCache = {
    lastUpdate: 0,
    data: null,
};
function shouldRefreshCache() {
    return Date.now() - optionsCache.lastUpdate > CACHE_EXPIRY_MS;
}
// Create the MCP server
const server = new McpServer({
    name: "Grix MCP",
    version: "1.1.0",
});
// Options Tool
server.tool("options", "Get options data from Grix", {
    asset: z.enum(["BTC", "ETH"]).optional().default("BTC"),
    optionType: z.enum(["call", "put"]).optional().default("call"),
    positionType: z.enum(["long", "short"]).optional().default("long"),
}, async (request) => {
    try {
        const asset = request.asset || "BTC";
        const optionType = request.optionType || "call";
        const positionType = request.positionType || "long";
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
            const optionsData = Array.isArray(response.data) ? response.data : [];
            const sortedData = optionsData.sort((a, b) => a.strike - b.strike);
            optionsCache = {
                lastUpdate: Date.now(),
                data: sortedData,
            };
        }
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
    }
    catch (error) {
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
