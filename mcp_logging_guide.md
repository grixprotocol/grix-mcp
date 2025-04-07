# MCP Server Logging Guide

This guide documents how to access and analyze logs for MCP (Model Context Protocol) servers when running through different clients like Cursor.

## Log File Locations

### Cursor MCP Log Locations

When running MCP servers through the Cursor IDE, logs are stored in the following directory structure:

```
~/Library/Application Support/Cursor/logs/[SESSION_ID]/window[N]/exthost/anysphere.cursor-always-local/Cursor MCP.log
```

Where:
- `[SESSION_ID]` is a timestamp-based directory in format: YYYYMMDDTHHMMSS (e.g., `20250313T140544`)
- `[N]` is the window number (1, 2, 3, etc.)

### Claude Desktop Log Locations

For Claude Desktop app, logs are stored in a different location:

```
~/Library/Logs/Claude/
```

With the following files:
- `mcp.log` - Contains general logging about MCP connections and connection failures
- `mcp-server-SERVERNAME.log` - Contains error (stderr) logging from the named server

## Log File Naming Patterns

1. **Session Directories**: Log sessions in Cursor are organized by date in directories with format: YYYYMMDDTHHMMSS
2. **Most Recent Sessions**: Look for the directories with the latest timestamps
3. **MCP Server-specific Logs**: In Claude, the server name is included in the log filename

## Related Log Files

In Cursor, additional related log files that might be helpful:
- Filesync logs: `window[N]/exthost/anysphere.cursor-always-local/Filesync.log`
- Retrieval logs: `window[N]/exthost/anysphere.cursor-retrieval/Cursor Indexing & Retrieval.log`
- Window renderer logs: `window[N]/renderer.log`

## Log Access Methods

### Using Terminal to Find and Read Logs

Use these terminal commands to search for logs:

1. **Find recent error logs in Cursor**:
   ```bash
   find ~/Library/Application\ Support/Cursor/logs -type f -name "Cursor MCP.log" -mtime -3 | xargs grep -l "\[error\]"
   ```

2. **Find errors for specific MCP server**:
   ```bash
   find ~/Library/Application\ Support/Cursor/logs -type f -name "Cursor MCP.log" | xargs grep -l "grix-mcp" | xargs grep "\[error\]"
   ```

3. **View full context of errors**:
   ```bash
   grep -A 5 -B 2 "\[error\]" [path-to-specific-log-file]
   ```

4. **Check successful tool calls**:
   ```bash
   grep "Successfully called tool" [path-to-specific-log-file]
   ```

5. **Follow Claude logs in real-time**:
   ```bash
   tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
   ```

## Log Format and Structure

### MCP Log Format

MCP logs typically include:
1. Timestamp
2. Log level (debug, info, notice, warning, error, critical, alert, emergency)
3. Message contents
4. Additional context data

### Common Error Patterns

1. **JSON Parsing Errors**:
   - Pattern: `Client error for command '/path/to/script': Unexpected token 'X', "..." is not valid JSON`
   - Cause: MCP scripts outputting non-JSON text that Cursor expects to be JSON
   - Fix: Ensure your script outputs only valid JSON when communicating with Cursor

2. **Connection Errors**:
   - Pattern: `Error connecting to MCP server` or `Connection refused`
   - Cause: MCP server script not running or permissions issues
   - Fix: Check script permissions, execution state, network connectivity

3. **Tool Execution Errors**:
   - Pattern: `Failed to execute tool 'tool_name'`
   - Cause: Internal errors in MCP tool implementation
   - Fix: Debug the tool code, check parameter parsing

## Implementing Logging in Your MCP Server

The current implementation in `index.ts` uses the MCP structured logging through:

```typescript
server.sendLoggingMessage({
  level: "info",
  message: `Logs Testing: Calling tool: ${name} with args: ${JSON.stringify(args)}`,
});
```

### Logging Levels

Supported logging levels (in order of increasing severity):
- DEBUG (0)
- INFO (1)
- NOTICE (2)
- WARNING (3)
- ERROR (4)
- CRITICAL (5)
- ALERT (6)
- EMERGENCY (7)

### Best Practices for MCP Server Logging

1. **Use structured logging** with consistent formats
2. **Include context** with each log entry
3. **Add timestamps** for chronological tracking
4. **Track request IDs** to associate related operations
5. **Log important events**:
   - Server initialization
   - Tool execution (start and completion)
   - Resource access
   - Error conditions
   - Performance metrics

## Troubleshooting Common Issues

If your logs are not appearing:
1. Ensure your server has declared logging capabilities: `capabilities: { logging: {} }`
2. Verify you're using `server.sendLoggingMessage()` with proper parameters
3. Check permissions on log directories
4. Restart the client application completely
5. Use console.error for critical messages that should be captured regardless of MCP configuration

## Real-time Monitoring

For real-time monitoring of logs during development:
1. Use the `tail -f` command on the appropriate log file
2. Consider implementing additional debug-level logging during development
3. Use the MCP Inspector tool for testing and debugging 