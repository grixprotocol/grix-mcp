# Model Context Protocol (MCP): A Beginner's Guide

## Table of Contents
- [Introduction](#introduction)
- [What is MCP?](#what-is-mcp)
- [Core Capabilities](#core-capabilities)
  - [Resources](#resources)
  - [Resource Templates](#resource-templates)
  - [Prompts](#prompts)
  - [Tools](#tools)
- [MCP Server Architecture](#mcp-server-architecture)
- [Testing and Integration](#testing-and-integration)
- [Practical Examples](#practical-examples)
- [Getting Started](#getting-started)
- [Conclusion](#conclusion)

## Introduction

As Large Language Models (LLMs) like Claude become more integrated into our software systems, there's a growing need for standardized protocols that allow them to interact with external data and services. The Model Context Protocol (MCP) addresses this need by providing a consistent interface for LLMs to access data and functionality outside their built-in capabilities.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for Large Language Models (LLMs) to safely interact with external data and functionality. Think of it like a USB port for AI — it provides a common interface that lets any MCP-compatible LLM connect to your data and tools.

MCP provides a centralized protocol that streamlines the development of plug-and-play services for AI. Unlike other integration methods that might require custom implementations for each AI model, MCP offers a standardized approach that works across different LLMs.

Without interfaces like MCP, LLMs are limited to their built-in capabilities and training data. With MCP, they can be empowered to:

- Read files and databases
- Execute commands
- Access APIs
- Interact with local tools
- And more!

All of this happens with user oversight and permission, making it both powerful and secure.

## Core Capabilities

MCP provides three primary capabilities that enable LLMs to interact with external systems:

### Resources

Resources are MCP's way of exposing read-only data to LLMs. A resource is anything that has content that can be read, such as:

- Files on your computer
- Database records
- API responses
- Application data
- System information

Each resource has:
- A unique URI (like `file:///example.txt` or `database://users/123`)
- A display name
- Optional metadata (description, MIME type)
- Content (text or binary data)

Resources let you expose data to LLMs in a controlled, standardized way. Here are some real-world examples:

**Documentation Server:**
```
"docs://api/reference" -> API documentation
"docs://guides/getting-started" -> User guides
```

**Log Analysis Server:**
```
"logs://system/today" -> Today's system logs
"logs://errors/recent" -> Recent error messages
```

**Customer Data Server:**
```
"customers://profiles/summary" -> Customer overview
"customers://feedback/recent" -> Latest feedback
```

### Resource Templates

Resource templates allow you to define dynamic resources using URI patterns. Unlike static resources that have fixed URIs, templates let you create resources whose URIs and content can be generated based on parameters.

Think of them like URL patterns in a web framework — they let you match and handle whole families of resources using a single definition.

Resource templates are powerful when you need to:

**Serve Dynamic Data:**
```
"users://{userId}" -> User profiles
"products://{sku}" -> Product information
```

**Generate Content On-Demand:**
```
"reports://{year}/{month}" -> Monthly reports
"analytics://{dateRange}" -> Custom analytics
```

**Create Parameter-Based Resources:**
```
"search://{query}" -> Search results
"filter://{type}/{value}" -> Filtered data
```

Resource templates follow the [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570) format, which uses `{parameter}` syntax to express parameterization in URIs.

### Prompts

Prompts in MCP are structured templates that servers provide to standardize interactions with language models. Unlike resources which provide data, or tools which execute actions, prompts define reusable message sequences and workflows that help guide LLM behavior in consistent, predictable ways.

Prompts can accept arguments to customize the interaction while maintaining a standardized structure. If you imagine going to a restaurant, a prompt is like a menu item that you can pick from and provide to the waiter. Sometimes, you can customize the menu items by asking to add or remove certain items or to cook the result a particular way.

Here are some practical examples:

**Code Review Prompts:**
```
"name" -> code-review
Please review the following {{language}} code focusing on {{focusAreas}} for the following block of code:
```{{language}}
{{codeBlock}}
```

**Data Analysis Prompts:**
```
"name" -> analyze-sales-data
Analyze {{timeframe}} sales data focusing on {{metrics}}
```

**Content Generation Prompts:**
```
"name" -> generate-email
Generate a {{tone}} {{type}} email for {{context}}
```

Prompts help create consistent, reusable patterns for LLM interactions, which is especially valuable for common tasks that benefit from standardized approaches.

### Tools

Tools are executable functions that LLMs can call to perform actions or retrieve dynamic information. Unlike resources, which are read-only, and prompts, which structure LLM interactions, tools allow LLMs to actively do things like calculate values, make API calls, or modify data.

Tools enable LLMs to interact with systems and perform actions. Here are some practical examples:

**File Operations:**
```
name: "write-file"
arguments: {
  path: "/logs/report.txt",
  content: "Daily summary..."
}
```

**API Interactions:**
```
name: "fetch-weather"
arguments: {
  location: "San Francisco",
  units: "celsius"
}
```

**Data Processing:**
```
name: "analyze-data"
arguments: {
  dataset: "sales_2024_q1",
  operation: "summary_stats"
}
```

Each tool defines its interface through an inputSchema that describes the parameters it accepts. When an LLM calls a tool, it provides arguments according to this schema, and the tool returns results in a standardized format.

## MCP Server Architecture

An MCP server is a program that implements the Model Context Protocol to provide resources, prompts, or tools to language models. The server exposes capabilities through request handlers that respond to specific types of requests from clients.

The key components of an MCP server include:

1. **Server Configuration:** Defines the server's name, version, and enabled capabilities (resources, prompts, tools).

2. **Request Handlers:** Functions that process specific types of requests like listing resources, reading resource content, or calling tools.

3. **Transport Layer:** Handles communication between the server and clients (typically using stdio for local implementations).

Here's a simplified example of an MCP server structure:

```typescript
// Server configuration
const server = new Server(
  {
    name: "example-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      prompts: {},
      tools: {},
    },
  }
);

// Request handlers
setupHandlers(server);

// Start server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

Request handlers are typically organized by capability type:

```typescript
// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [...],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  // Handle resource reading
});

// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [...],
}));

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Handle tool execution
});
```

For larger applications, it's common to organize handlers into separate modules by capability type to improve code maintainability.

## Testing and Integration

There are several ways to test and integrate MCP servers:

### MCP Inspector

The MCP Inspector is a development tool that lets you test all MCP capabilities:

- Test all capabilities (resources, prompts, and tools)
- View available resources and their content
- Debug server responses
- Verify your implementation works as expected

To launch the Inspector:

```
npx @modelcontextprotocol/inspector node build/index.js
```

### Claude Desktop

Claude Desktop is an application that supports MCP. Here's how to set up an MCP server in Claude Desktop:

1. Install Claude for Desktop
2. Configure your MCP server in Claude's configuration file
3. Restart Claude
4. When chatting with Claude, you can select your MCP resources, prompts, or tools to enhance your interaction

## Practical Examples

Let's explore some practical examples of how MCP can be used:

### Resource Example

A simple greeting resource:

```typescript
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "hello://world",
        name: "Hello World Message",
        description: "A simple greeting message",
        mimeType: "text/plain",
      },
    ],
  };
});

// Return resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "hello://world") {
    return {
      contents: [
        {
          uri: "hello://world",
          text: "Hello, World! This is my first MCP resource.",
        },
      ],
    };
  }
  throw new Error("Resource not found");
});
```

### Resource Template Example

A template for personalized greetings:

```typescript
// Define the template
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: [
    {
      uriTemplate: 'greetings://{name}',
      name: 'Personal Greeting',
      description: 'A personalized greeting message',
      mimeType: 'text/plain',
    },
  ],
}));

// Handle template-based resource requests
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const greetingExp = /^greetings:\/\/(.+)$/;
  const greetingMatch = request.params.uri.match(greetingExp);
  if (greetingMatch) {
    const name = decodeURIComponent(greetingMatch[1]);
    return {
      contents: [
        {
          uri: request.params.uri,
          text: `Hello, ${name}! Welcome to MCP.`,
        },
      ],
    };
  }
  // ... other resource handling
});
```

### Prompt Example

A customizable greeting prompt:

```typescript
// Define the prompt
const prompts = {
  "create-greeting": {
    name: "create-greeting",
    description: "Generate a customized greeting message",
    arguments: [
      {   
        name: "name",
        description: "Name of the person to greet",
        required: true,
      },
      {
        name: "style",
        description: "The style of greeting, such a formal, excited, or casual. If not specified casual will be used"
      }
    ],
  },
};

// Handle prompt requests
const promptHandlers = {
  "create-greeting": ({ name, style = "casual" }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please generate a greeting in ${style} style to ${name}.`,
          },
        },
      ],
    };
  },
};
```

### Tool Example

A message generation tool:

```typescript
// Define the tool
const tools = {
  'create-message': {
    name: 'create-message',
    description: 'Generate a custom message with various options',
    inputSchema: {
      type: 'object',
      properties: {
        messageType: {
          type: 'string',
          enum: ['greeting', 'farewell', 'thank-you'],
          description: 'Type of message to generate',
        },
        recipient: {
          type: 'string',
          description: 'Name of the person to address',
        },
        tone: {
          type: 'string',
          enum: ['formal', 'casual', 'playful'],
          description: 'Tone of the message',
        },
      },
      required: ['messageType', 'recipient'],
    },
  },
};

// Implement the tool handler
const createMessage = (args) => {
  const { messageType, recipient } = args;
  const tone = args.tone || "casual";
  
  // Implementation details...
  
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
};
```

## Getting Started

To start building your own MCP server:

1. **Set up a new project:**
   ```
   mkdir hello-mcp
   cd hello-mcp
   npm init -y
   npm install @modelcontextprotocol/sdk
   npm install -D typescript @types/node
   ```

2. **Configure TypeScript:**
   Create a `tsconfig.json` file with appropriate settings.

3. **Implement server capabilities:**
   - Define resources, prompts, and tools
   - Implement handlers for each capability
   - Set up the server with stdio transport

4. **Test with MCP Inspector:**
   ```
   npx tsc
   npx @modelcontextprotocol/inspector node build/index.js
   ```

5. **Integrate with Claude Desktop or other MCP-compatible clients**

## Conclusion

The Model Context Protocol (MCP) provides a standardized way for language models to interact with external data and functionality. By implementing resources, prompts, and tools, developers can create powerful extensions that enhance LLM capabilities while maintaining security and control.

MCP offers several advantages:

- **Standardization:** A common interface that works across different LLMs
- **Modularity:** Plug-and-play components that can be mixed and matched
- **Security:** User oversight and permission for external interactions
- **Extensibility:** Easy addition of new capabilities as needed

As LLMs continue to evolve, MCP will play an increasingly important role in connecting them to the broader software ecosystem, enabling more powerful and useful AI-powered applications.

For more information, visit the [official MCP documentation](https://modelcontextprotocol.io/) and explore the [MCP GitHub repositories](https://github.com/modelcontextprotocol). 