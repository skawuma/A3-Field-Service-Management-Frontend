import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RealtimeEventMessage } from '../models/realtime-event.model';
import { AuthService } from './auth-service';

interface ParsedStompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private shouldReconnect = false;
  private isConnecting = false;
  private frameBuffer = '';

  private readonly dashboardEventsSubject = new Subject<RealtimeEventMessage>();
  private readonly alertEventsSubject = new Subject<RealtimeEventMessage>();
  private readonly userNotificationsSubject = new Subject<RealtimeEventMessage>();

  readonly dashboardEvents$: Observable<RealtimeEventMessage> = this.dashboardEventsSubject.asObservable();
  readonly alertEvents$: Observable<RealtimeEventMessage> = this.alertEventsSubject.asObservable();
  readonly userNotifications$: Observable<RealtimeEventMessage> = this.userNotificationsSubject.asObservable();

  constructor(
    private auth: AuthService,
    private zone: NgZone
  ) {}

  connect(): void {
    if (!this.isBrowserEnvironment() || this.isConnecting || this.isSocketOpen()) {
      return;
    }

    const accessToken = this.auth.getToken();
    if (!accessToken) {
      return;
    }

    this.shouldReconnect = true;
    this.isConnecting = true;
    this.clearReconnectTimer();
    this.frameBuffer = '';

    const socket = new WebSocket(this.resolveWebSocketUrl());
    this.socket = socket;

    socket.onopen = () => {
      const currentToken = this.auth.getToken();

      if (!currentToken) {
        this.disconnect();
        return;
      }

      this.sendFrame('CONNECT', {
        'accept-version': '1.2,1.1',
        'heart-beat': '0,0',
        host: this.resolveHostHeader(),
        Authorization: `Bearer ${currentToken}`
      });
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      if (typeof event.data !== 'string') {
        return;
      }

      this.handleIncomingChunk(event.data);
    };

    socket.onerror = () => {
      this.isConnecting = false;
    };

    socket.onclose = () => {
      this.isConnecting = false;
      this.socket = null;
      this.frameBuffer = '';

      if (this.shouldReconnect && this.auth.isAuthenticated()) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.isConnecting = false;
    this.frameBuffer = '';
    this.clearReconnectTimer();

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendFrame('DISCONNECT');
    }

    this.socket?.close();
    this.socket = null;
  }

  private handleIncomingChunk(chunk: string): void {
    this.frameBuffer += chunk;

    let frameBoundaryIndex = this.frameBuffer.indexOf('\0');
    while (frameBoundaryIndex >= 0) {
      const rawFrame = this.frameBuffer.slice(0, frameBoundaryIndex);
      this.frameBuffer = this.frameBuffer.slice(frameBoundaryIndex + 1);

      this.handleFrame(rawFrame);
      frameBoundaryIndex = this.frameBuffer.indexOf('\0');
    }
  }

  private handleFrame(rawFrame: string): void {
    const normalizedFrame = rawFrame.replace(/^\n+/, '');
    if (!normalizedFrame.trim()) {
      return;
    }

    const frame = this.parseFrame(normalizedFrame);
    if (!frame) {
      return;
    }

    switch (frame.command) {
      case 'CONNECTED':
        this.isConnecting = false;
        this.subscribeToTopics();
        return;
      case 'MESSAGE':
        this.routeMessage(frame);
        return;
      case 'ERROR':
        this.isConnecting = false;
        this.socket?.close();
        return;
      default:
        return;
    }
  }

  private routeMessage(frame: ParsedStompFrame): void {
    const destination = frame.headers['destination'];
    if (!destination) {
      return;
    }

    const payload = this.parseMessageBody(frame.body);
    if (!payload) {
      return;
    }

    this.zone.run(() => {
if (destination === '/topic/dashboard') {
    this.dashboardEventsSubject.next(payload);
    return;
  }

  if (destination === '/topic/alerts') {
    this.alertEventsSubject.next(payload);
    return;
  }

  if (destination === '/user/queue/notifications') {
    this.userNotificationsSubject.next(payload);
  }
    });
  }
private subscribeToTopics(): void {
  this.sendFrame('SUBSCRIBE', {
    id: 'dashboard-events',
    destination: '/topic/dashboard'
  });

  this.sendFrame('SUBSCRIBE', {
    id: 'dashboard-alerts',
    destination: '/topic/alerts'
  });

  this.sendFrame('SUBSCRIBE', {
    id: 'user-notifications',
    destination: '/user/queue/notifications'
  });
}
 

  private sendFrame(command: string, headers: Record<string, string> = {}, body = ''): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const lines = [
      command,
      ...Object.entries(headers).map(([key, value]) => `${key}:${value}`),
      '',
      body
    ];

    this.socket.send(`${lines.join('\n')}\0`);
  }

  private parseFrame(rawFrame: string): ParsedStompFrame | null {
    const lines = rawFrame.split('\n');
    const command = lines.shift()?.trim();

    if (!command) {
      return null;
    }

    const headers: Record<string, string> = {};
    let bodyIndex = lines.length;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]?.replace(/\r$/, '');
      if (line === '') {
        bodyIndex = index + 1;
        break;
      }

      const separatorIndex = line.indexOf(':');
      if (separatorIndex < 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      headers[key] = value;
    }

    const body = lines.slice(bodyIndex).join('\n').replace(/\r$/, '');

    return {
      command,
      headers,
      body
    };
  }

  private parseMessageBody(body: string): RealtimeEventMessage | null {
    try {
      return JSON.parse(body) as RealtimeEventMessage;
    } catch {
      return null;
    }
  }

  private resolveWebSocketUrl(): string {
    const apiUrl = environment.apiUrl;

    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      const parsed = new URL(apiUrl);
      parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      parsed.pathname = '/ws';
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  private resolveHostHeader(): string {
    if (!this.isBrowserEnvironment()) {
      return 'localhost';
    }

    return window.location.host || 'localhost';
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.isBrowserEnvironment()) {
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private isSocketOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof WebSocket !== 'undefined';
  }
}
