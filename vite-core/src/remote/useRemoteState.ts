import { useCallback, useEffect, useRef, useState } from 'react';

export interface RemoteTimerState {
	minutes: number;
	seconds: number;
	isRunning: boolean;
	isPaused: boolean;
	isAttention: boolean;
	isComplete: boolean;
	programName: string;
	backgroundCleared?: boolean;
}

export interface RemoteState {
	serverTime?: number;
	timer?: RemoteTimerState;
	extraTime?: { isRunning: boolean; minutes: number; seconds: number };
	programs?: Array<{ id: string; name: string; duration: number; categoryId?: string }>;
	categories?: Array<{ id: string; name: string; color?: string }>;
	auto?: {
		enabled: boolean;
		categoryId: string;
		queueIds: string[];
		index: number;
		transition: { programId: string; programName: string; deadline: number } | null;
		cooldownSec: number;
	};
	alert?: { message: string; show: boolean; flashing: boolean };
	clock?: { time: string; use12: boolean; show: boolean };
	nextProgram?: { id: string; name: string; duration: number } | null;
	transcribe?: { transcript: string; interim: string; isListening: boolean; status: string };
	bible?: {
		books: Array<{ id: number; name: string }>;
		bookId: number | null;
		chapter: number | null;
		verse: number | null;
		presented: string;
		isShowing: boolean;
	};
	cameraMixer?: {
		cameras: Array<{ id: string; label: string }>;
		programId: string | null;
		audioMuted: boolean;
		overrides: { timer: boolean; bible: boolean; songs: boolean };
	};
}

interface AuthInfo {
	required: boolean;
	ok: boolean;
	role?: 'camera' | 'remote';
}

type RemoteSignal = { from: string; payload: Record<string, unknown> };

export function useRemoteState() {
	const [state, setState] = useState<RemoteState>({});
	const [connected, setConnected] = useState(false);
	const [auth, setAuth] = useState<AuthInfo>({ required: false, ok: true });
	const [serverOffset, setServerOffset] = useState(0);
	const [clientId, setClientId] = useState('');
	const wsRef = useRef<WebSocket | null>(null);
	const retryRef = useRef(0);
	const aliveRef = useRef(true);
	const pinRef = useRef(sessionStorage.getItem('remotePin') || '');
	const cameraToken = new URLSearchParams(location.hash.split('?')[1] || '').get('cameraToken') || '';

	const connect = useCallback(() => {
		if (!aliveRef.current) return;
		const open = async () => {
			let socketUrl: string;
			if (location.protocol === 'file:') {
				const status = await window.electronAPI?.remoteStatus?.();
				if (!status?.running || !status.port) throw new Error('Remote server is not running');
				socketUrl = `ws://127.0.0.1:${status.port}/ws`;
			} else {
				const proto = location.protocol === 'https:' ? 'wss' : 'ws';
				socketUrl = `${proto}://${location.host}/ws`;
			}
			if (!aliveRef.current) return;
			const ws = new WebSocket(socketUrl);
			wsRef.current = ws;
			ws.onopen = () => {
				retryRef.current = 0;
				setConnected(true);
				ws.send(JSON.stringify({ type: 'hello', pin: pinRef.current, cameraToken }));
			};
			ws.onmessage = event => {
				try {
					const message = JSON.parse(event.data);
					if (message.type === 'auth') {
						setAuth({ required: !!message.required, ok: !!message.ok, role: message.role === 'camera' ? 'camera' : 'remote' });
						if (typeof message.clientId === 'string') setClientId(message.clientId);
					} else if (message.type === 'signal' && typeof message.from === 'string' && message.payload) {
					window.dispatchEvent(new CustomEvent('stage-remote-signal', { detail: { from: message.from, payload: message.payload } }));
					} else if (message.type === 'state' && message.state) {
					setState(message.state);
					if (typeof message.state.serverTime === 'number') setServerOffset(message.state.serverTime - Date.now());
					}
				} catch { /* ignore malformed frames */ }
			};
			ws.onclose = () => {
				if (wsRef.current !== ws) return;
				setConnected(false);
				if (!aliveRef.current) return;
				const delay = Math.min(8000, 500 * Math.pow(2, retryRef.current));
				retryRef.current += 1;
				setTimeout(connect, delay);
			};
			ws.onerror = () => ws.close();
		};
		void open().catch(() => {
			if (!aliveRef.current) return;
			const delay = Math.min(8000, 500 * Math.pow(2, retryRef.current));
			retryRef.current += 1;
			setTimeout(connect, delay);
		});
	}, []);

	useEffect(() => {
		aliveRef.current = true;
		connect();
		return () => {
			aliveRef.current = false;
			wsRef.current?.close();
		};
	}, [connect]);

	const submitPin = useCallback((pin: string) => {
		pinRef.current = pin;
		sessionStorage.setItem('remotePin', pin);
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'hello', pin, cameraToken }));
	}, []);

	const sendCommand = useCallback((scope: string, action: string, payload?: Record<string, unknown>) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'command', command: { scope, action, ...payload } }));
	}, []);

	const sendSignal = useCallback((to: string, payload: Record<string, unknown>) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'signal', to, payload }));
	}, []);

	const onSignal = useCallback((callback: (signal: RemoteSignal) => void) => {
		const listener = (event: Event) => callback((event as CustomEvent<RemoteSignal>).detail);
		window.addEventListener('stage-remote-signal', listener);
		return () => window.removeEventListener('stage-remote-signal', listener);
	}, []);

	return { state, connected, auth, submitPin, sendCommand, sendSignal, onSignal, serverOffset, clientId };
}

export type RemoteConnection = ReturnType<typeof useRemoteState>;
