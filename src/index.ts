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

const { schemas, handleOperation } = grixSDK.mcp;

const allSchemas = schemas.map((schema) => schema.schema);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: allSchemas,
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	const response = await handleOperation(name, args);
	
	return {
		result: response
	};
});

// Start the server
async function main() {
	try {
		console.error("Initializing Grix MCP Server...");
		const transport = new StdioServerTransport();
		await server.connect(transport);
		console.log("Server:", server);
		console.error("Grix MCP Server running on stdio");

	/*
		const response = await handleOperation("options", {
		 	asset: "BTC",
		 	optionType: "call",
		 	positionType: "long",
		 });

		const response = await handleOperation("getPerpsPredictedFundings", {
			protocol: "hyperliquid",
		});
		console.error("Response:", response);*/
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
