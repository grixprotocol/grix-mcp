# Technical Context

## Technologies Used

- Node.js
- TypeScript
- @modelcontextprotocol/sdk - For MCP server implementation
- @grixprotocol/sdk - For Grix Protocol integration
- dotenv - For environment variable management

## Development Setup

- Node.js environment
- TypeScript configuration
- Environment variables:
  - GRIX_API_KEY - Required for authentication with Grix Protocol
- Package management with npm/yarn
- Runs as a CLI application (#!/usr/bin/env node)

## Technical Constraints

- Requires valid Grix API key for operation
- Communication limited to stdio transport
- Must handle tool requests synchronously
- Error handling required for both MCP and Grix operations
- Memory management for long-running server process

## Architecture

- Server runs on stdio transport
- Implements MCP protocol for tool exposure
- Uses Grix SDK for DeFi operations
- Provides logging capabilities
- Handles both ListTools and CallTool requests
