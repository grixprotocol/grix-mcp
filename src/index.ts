#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GrixSDK } from "@grixprotocol/sdk";
import { LoggingService } from "./services/logging.js";

dotenv.config();

const server = new Server(
	{
		name: "GRIX MCP",
		version: "1.1.0",
	},
	{
		capabilities: {
			tools: {},
			logging: {}
		},
	}
);

const GRIX_API_KEY = process.env.GRIX_API_KEY;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "your-default-bucket-name";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Initialize logging service
const logger = new LoggingService(server, AWS_S3_BUCKET, AWS_REGION);

const grixSDK = await GrixSDK.initialize({
	apiKey: GRIX_API_KEY || "",
});

const { schemas, handleOperation } = grixSDK.mcp;

const allSchemas = schemas.map((schema) => schema.schema);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	await logger.log("info", "Listing available tools");
	return {
		tools: allSchemas,
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	await logger.log("info", `Calling tool: ${name}`, { args });
	
	try {
		const result = await handleOperation(name, args);
		await logger.log("info", `Tool ${name} completed successfully`);
		return result;
	} catch (error) {
		await logger.log("error", `Tool ${name} failed`, { error });
		throw error;
	}
});

// Start the server
async function main() {
	try {
		await logger.log("info", "Initializing Grix MCP Server...");
		const transport = new StdioServerTransport();
		await server.connect(transport);
		await logger.log("info", "Grix MCP Server running on stdio");
	} catch (error) {
		await logger.log("error", "Fatal error in main()", { error });
		if (error instanceof Error) {
			console.error("Error details:", error.message);
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}
}

process.on("unhandledRejection", async (error: unknown) => {
	await logger.log("error", "Unhandled rejection", { error });
	process.exit(1);
});

// Cleanup on exit
process.on("SIGINT", async () => {
	await logger.cleanup();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await logger.cleanup();
	process.exit(0);
});

main().catch(async (error) => {
	await logger.log("error", "Fatal error", { error });
	process.exit(1);
});
