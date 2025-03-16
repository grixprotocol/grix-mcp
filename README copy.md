# Grix MCP Server

This is a Model Context Protocol (MCP) server implementation that integrates with the Grix SDK to provide options trading data and functionality.

## Features

-   Fetch options market data for different assets (BTC, ETH)
-   Support for both call and put options
-   Position type handling (long/short)
-   Automatic data caching and refresh mechanisms
-   Friendly greeting functionality

## Prerequisites

-   Node.js (v14 or higher)
-   Grix API Key
-   OpenAI API Key

## Installation

```bash
npm install @modelcontextprotocol/sdk @grix/sdk zod
```

## Configuration

Create a `.env` file in the root directory:

```env
GRIX_API_KEY=your_grix_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Start the server:

```bash
npm start
```

2. Available Tools:

-   `hello`: Greets a user with a custom message
-   `options`: Fetches options market data with the following parameters:
    -   asset (default: "BTC")
    -   optionType (default: "call")
    -   positionType (default: "long")

## Error Handling

The server includes robust error handling for:

-   Invalid API keys
-   Network failures
-   Invalid parameter combinations
-   Cache management

## Development

To modify or extend the server:

1. Update tool definitions in `src/index.ts`
2. Add new SDK integrations as needed
3. Test thoroughly before deployment

## License

MIT
