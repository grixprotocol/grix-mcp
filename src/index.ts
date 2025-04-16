#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GrixSDK } from "@grixprotocol/sdk";
import { z } from "zod";

dotenv.config();

const server = new Server(
  {
    name: "GRIX MCP",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const GRIX_API_KEY = process.env.GRIX_API_KEY;

const grixSDK = await GrixSDK.initialize({
  apiKey: GRIX_API_KEY || "",
});

const { schemas, handleOperation } = grixSDK.mcp;

const allSchemas = schemas.map((schema) => schema.schema);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allSchemas,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return await handleOperation(name, args);
});

// Add prompt handler for market analysis
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "market-analysis") {
    return {
      description:
        "Analyze current market conditions and provide trading insights",
      parameters: {
        asset: z.string().describe("The asset to analyze (e.g., BTC, ETH)"),
        timeframe: z
          .string()
          .describe("The timeframe for analysis (e.g., 1h, 4h, 1d)"),
      },
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze the market conditions for {asset} on the {timeframe} timeframe. Consider:

1. Current price action and trend
2. Key support and resistance levels
3. Volume analysis
4. Technical indicators (RSI, MACD, etc.)
5. Market sentiment
6. Potential entry/exit points

Provide a comprehensive analysis with actionable insights.`,
          },
        },
      ],
    };
  }
  throw new Error("Unknown prompt");
});

// Start the server
async function main() {
  try {
    console.error("Initializing Grix MCP Server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Server:", server);
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

process.on("unhandledRejection", (error: unknown) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
