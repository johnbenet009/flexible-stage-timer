import { useCallback, useEffect, useRef, useState } from 'react';

export interface RemoteTimerState {
	minutes: number;
	seconds: number;
	isRunning: boolean;
	isPaused: boolean;
	isAttention: boolean;
	isComplete: boolean;
	programName: string;
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
	transcribe?: {
		transcript: string;
		interim: string;
		isListening: boolean;
		status: string;
	};
}

interface AuthInfo {
	required: boolean;
	ok: boolean;
}

export function useRemoteState() {
	const [state, setState] = useState<RemoteState>({});
	const [connected, setConnected] = useState(false);
	const [auth, setAuth] = useState<AuthInfo>({ required: false, ok: true });
	const [serverOffset, setServerOffset] = useState(0);
	const wsRef = useRef<WebSocket | null>(null);
	const retryRef = useRef(0);
	const aliveRef = useRef(true);
	const pinRef = useRef(sessionStorage.getItem('remotePin') || '');

	const connect = useCallback(() => {
		if (!aliveRef.current) return;
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		const ws = new WebSocket(`${proto}://${location.host}/ws`);
		wsRef.current = ws;

		ws.onopen = () => {
			retryRef.current = 0;
			setConnected(true);
			ws.send(JSON.stringify({ type: 'hello', pin: pinRef.current }));
		};
		ws.onmessage = (ev) => {
			try {
				const msg = JSON.parse(ev.data);
				if (msg.type === 'auth') {
					setAuth({ required: !!msg.required, ok: !!msg.ok });
				} else if (msg.type === 'state' && msg.state) {
					setState(msg.state);
					if (typeof msg.state.serverTime === 'number') {
						setServerOffset(msg.state.serverTime - Date.now());
					}
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
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'hello', pin }));
		}
	}, []);

	const sendCommand = useCallback((scope: string, action: string, payload?: Record<string, unknown>) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'command', command: { scope, action, ...payload } }));
		}
	}, []);

	return { state, connected, auth, submitPin, sendCommand, serverOffset };
}

export type RemoteConnection = ReturnType<typeof useRemoteState>;