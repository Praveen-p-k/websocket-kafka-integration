const { io } = require("socket.io-client");
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const publishAndSubscribeApiKey = "ad06f829-ae8d-4929-9d69-b9e5341bdc3d";
const subscribeOnlyApiKey = "9c7941e3-f3a5-40ea-9a0b-284db06cfe2e";
const websocketUrl = "http://localhost:8001"; //wss://wss-api.iryscloud-dev.com/

class WebSocketClientService {
  constructor() {
    this.client = null;
  }

  initialize() {
    try {
      this.client = io(websocketUrl, {
        transportOptions: {
          polling: {
            extraHeaders: {
              Authorization: "Bearer 45640ee1-479a-47b8-89dd-2b0686cda5a9",
            },
          },
        }
      });

      this.client.on("connect", (data) => {
        console.log("Connected to WebSocket server");
      });

      this.client.on("connect_error", (error) => {
        if (error.message.includes("401")) {
          console.error("Invalid API key or token: Unauthorized access");
        } else {
          console.error("WebSocket connection error:", error.message);
        }
      });

      this.client.on("message", (payload) => {
        console.log("Message from server:", payload);
      });

      this.client.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
          console.error("Disconnected from WebSocket server by the server");
        } else if (reason === "ping timeout") {
          console.error("WebSocket disconnected due to timeout");
        } else {
          console.log("Disconnected from WebSocket server:", reason);
        }
      });
    } catch (error) {
      console.error("WebSocket initialization failed:", error.message);
    }
  }

  publishMessage(eventData) {
    if (!this.client || !this.client.connected) {
      console.error("WebSocket is not connected");
      return;
    }
    try {
      this.client.emit("publish", {
        apiKey: publishAndSubscribeApiKey,
        eventData,
      });
      console.log("published");
    } catch (error) {
      console.error("Failed to send message:", error.message);
    }
  }

  subscribeToEvent(event, callback) {
    if (!this.client) {
      console.error("WebSocket client is not initialized");
      return;
    }
    try {
      this.client.emit("subscribe", { apiKey: subscribeOnlyApiKey, event });
      console.log("subscribed");
    } catch (error) {
      console.error("Failed to send message:", error.message);
    }

    this.client.on(event, callback);
  }
}

const PORT = 5006;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on http://localhost:${PORT}`);
});

const webSocketClientService = new WebSocketClientService();
webSocketClientService.initialize();

const eventData = (number) => {
  return {
    sourceNumber: 1,
    test: number,
    payload: {
      records: [
        {
          eventVersion: "0.1",
          eventSource: "RAG_AI_Service",
          eventTime: "2024-12-02T10:09:10Z",
          eventName: "RAG_AI_DB_Interaction",
          eventType: "RAG_AI_SpaceTimeDB_Interaction",
          eventMessage: {
            info: {
              data: {
                referenceId: "123",
                documentId: "0e4d8fca-d7ec-428a-a5ae-082aaf2ceb46",
                namespaceName: "rag-ai-namespace",
              },
              metadata: {
                dataSize: "3KB",
                retryCount: "0",
                activityType: "ragAiSpacetimeInteraction",
                trackingId: "d2bfd9db-53d2-4117-8ddb-6911ee47ab19",
              },
            },
          },
          eventError: {},
        },
      ],
    }
  }

};

setTimeout(() => {
  webSocketClientService.publishMessage(eventData(0));
  webSocketClientService.publishMessage(eventData(1));
  webSocketClientService.publishMessage(eventData(2));
  webSocketClientService.publishMessage(eventData(3));
  webSocketClientService.publishMessage(eventData(4));
  webSocketClientService.publishMessage(eventData(5));
  webSocketClientService.publishMessage(eventData(6));
  webSocketClientService.publishMessage(eventData(7));
  webSocketClientService.publishMessage(eventData(8));
  webSocketClientService.publishMessage(eventData(9));
  webSocketClientService.publishMessage(eventData(10));
  webSocketClientService.publishMessage(eventData(11));
}, 3005);

webSocketClientService.subscribeToEvent("trackingId", (data) => {
  console.log("Received event data:", data);
});

// webSocketClientService.subscribeToEvent("RAG_AI_SpaceTimeDB_Interaction", (data) => {
//   console.log("Received event data:", data);
// });

// webSocketClientService.subscribeToEvent("connection-error", (data) =>
//   console.log("Error: ", data)
// );