/**
 * Lightweight WebSocket client manager for Hybrids App 1 & App 2
 */

class HybridsWSClient {
  constructor() {
    this.ws = null;
    this.role = "client";
    this.listeners = new Map();
    this.reconnectInterval = 2000;
    this.isConnected = false;
  }

  connect(role = "client") {
    this.role = role;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${location.host}/`;

    console.log(`[WSClient] Connecting to ${wsUrl} as ${this.role}...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[WSClient] Connected successfully as ${this.role}`);
        this.isConnected = true;
        this.startHeartbeat();
        this.emit("connection_change", { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "PONG") {
            return; // Ignore heartbeat responses
          }
          if (data.type) {
            this.emit(data.type, data);
          }
          this.emit("message", data);
        } catch (e) {
          console.error("[WSClient] Failed to parse message:", e);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.isConnected) {
          console.warn("[WSClient] Connection closed. Reconnecting in 2s...");
        }
        this.isConnected = false;
        this.emit("connection_change", { connected: false });
        setTimeout(() => this.connect(this.role), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.error("[WSClient] WebSocket error:", err);
      };
    } catch (err) {
      this.stopHeartbeat();
      console.error("[WSClient] Failed to initialize WebSocket:", err);
      setTimeout(() => this.connect(this.role), this.reconnectInterval);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "PING" });
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WSClient] Listener error for ${eventType}:`, e);
        }
      });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const jsonString = JSON.stringify(data, getCircularReplacer());
        this.ws.send(jsonString);
      } catch (err) {
        console.error("[WSClient] Failed to stringify message:", err);
      }
    } else {
      console.warn("[WSClient] Cannot send, WebSocket not OPEN");
    }
  }

  sendStateChange(state, extra = {}) {
    this.send({
      type: "STATE_CHANGE",
      state: state,
      timestamp: Date.now(),
      ...extra,
    });
  }

  sendCardsUpdated(selectedCards, baseCardId) {
    const cleanCards = Array.isArray(selectedCards) ? selectedCards.map(sanitizeCard) : [];
    this.send({
      type: "CARDS_UPDATED",
      selectedCards: cleanCards,
      baseCardId: baseCardId,
      timestamp: Date.now(),
    });
  }

  sendHoldingProgress(progress) {
    this.send({
      type: "HOLDING_PROGRESS",
      progress: progress,
      timestamp: Date.now(),
    });
  }

  sendHybridGenerated(payload) {
    const cleanPayload = { ...payload };
    if (cleanPayload.cards && Array.isArray(cleanPayload.cards)) {
      cleanPayload.cards = cleanPayload.cards.map(sanitizeCard);
    }
    this.send({
      type: "HYBRID_GENERATED",
      payload: cleanPayload,
      timestamp: Date.now(),
    });
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (
        seen.has(value) ||
        (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) ||
        (typeof window !== "undefined" && window.p5 && value instanceof window.p5.Image)
      ) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

function sanitizeCard(card) {
  if (!card) return null;
  return {
    id: card.id,
    name: card.name,
    img_src: card.img_src,
    suits: card.suits || card.suit,
    value: card.value,
    year: card.year,
    french_equivalence: card.french_equivalence,
    game: card.game
      ? {
          id: card.game.id,
          name: card.game.name,
          description: card.game.description,
        }
      : null,
  };
}

export const wsClient = new HybridsWSClient();
export default wsClient;
