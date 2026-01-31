# Hetzner Cloud MCP Server

This is a local MCP server bridge for Hetzner Cloud API.

## Setup

1. Dependencies are already installed (`npm install`).
2. API Token is configured in `.env`.

## Usage in Trae/MCP Client

Add the following configuration to your MCP settings:

```json
{
  "mcpServers": {
    "hetzner-bridge": {
      "command": "node",
      "args": ["C:\\Projeler\\ajans\\hetzner-bridge\\index.js"]
    }
  }
}
```

## Available Tools

- `list_servers`: List all servers.
- `get_server`: Get server details by ID.
- `create_server`: Create a new server (requires name, server_type, image).
- `delete_server`: Delete a server by ID.
- `list_locations`: List locations.
- `list_images`: List images.
- `list_server_types`: List server types.
