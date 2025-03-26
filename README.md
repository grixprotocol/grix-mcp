# Grix MCP (Model Context Protocol)

Grix is a powerful Derivatives Toolkits Marketplace designed for Agentic Trading, providing real-time options pricing data from various protocols and enabling the creation of sophisticated trading signals through AI agents.

## Features

-   Real-time options pricing data
-   AI-powered trading signal generation
-   Integration with multiple DeFi protocols
-   Advanced derivatives toolkit

## Prerequisites

Before you begin, ensure you have:

-   A Grix API key (obtain from [Grix App](https://app.grix.finance/api))

## Setup

1. Get your API key from the Grix platform:

    - Visit [https://app.grix.finance/api](https://app.grix.finance/api)
    - Generate your API key
 
2. Set up MCP configuration:
   Create or update your `~/.cursor/mcp.json`:
    ```json
    {
    	"mcpServers": {
    		"GRIX": {
    			"command": "npm",	
    			"args": ["x", "@grixprotocol/grix_mcp"],
    			"env": {
    				"GRIX_API_KEY": "your_api_key_here"
    			}
    		}
    	}
    }
    ```

## Usage

Once configured, you can use Grix MCP to:

-   Fetch real-time options data
-   Generate trading signals

### Available Operations

-   `options`: Get options data for specific assets
-   `generateSignals`: Generate AI-powered trading signals based on user parameters

## Support

For any questions or issues:

-   Join our [Telegram channel](https://t.me/grixfinance)
-   Join our [Discord community](https://discord.com/invite/ZgPpr9psqp)
