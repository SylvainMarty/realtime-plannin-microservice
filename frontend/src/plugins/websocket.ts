import type { App } from "vue";

type WebsocketPluginOptions = { websocketEndpoint: string };

export type WebsocketSendMessage = (eventName: string, data: unknown) => void;
export type WebsocketOnMessage = (eventName: string, handler: Function) => void;
export type WebsocketOffMessage = (
  eventName: string,
  handler: Function
) => void;

export class WebsocketPlugin {
  private socket: WebSocket | undefined;
  private options: WebsocketPluginOptions | undefined;
  private messageHandlers: Map<string, Function[]>;

  constructor() {
    this.messageHandlers = new Map<string, Function[]>();
  }

  install(app: App, options: WebsocketPluginOptions) {
    this.options = options;
    app.provide<WebsocketSendMessage>(
      "$sendMessage",
      (eventName: string, data: unknown) => {
        this.socket?.send(
          JSON.stringify({
            event: eventName,
            data,
          })
        );
      }
    );
    app.provide<WebsocketOnMessage>(
      "$onMessage",
      (eventName: string, handler: Function) => {
        this.messageHandlers.set(eventName, [
          ...(this.messageHandlers.get(eventName) ?? []),
          handler,
        ]);
      }
    );
    app.provide<WebsocketOffMessage>(
      "$offMessage",
      (eventName: string, handler: Function) => {
        const handlers = this.messageHandlers.get(eventName);
        if (!handlers) {
          return;
        }
        this.messageHandlers.set(
          eventName,
          handlers.filter((h: Function) => h !== handler)
        );
      }
    );

    this.connect();
  }

  private async connect() {
    if (!this.options) {
      throw new Error(
        "Cannot connect to websocket: no websocketEndpoint option available"
      );
    }
    this.socket = await this.createWebsocketConnection(
      this.options?.websocketEndpoint
    );

    this.socket.onclose = (e) => {
      console.warn(
        "Socket is closed. Reconnect will be attempted in 1 second.",
        e.reason
      );
      setTimeout(() => {
        this.connect();
      }, 1000);
    };

    this.socket.onerror = (err: any) => {
      console.error(
        "Socket encountered error: ",
        err.message,
        "Closing socket"
      );
      this.socket?.close();
    };

    this.socket.onmessage = (event) => {
      const parsedMessage = JSON.parse(event.data);
      const handlers = this.messageHandlers.get(parsedMessage.event);
      if (handlers)
        handlers.forEach((handler: Function) => handler(parsedMessage));
    };
  }

  private async createWebsocketConnection(websocketEndpoint: string) {
    const socket = new WebSocket(websocketEndpoint);

    await new Promise((resolve) => {
      socket.onopen = (event) => {
        console.log("Websocket connected.");
        resolve(event);
      };
    });
    console.log("connecté to WS !");
    return socket;
  }
}
