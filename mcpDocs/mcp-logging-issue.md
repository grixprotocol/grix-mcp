Title: MCP Logging Issue - Discussion - Cursor - Community Forum

URL Source: https://forum.cursor.com/t/mcp-logging-issue/57577/3

Published Time: 2025-03-18T03:17:05+00:00

Markdown Content:
Wondering if anyone can point me to how to get logging in my MCP server.  
When I run in manually with node it all works fine. But when I point the IDE at it the logging does not come through. I presume cursor is spinning up a virtual environment or something and the log directory is in there instead.

hard to debug anything without it.

Running as :  
Command  
node C:\\git\\mcp-template\\dist\\index.js

2nd Q  
Is there a way to programmatically add the configs? I know about the project level MCP but more after global config. I searched everywhere but seems to be internal to the IDE?

13 days later

Plus one on this. Where are the MCP logs? I get an infinite generation message and no insight into issues.

Part of my .cursorrules:

### [](https://forum.cursor.com/t/mcp-logging-issue/57577/3#p-117280-locating-cursor-mcp-logs-1)Locating Cursor MCP Logs

When MCP fails, follow these steps to locate and analyze the logs:

1.  **Primary MCP Log Location**:

    \`\`\`
    ~/Library/Application Support/Cursor/logs/[SESSION_ID]/window[N]/exthost/anysphere.cursor-always-local/Cursor MCP.log
    \`\`\`

    Where:

    - `[SESSION_ID]` is a timestamp-based directory like “20250313T140544”
    - `[N]` is the window number (1, 2, 3, etc.)

2.  **Session Directories**:

    - Log sessions are organized by date in directories with format: YYYYMMDDTHHMMSS
    - The most recent sessions are the ones with the latest timestamps
    - Example: `~/Library/Application Support/Cursor/logs/20250313T140544/`

3.  **Related Log Files**:

    - Filesync logs: `window[N]/exthost/anysphere.cursor-always-local/Filesync.log`
    - Retrieval logs: `window[N]/exthost/anysphere.cursor-retrieval/Cursor Indexing & Retrieval.log`
    - Window renderer logs: `window[N]/renderer.log`

### [](https://forum.cursor.com/t/mcp-logging-issue/57577/3#p-117280-common-mcp-error-patterns-2)Common MCP Error Patterns

1.  **JSON Parsing Errors**:

    - Look for: `Client error for command '/path/to/script': Unexpected token 'X', "..." is not valid JSON`
    - Cause: MCP scripts outputting non-JSON text that Cursor expects to be JSON
    - Fix: Ensure your script outputs only valid JSON when communicating with Cursor

2.  **Connection Errors**:

    - Look for: `Error connecting to MCP server` or `Connection refused`
    - Cause: MCP server script not running or permissions issues
    - Fix: Check script permissions, execution state, network connectivity

3.  **Tool Execution Errors**:

    - Look for: `Failed to execute tool 'tool_name'`
    - Cause: Internal errors in MCP tool implementation
    - Fix: Debug the tool code, check parameter parsing

### [](https://forum.cursor.com/t/mcp-logging-issue/57577/3#p-117280-manual-log-analysis-commands-3)Manual Log Analysis Commands

Use these terminal commands to search for errors:

1.  **Find recent error logs**:

    \`\`\`
    find ~/Library/Application\ Support/Cursor/logs -type f -name "Cursor MCP.log" -mtime -3 | xargs grep -l "\[error\]"
    \`\`\`

2.  **Find errors for specific MCP server**:

    \`\`\`
    find ~/Library/Application\ Support/Cursor/logs -type f -name "Cursor MCP.log" | xargs grep -l "jira-final" | xargs grep "\[error\]"
    \`\`\`

3.  **View full context of errors**:

    \`\`\`
    grep -A 5 -B 2 "\[error\]" [path-to-specific-log-file]
    \`\`\`

4.  **Check successful tool calls for comparison**:

    \`\`\`
    grep "Successfully called tool" [path-to-specific-log-file]
    \`\`\`

Thank you so much for this!
