#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GrixSDK } from "@grixprotocol/sdk";

dotenv.config();

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

const GRIX_API_KEY = process.env.GRIX_API_KEY;

const grixSDK = await GrixSDK.initialize({
	apiKey: GRIX_API_KEY || "",
});

const { schemas, getOptionsDataMcp, getSignalsDataMcp } = grixSDK.mcp;

const allSchemas = schemas.map((schema) => schema.schema);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: allSchemas,
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	if (name === "options") {
		if (!args) {
			throw new Error("Missing required parameters: asset, optionType, or positionType");
		}
		try {
			return await getOptionsDataMcp(args);
		} catch (error) {
			const err = error as Error;
			return {
				content: [
					{
						type: "text",
						text: `Failed to fetch options data. Error: ${
							err.message
						}. Args: ${JSON.stringify(args)}`,
					},
				],
			};
		}
	} else if (name === "generateSignals") {
		if (!args) {
			throw new Error("generateSignals: Missing required parameters");
		}
		return await getSignalsDataMcp(args);
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

process.on("unhandledRejection", (error: unknown) => {
	console.error("Unhandled rejection:", error);
	process.exit(1);
});

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
