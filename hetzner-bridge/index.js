import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from "axios";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_TOKEN = process.env.HETZNER_API_TOKEN;
const API_URL = "https://api.hetzner.cloud/v1";

if (!API_TOKEN) {
  console.error("HETZNER_API_TOKEN is missing in .env");
  process.exit(1);
}

const server = new Server(
  {
    name: "hetzner-bridge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_servers",
        description: "List all Hetzner Cloud servers",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_server",
        description: "Get details of a specific server",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Server ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_server",
        description: "Create a new server",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            server_type: { type: "string", description: "e.g. cx11" },
            image: { type: "string", description: "e.g. ubuntu-20.04" },
            location: { type: "string", description: "e.g. nbg1" },
          },
          required: ["name", "server_type", "image"],
        },
      },
      {
        name: "delete_server",
        description: "Delete a server",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Server ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "list_locations",
        description: "List available locations",
        inputSchema: {
            type: "object",
            properties: {},
        }
      },
      {
        name: "list_images",
        description: "List available images",
        inputSchema: {
            type: "object",
            properties: {},
        }
      },
      {
        name: "list_server_types",
        description: "List available server types",
        inputSchema: {
            type: "object",
            properties: {},
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const headers = { Authorization: `Bearer ${API_TOKEN}` };

    if (name === "list_servers") {
      const response = await axios.get(`${API_URL}/servers`, { headers });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.servers, null, 2) }],
      };
    }

    if (name === "get_server") {
      const { id } = args;
      const response = await axios.get(`${API_URL}/servers/${id}`, { headers });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.server, null, 2) }],
      };
    }

    if (name === "create_server") {
      const response = await axios.post(`${API_URL}/servers`, args, {
        headers: { ...headers, "Content-Type": "application/json" },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (name === "delete_server") {
      const { id } = args;
      const response = await axios.delete(`${API_URL}/servers/${id}`, { headers });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (name === "list_locations") {
        const response = await axios.get(`${API_URL}/locations`, { headers });
        return {
            content: [{ type: "text", text: JSON.stringify(response.data.locations, null, 2) }],
        };
    }

    if (name === "list_images") {
        const response = await axios.get(`${API_URL}/images`, { headers });
        return {
            content: [{ type: "text", text: JSON.stringify(response.data.images, null, 2) }],
        };
    }

    if (name === "list_server_types") {
        const response = await axios.get(`${API_URL}/server_types`, { headers });
        return {
            content: [{ type: "text", text: JSON.stringify(response.data.server_types, null, 2) }],
        };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
