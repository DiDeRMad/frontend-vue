import { io, Socket } from 'socket.io-client';
import { store } from '../stores/store';
import { 
  addMessage,
} from '../stores/slices/chatSlice';
import {
  updatePosition,
  updateHealth,
  updateMana,
} from '../stores/slices/characterSlice';
import {
  setConnected,
  updatePing,
} from '../stores/slices/gameSlice';
import {
  enterCombat,
  exitCombat,
} from '../stores/slices/combatSlice';
import type { 
  ChatMessage,
  Vector3,
  CombatEventType,
  ICharacter
} from '@epic-mmorpg/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class GameSocket {
  private socket: Socket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
    this.startPingInterval();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    store.dispatch(setConnected(false));
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(setConnected(true));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setConnected(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });

    // Game events
    this.socket.on('player:move', this.handlePlayerMove.bind(this));
    this.socket.on('player:update', this.handlePlayerUpdate.bind(this));
    this.socket.on('chat:message', this.handleChatMessage.bind(this));
    this.socket.on('combat:event', this.handleCombatEvent.bind(this));
    this.socket.on('combat:start', this.handleCombatStart.bind(this));
    this.socket.on('combat:end', this.handleCombatEnd.bind(this));
    this.socket.on('zone:players', this.handleZonePlayers.bind(this));
    this.socket.on('error', this.handleError.bind(this));
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        const start = Date.now();
        this.socket.emit('ping', () => {
          const latency = Date.now() - start;
          store.dispatch(updatePing(latency));
        });
      }
    }, 5000);
  }

  // Event handlers
  private handlePlayerMove(data: { characterId: string; position: Vector3 }): void {
    const state = store.getState();
    if (data.characterId === state.character.currentCharacter?.id) {
      store.dispatch(updatePosition(data.position));
    }
    // TODO: Update other players' positions
  }

  private handlePlayerUpdate(data: Partial<ICharacter>): void {
    const state = store.getState();
    if (data.id === state.character.currentCharacter?.id) {
      if (data.health !== undefined && data.maxHealth !== undefined) {
        store.dispatch(updateHealth({ current: data.health, max: data.maxHealth }));
      }
      if (data.mana !== undefined && data.maxMana !== undefined) {
        store.dispatch(updateMana({ current: data.mana, max: data.maxMana }));
      }
    }
  }

  private handleChatMessage(message: ChatMessage): void {
    store.dispatch(addMessage(message));
  }

  private handleCombatEvent(data: {
    type: CombatEventType;
    attackerId: string;
    targetId: string;
    damage?: number;
    heal?: number;
  }): void {
    // TODO: Handle combat events (damage numbers, combat log, etc.)
    console.log('Combat event:', data);
  }

  private handleCombatStart(): void {
    store.dispatch(enterCombat());
  }

  private handleCombatEnd(): void {
    store.dispatch(exitCombat());
  }

  private handleZonePlayers(data: { players: string[] }): void {
    // TODO: Update zone players list
    console.log('Zone players:', data.players);
  }

  private handleError(error: { message: string; code?: string }): void {
    console.error('Socket error:', error);
    // TODO: Show error toast
  }

  // Emit methods
  move(position: Vector3): void {
    if (this.socket?.connected) {
      this.socket.emit('player:move', position);
    }
  }

  sendChatMessage(channel: string, message: string): void {
    if (this.socket?.connected) {
      this.socket.emit('chat:send', { channel, message });
    }
  }

  useSkill(skillId: string, targetId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('skill:use', { skillId, targetId });
    }
  }

  interact(targetId: string, type: string): void {
    if (this.socket?.connected) {
      this.socket.emit('interact', { targetId, type });
    }
  }

  joinZone(zoneId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('zone:join', { zoneId });
    }
  }

  leaveZone(zoneId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('zone:leave', { zoneId });
    }
  }

  // Party methods
  inviteToParty(characterId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('party:invite', { characterId });
    }
  }

  acceptPartyInvite(inviteId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('party:accept', { inviteId });
    }
  }

  leaveParty(): void {
    if (this.socket?.connected) {
      this.socket.emit('party:leave');
    }
  }

  // Trade methods
  initiateTrade(targetId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('trade:initiate', { targetId });
    }
  }

  acceptTrade(tradeId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('trade:accept', { tradeId });
    }
  }

  cancelTrade(): void {
    if (this.socket?.connected) {
      this.socket.emit('trade:cancel');
    }
  }

  // Helper methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const gameSocket = new GameSocket();