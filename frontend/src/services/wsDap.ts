import { wsBaseUrl } from "./env";

export interface DapMessage {
  seq: number;
  type: "request" | "response" | "event";
  [key: string]: any;
}

export interface DapRequest extends DapMessage {
  type: "request";
  command: string;
  arguments?: any;
}

export interface DapResponse extends DapMessage {
  type: "response";
  request_seq: number;
  success: boolean;
  command: string;
  message?: string;
  body?: any;
}

export interface DapEvent extends DapMessage {
  type: "event";
  event: string;
  body?: any;
}

export class DapClient {
  private socket: WebSocket | null = null;
  private buffer = "";
  private seq = 1;
  private pendingRequests = new Map<number, { resolve: (res: any) => void; reject: (err: any) => void }>();
  private onEventCallback: ((event: DapEvent) => void) | null = null;
  private onClosedCallback: (() => void) | null = null;

  connect(projectId: string, language: string, onEvent: (event: DapEvent) => void, onClosed?: () => void) {
    this.onEventCallback = onEvent;
    if (onClosed) this.onClosedCallback = onClosed;

    const token = localStorage.getItem("access_token");
    const wsUrl = `${wsBaseUrl}/ws/dap/${projectId}/${language}?token=${token}`;

    this.socket = new WebSocket(wsUrl);
    this.buffer = "";
    this.seq = 1;
    this.pendingRequests.clear();

    this.socket.onopen = () => {
      console.log("🔌 DAP Connection established for language:", language);
    };

    this.socket.onmessage = (e) => {
      this.buffer += e.data;
      this.processBuffer();
    };

    this.socket.onclose = (ev) => {
      console.log("🔌 DAP Connection closed:", ev.reason);
      if (this.onClosedCallback) this.onClosedCallback();
      this.rejectAllPending("Connection closed");
    };

    this.socket.onerror = (err) => {
      console.error("🔌 DAP Connection error:", err);
    };
  }

  sendRequest(command: string, args?: any): Promise<DapResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error("DAP socket is not open"));
        return;
      }

      const currentSeq = this.seq++;
      const payload: DapRequest = {
        seq: currentSeq,
        type: "request",
        command,
        arguments: args,
      };

      this.pendingRequests.set(currentSeq, { resolve, reject });
      
      const json = JSON.stringify(payload);
      const formatted = `Content-Length: ${json.length}\r\n\r\n${json}`;
      this.socket.send(formatted);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private rejectAllPending(reason: string) {
    this.pendingRequests.forEach(({ reject }) => reject(new Error(reason)));
    this.pendingRequests.clear();
  }

  private processBuffer() {
    while (true) {
      const match = /Content-Length:\s*(\d+)\r\n\r\n/i.exec(this.buffer);
      if (!match) break;

      const contentLength = parseInt(match[1], 10);
      const headerLength = match[0].length;
      const startIndex = match.index + headerLength;

      if (this.buffer.length < startIndex + contentLength) {
        break; // Wait for more chunks to arrive
      }

      const jsonStr = this.buffer.substring(startIndex, startIndex + contentLength);
      try {
        const msg = JSON.parse(jsonStr) as DapMessage;
        this.handleIncomingMessage(msg);
      } catch (e) {
        console.error("Failed to parse incoming DAP message:", e);
      }

      this.buffer = this.buffer.substring(startIndex + contentLength);
    }
  }

  private handleIncomingMessage(msg: DapMessage) {
    if (msg.type === "response") {
      const resp = msg as DapResponse;
      const pending = this.pendingRequests.get(resp.request_seq);
      if (pending) {
        this.pendingRequests.delete(resp.request_seq);
        if (resp.success) {
          pending.resolve(resp);
        } else {
          pending.reject(new Error(resp.message || `DAP command failed: ${resp.command}`));
        }
      }
    } else if (msg.type === "event") {
      const event = msg as DapEvent;
      if (this.onEventCallback) {
        this.onEventCallback(event);
      }
    }
  }
}

export const wsDap = new DapClient();
