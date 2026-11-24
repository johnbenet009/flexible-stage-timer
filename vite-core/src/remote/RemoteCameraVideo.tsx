import { useEffect, useRef, useState } from 'react';
import type { RemoteConnection } from './useRemoteState';

export function RemoteCameraVideo({ conn, enabled, className = '' }: { conn: RemoteConnection; enabled: boolean; className?: string }) {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [frameSrc, setFrameSrc] = useState<string>('');
	const peerRef = useRef<RTCPeerConnection | null>(null);
	const candidatesRef = useRef<RTCIceCandidateInit[]>([]);
	const { sendSignal, onSignal, clientId } = conn;
	const cameraId = conn.state.cameraMixer?.programId;
	const audioMuted = conn.state.cameraMixer?.audioMuted ?? true;
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (!enabled || !cameraId || !clientId) {
			peerRef.current?.close();
			peerRef.current = null;
			setStream(null);
			setFrameSrc('');
			return;
		}
		let alive = true;
		const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
		const receivedStream = new MediaStream();
		peerRef.current = peer;
		peer.ontrack = event => {
			if (!alive) return;
			const nextStream = event.streams[0] || receivedStream;
			if (!event.streams[0] && !nextStream.getTracks().includes(event.track)) nextStream.addTrack(event.track);
			setStream(nextStream);
		};
		peer.onicecandidate = event => {
			if (event.candidate) sendSignal(cameraId, { type: 'candidate', candidate: event.candidate.toJSON() });
		};
		const stopListening = onSignal(async ({ from, payload }) => {
			if (from !== cameraId) return;
			if (payload.type === 'video-frame' && typeof payload.frame === 'string') {
				setFrameSrc(`data:image/jpeg;base64,${payload.frame}`);
				return;
			}
			if (peerRef.current !== peer) return;
			if (payload.type === 'offer' && typeof payload.sdp === 'string') {
				await peer.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
				for (const candidate of candidatesRef.current) await peer.addIceCandidate(candidate).catch(() => undefined);
				candidatesRef.current = [];
				const answer = await peer.createAnswer();
				await peer.setLocalDescription(answer);
				sendSignal(cameraId, { type: 'answer', sdp: answer.sdp });
			} else if (payload.type === 'candidate' && payload.candidate) {
				const candidate = payload.candidate as RTCIceCandidateInit;
				if (peer.remoteDescription) await peer.addIceCandidate(candidate).catch(() => undefined);
				else candidatesRef.current.push(candidate);
			}
		});
		sendSignal(cameraId, { type: 'connect', role: 'program', clientId });
		return () => {
			alive = false;
			stopListening();
			peer.close();
			if (peerRef.current === peer) peerRef.current = null;
			setStream(null);
			setFrameSrc('');
		};
	}, [enabled, cameraId, clientId, sendSignal, onSignal]);

	useEffect(() => {
		if (audioRef.current) audioRef.current.srcObject = stream;
	}, [stream]);

	if (!enabled || !cameraId) return null;
	return <>
		{frameSrc ? (
			<img src={frameSrc} alt="Camera Stream" className={className} />
		) : (
			<video autoPlay muted playsInline ref={element => { if (element && element.srcObject !== stream) element.srcObject = stream; }} className={className} />
		)}
		<audio ref={audioRef} autoPlay muted={audioMuted} />
	</>;
}
