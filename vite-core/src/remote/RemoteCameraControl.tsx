import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Home, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRemoteState } from './useRemoteState';
import { ConnectionBadge, PinGate } from './RemoteShell';

export default function RemoteCameraControl() {
	const conn = useRemoteState();
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState('');
	const [starting, setStarting] = useState(false);
	const [includeAudio, setIncludeAudio] = useState(false);
	const [cameraName, setCameraName] = useState(() => localStorage.getItem('stageCameraName') || '');
	const [incomingMessage, setIncomingMessage] = useState<{ id: string; text: string } | null>(null);
	const [replyDraft, setReplyDraft] = useState('');
	const { sendSignal, onSignal, clientId } = conn;
	const peers = useRef(new Map<string, RTCPeerConnection>());
	const queuedCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const registeredRef = useRef(false);
	const cameraApiAvailable = Boolean(navigator.mediaDevices?.getUserMedia);
	const validCameraInvite = conn.auth.role === 'camera';

	useEffect(() => {
		if (videoRef.current) videoRef.current.srcObject = stream;
	}, [stream]);

	useEffect(() => onSignal(async ({ from, payload }) => {
		if (from === 'host' && payload.type === 'camera-message' && typeof payload.id === 'string' && typeof payload.text === 'string') {
			setIncomingMessage({ id: payload.id, text: payload.text });
			setReplyDraft('');
			return;
		}
		if (payload.type === 'connect' && stream) {
			peers.current.get(from)?.close();
			const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
			peers.current.set(from, peer);
			stream.getTracks().forEach(track => peer.addTrack(track, stream));
			peer.onicecandidate = event => {
				if (event.candidate) sendSignal(from, { type: 'candidate', candidate: event.candidate.toJSON() });
			};
			const offer = await peer.createOffer();
			await peer.setLocalDescription(offer);
			sendSignal(from, { type: 'offer', sdp: offer.sdp });
			return;
		}
		const peer = peers.current.get(from);
		if (!peer) return;
		if (payload.type === 'answer' && typeof payload.sdp === 'string') {
			await peer.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
			for (const candidate of queuedCandidates.current.get(from) || []) await peer.addIceCandidate(candidate).catch(() => undefined);
			queuedCandidates.current.delete(from);
		} else if (payload.type === 'candidate' && payload.candidate) {
			if (peer.remoteDescription) await peer.addIceCandidate(payload.candidate as RTCIceCandidateInit).catch(() => undefined);
			else queuedCandidates.current.set(from, [...(queuedCandidates.current.get(from) || []), payload.candidate as RTCIceCandidateInit]);
		}
	}), [onSignal, sendSignal, stream]);

	useEffect(() => () => {
		if (registeredRef.current) sendSignal('host', { type: 'unregister' });
		peers.current.forEach(peer => peer.close());
		streamRef.current?.getTracks().forEach(track => track.stop());
	}, [sendSignal]);

	const startCamera = async () => {
		setStarting(true);
		setError('');
		try {
			if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not provide camera access on this connection. Use a secure HTTPS remote link or a native app with camera permission support.');
			const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: includeAudio });
			streamRef.current = next;
			setStream(next);
			const label = cameraName.trim() || `Phone camera ${clientId.slice(-4)}`;
			localStorage.setItem('stageCameraName', label);
			sendSignal('host', { type: 'register', label });
			registeredRef.current = true;
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Camera access was denied.');
		} finally {
			setStarting(false);
		}
	};

	const stopCamera = () => {
		if (registeredRef.current) sendSignal('host', { type: 'unregister' });
		registeredRef.current = false;
		peers.current.forEach(peer => peer.close());
		peers.current.clear();
		streamRef.current?.getTracks().forEach(track => track.stop());
		streamRef.current = null;
		setStream(null);
	};

	return (
		<PinGate conn={conn}>
			<div className="min-h-dvh bg-slate-950 text-white">
				<header className="flex items-center gap-3 border-b border-slate-800 px-3 py-3 sm:px-5">
					<Link to="/remote" className="rounded p-2 text-slate-300 hover:bg-slate-800" title="Remote home"><Home className="h-4 w-4" /></Link>
					<Camera className="h-5 w-5 text-cyan-300" /><h1 className="flex-1 font-bold">Remote Camera</h1><ConnectionBadge connected={conn.connected} />
				</header>
				<main className="mx-auto max-w-xl space-y-4 p-3 sm:p-5">
					<div className="relative aspect-video overflow-hidden border border-slate-800 bg-black">
						<video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
						{!stream && <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-500"><CameraOff className="mx-auto mb-2 h-7 w-7" />Camera preview</div>}
						{stream && <span className="absolute left-2 top-2 bg-red-600 px-2 py-1 text-[10px] font-bold uppercase">Live · muted</span>}
					</div>
					{!validCameraInvite && <div role="status" className="flex gap-2 border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100"><ShieldAlert className="h-4 w-4 shrink-0" /><span>Open the camera-only invitation link from the host. This page requires that link so camera access does not grant control of the timer or Bible.</span></div>}
					{(!window.isSecureContext || !cameraApiAvailable) && <div role="status" className="flex gap-2 border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100"><ShieldAlert className="h-4 w-4 shrink-0" /><span>Phone browsers require a trusted HTTPS origin for camera capture. This LAN HTTP link cannot access the camera. A PWA also needs HTTPS; a native WebView must expose getUserMedia and grant camera permission.</span></div>}
					<label className="block text-xs font-semibold text-slate-400">Camera name<input value={cameraName} disabled={Boolean(stream)} onChange={event => setCameraName(event.target.value)} placeholder={`Phone camera ${clientId.slice(-4)}`} maxLength={40} className="mt-1 min-h-11 w-full border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-60" /></label>
					<label className="flex min-h-12 cursor-pointer items-center gap-3 border border-slate-800 bg-slate-900 px-3 text-sm"><input type="checkbox" checked={includeAudio} disabled={Boolean(stream)} onChange={event => setIncludeAudio(event.target.checked)} className="h-4 w-4 accent-cyan-500" /><span className="flex-1">Include microphone audio</span><span className="text-[10px] uppercase text-slate-500">Optional</span></label>
					{error && <p role="alert" className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
					{stream ? <button type="button" onClick={stopCamera} className="min-h-12 w-full rounded bg-red-700 px-4 font-bold hover:bg-red-600"><CameraOff className="mr-2 inline h-4 w-4" />Stop sharing</button> : <button type="button" disabled={starting || !validCameraInvite || !cameraApiAvailable || !conn.connected || !clientId} onClick={() => void startCamera()} className="min-h-12 w-full rounded bg-cyan-700 px-4 font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"><Camera className="mr-2 inline h-4 w-4" />{starting ? 'Starting camera...' : 'Start camera'}</button>}
					<p className="text-center text-xs text-slate-500">Video only. Keep this page open while the camera is in use.</p>
				</main>
				{incomingMessage && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-labelledby="camera-message-title"><section className="w-full max-w-lg border border-cyan-700 bg-slate-900 p-5 shadow-2xl"><h2 id="camera-message-title" className="text-lg font-bold text-cyan-100">Message from the stage</h2><p className="mt-4 whitespace-pre-wrap break-words border-l-2 border-cyan-500 pl-3 text-base leading-relaxed">{incomingMessage.text}</p><label className="mt-5 block text-xs font-semibold text-slate-400">Reply<input value={replyDraft} onChange={event => setReplyDraft(event.target.value)} maxLength={500} placeholder="Optional reply" className="mt-1 min-h-11 w-full border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500" /></label><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { sendSignal('host', { type: 'camera-message-ack', id: incomingMessage.id }); setIncomingMessage(null); }} className="min-h-11 border border-slate-600 px-4 text-sm font-semibold hover:bg-slate-800">Okay</button><button type="button" onClick={() => { if (replyDraft.trim()) sendSignal('host', { type: 'camera-message-reply', id: incomingMessage.id, text: replyDraft.trim() }); sendSignal('host', { type: 'camera-message-ack', id: incomingMessage.id }); setIncomingMessage(null); }} className="min-h-11 bg-cyan-700 px-4 text-sm font-bold hover:bg-cyan-600">Reply and acknowledge</button></div></section></div>}
			</div>
		</PinGate>
	);
}
