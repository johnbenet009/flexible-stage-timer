import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, Check, CheckCircle2, Copy, ExternalLink, Link2, Loader2, MessageSquare, Mic, MicOff, Pencil, QrCode, Radio, Send, X } from 'lucide-react';

type RemoteCamera = { id: string; label: string };
type Overrides = { timer: boolean; bible: boolean; songs: boolean };
type CameraMode = 'local' | 'online';
type TunnelStatus = { running: boolean; url: string; error: string; accessPin: string; stage?: string };

export function RemoteCameraMixer() {
  const [savedMixer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('remoteCameraMixer') || '{}'); }
    catch { return {}; }
  });
  const [cameras, setCameras] = useState<RemoteCamera[]>([]);
  const [programId, setProgramId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>(() => savedMixer.overrides
    ? { timer: !!savedMixer.overrides.timer, bible: !!savedMixer.overrides.bible, songs: !!savedMixer.overrides.songs }
    : { timer: false, bible: false, songs: false });
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<CameraMode>('local');
  const [selectedLanInterface, setSelectedLanInterface] = useState(0);
  const [serverStatus, setServerStatus] = useState<(RemoteServerStatus & { cameraInviteToken?: string }) | null>(null);
  const [tunnel, setTunnel] = useState<TunnelStatus>({ running: false, url: '', error: '', accessPin: '', stage: 'idle' });
  const [onlineAccessPin, setOnlineAccessPin] = useState('');
  const [tunnelBusy, setTunnelBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [renamingId, setRenamingId] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [messageCameraId, setMessageCameraId] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [cameraMessages, setCameraMessages] = useState<Record<string, { id: string; text: string; status: string; reply?: string }>>({});
  const [audioMuted, setAudioMuted] = useState(() => typeof savedMixer.audioMuted === 'boolean' ? savedMixer.audioMuted : true);
  const programIdRef = useRef(programId);
  const savedLabelsRef = useRef<Record<string, string>>(savedMixer.cameraLabels || {});
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const candidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  programIdRef.current = programId;

  useEffect(() => {
    const mixer = { cameras, cameraLabels: Object.fromEntries(cameras.map(camera => [camera.id, camera.label])), programId, overrides, audioMuted };
    window.electronAPI?.remotePublish?.({ cameraMixer: mixer });
    localStorage.setItem('remoteCameraMixer', JSON.stringify(mixer));
  }, [cameras, programId, overrides, audioMuted]);

  useEffect(() => {
    if (previewVideoRef.current) previewVideoRef.current.srcObject = previewStream;
    if (previewAudioRef.current) previewAudioRef.current.srcObject = previewStream;
  }, [previewStream]);

  useEffect(() => {
    void window.electronAPI?.remoteStatus?.().then(setServerStatus);
    void window.electronAPI?.remoteTunnelStatus?.().then(setTunnel);
    return window.electronAPI?.onRemoteTunnelStatus?.(setTunnel);
  }, []);

  const baseUrl = mode === 'online' ? tunnel.url : serverStatus?.urls?.[selectedLanInterface]?.url || '';
  const cameraInviteUrl = baseUrl && serverStatus?.cameraInviteToken
    ? `${baseUrl.replace(/\/$/, '')}/#/remote/cameras?cameraToken=${encodeURIComponent(serverStatus.cameraInviteToken)}`
    : '';
  const shareText = cameraInviteUrl ? `Join the Stage Timer camera feed as a video source. Open this link on the phone that will provide the camera: ${cameraInviteUrl}` : '';
  const whatsappUrl = shareText ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : '';

  useEffect(() => {
    if (!cameraInviteUrl) { setQrDataUrl(''); return; }
    void QRCode.toDataURL(cameraInviteUrl, { width: 520, margin: 4, errorCorrectionLevel: 'Q' }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [cameraInviteUrl]);

  const chooseMode = async (nextMode: CameraMode) => {
    setMode(nextMode);
    setTunnel({ running: false, url: '', error: '', accessPin: '', stage: 'preparing' });
    let currentStatus = await window.electronAPI?.remoteStatus?.();
    if (!currentStatus?.running) {
      const started = await window.electronAPI?.remoteStart?.();
      if (started) currentStatus = started;
    }
    if (currentStatus) setServerStatus(currentStatus);
    if (nextMode === 'online') {
      setTunnelBusy(true);
      const result = await window.electronAPI?.remoteTunnelStart?.();
      if (result) {
        setTunnel(result);
        if (result.accessPin) setOnlineAccessPin(result.accessPin);
      }
      const refreshedStatus = await window.electronAPI?.remoteStatus?.();
      if (refreshedStatus) setServerStatus(refreshedStatus);
      setTunnelBusy(false);
    } else {
      const status = await window.electronAPI?.remoteStatus?.();
      if (status) setServerStatus(status);
    }
  };

  const stopOnline = async () => {
    setTunnelBusy(true);
    const result = await window.electronAPI?.remoteTunnelStop?.();
    if (result) setTunnel(result);
    setTunnelBusy(false);
  };

  const copyInvite = async () => {
    if (!cameraInviteUrl) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(cameraInviteUrl);
      else throw new Error('Clipboard API unavailable');
      setCopyStatus('Camera link copied');
    } catch {
      try {
        const input = document.createElement('textarea');
        input.value = cameraInviteUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Clipboard unavailable');
        setCopyStatus('Camera link copied');
      } catch {
        setCopyStatus('Could not copy. Select the link below to copy it.');
      }
    }
  };

  useEffect(() => {
    if (!inviteOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setInviteOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [inviteOpen]);

  useEffect(() => {
    const peers = peersRef.current;
    const unsubscribe = window.electronAPI?.onRemoteSignal?.(async ({ from, payload }) => {
      if (payload.type === 'register') {
        setCameras(previous => {
          const savedLabel = savedLabelsRef.current[from];
          const next = [...previous.filter(camera => camera.id !== from), { id: from, label: String(savedLabel || payload.label || `Camera ${previous.length + 1}`) }];
          return next;
        });
        return;
      }
      if (payload.type === 'camera-message-ack' && typeof payload.id === 'string') {
        setCameraMessages(previous => previous[from]?.id === payload.id ? { ...previous, [from]: { ...previous[from], status: 'Acknowledged' } } : previous);
        return;
      }
      if (payload.type === 'camera-message-reply' && typeof payload.id === 'string' && typeof payload.text === 'string') {
        setCameraMessages(previous => previous[from]?.id === payload.id ? { ...previous, [from]: { ...previous[from], status: 'Replied', reply: payload.text as string } } : previous);
        return;
      }
      if (payload.type === 'unregister') {
        setCameras(previous => {
          const next = previous.filter(camera => camera.id !== from);
          const nextProgram = programIdRef.current === from ? null : programIdRef.current;
          setProgramId(nextProgram);
          return next;
        });
        peersRef.current.get(from)?.close();
        peersRef.current.delete(from);
        return;
      }
      if (payload.type === 'offer' && typeof payload.sdp === 'string') {
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        const receivedStream = new MediaStream();
        peersRef.current.set(from, peer);
        setPreviewStatus('connecting');
        peer.onconnectionstatechange = () => {
          if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') setPreviewStatus('failed');
          else if (peer.connectionState === 'connected') setPreviewStatus('connected');
        };
        peer.onicecandidate = event => {
          if (event.candidate) window.electronAPI?.remoteSendSignal?.(from, { type: 'candidate', candidate: event.candidate.toJSON() });
        };
        peer.ontrack = event => {
          const stream = event.streams[0] || receivedStream;
          if (!event.streams[0] && !stream.getTracks().includes(event.track)) stream.addTrack(event.track);
          setPreviewStream(stream);
          setPreviewStatus('connected');
        };
        await peer.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
        for (const candidate of candidatesRef.current.get(from) || []) await peer.addIceCandidate(candidate).catch(() => undefined);
        candidatesRef.current.delete(from);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        window.electronAPI?.remoteSendSignal?.(from, { type: 'answer', sdp: answer.sdp });
        return;
      }
      const peer = peersRef.current.get(from);
      if (payload.type === 'candidate' && payload.candidate) {
        if (peer?.remoteDescription) await peer.addIceCandidate(payload.candidate as RTCIceCandidateInit).catch(() => undefined);
        else candidatesRef.current.set(from, [...(candidatesRef.current.get(from) || []), payload.candidate as RTCIceCandidateInit]);
      }
    });
    return () => {
      unsubscribe?.();
      peers.forEach(peer => peer.close());
      peers.clear();
    };
  }, []);

  const requestPreview = async (camera: RemoteCamera) => {
    setPreviewStream(null);
    setPreviewStatus('connecting');
    window.electronAPI?.remoteSendSignal?.(camera.id, { type: 'connect', role: 'preview' });
  };

  const chooseProgram = (camera: RemoteCamera) => {
    setProgramId(camera.id);
    void requestPreview(camera);
  };

  const updateOverride = (key: keyof Overrides, enabled: boolean) => {
    const next = { ...overrides, [key]: enabled };
    setOverrides(next);
  };

  const renameCamera = (camera: RemoteCamera) => {
    const label = labelDraft.trim();
    if (label) {
      savedLabelsRef.current[camera.id] = label;
      setCameras(previous => previous.map(item => item.id === camera.id ? { ...item, label } : item));
    }
    setRenamingId('');
  };

  const sendCameraMessage = (camera: RemoteCamera) => {
    const text = messageDraft.trim();
    if (!text) return;
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setCameraMessages(previous => ({ ...previous, [camera.id]: { id, text, status: 'Sent' } }));
    window.electronAPI?.remoteSendSignal?.(camera.id, { type: 'camera-message', id, text });
    setMessageDraft('');
    setMessageCameraId('');
  };

  return (
    <>
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-slate-950 p-3 text-white sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
        <Camera className="h-5 w-5 text-cyan-300" />
        <div className="min-w-0 flex-1"><h1 className="text-base font-bold">Remote Camera Mixer</h1><p className="text-xs text-slate-400">Select sources, choose the program feed, and assign background overrides.</p></div>
        <span className="text-xs text-slate-400">{cameras.length} connected</span>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <section className="min-w-0 space-y-3">
          <div className="relative aspect-video overflow-hidden border border-slate-800 bg-black"><video ref={previewVideoRef} autoPlay muted playsInline className="h-full w-full object-contain" /><audio ref={previewAudioRef} autoPlay muted={audioMuted} />{!previewStream && <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-500"><div><Camera className="mx-auto mb-2 h-7 w-7" />{previewStatus === 'connecting' ? 'Connecting to camera...' : previewStatus === 'failed' ? 'Connection lost. Preview the camera again.' : 'Choose Preview or Take live to view a camera.'}</div></div>}<span className="absolute left-2 top-2 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase">{previewStatus === 'connected' ? 'Live preview' : 'Preview'}</span></div>
          <button type="button" onClick={() => setAudioMuted(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800">{audioMuted ? <MicOff size={14} /> : <Mic size={14} />}{audioMuted ? 'Unmute program audio' : 'Mute program audio'}</button>
          <section className="border-t border-slate-800 pt-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Camera sources</h2><span className="text-xs text-slate-500">{cameras.length} connected</span></div><div className="space-y-2">{cameras.map((camera, index) => <article key={camera.id} className="border border-slate-800 bg-slate-900 p-2"><div className="flex flex-wrap items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center bg-slate-800 text-xs font-bold">{index + 1}</span>{renamingId === camera.id ? <form onSubmit={event => { event.preventDefault(); renameCamera(camera); }} className="flex min-w-32 flex-1 gap-1"><input autoFocus value={labelDraft} onChange={event => setLabelDraft(event.target.value)} maxLength={40} aria-label="Camera name" className="min-h-9 min-w-0 flex-1 border border-slate-700 bg-slate-950 px-2 text-sm" /><button type="submit" className="min-h-9 bg-cyan-800 px-2 text-xs font-bold">Save</button></form> : <span className="min-w-28 flex-1 truncate text-sm">{camera.label}</span>}<button type="button" title="Rename camera" aria-label={`Rename ${camera.label}`} onClick={() => { setLabelDraft(camera.label); setRenamingId(camera.id); }} className="grid h-9 w-9 place-items-center border border-slate-700 text-slate-300 hover:bg-slate-800"><Pencil size={14} /></button><button type="button" onClick={() => { setMessageCameraId(messageCameraId === camera.id ? '' : camera.id); setMessageDraft(''); }} className="inline-flex min-h-9 items-center gap-1.5 border border-slate-700 px-2.5 text-xs hover:bg-slate-800"><MessageSquare size={13} />Message</button><button type="button" onClick={() => void requestPreview(camera)} className="min-h-9 bg-slate-800 px-3 text-xs hover:bg-slate-700">Preview</button><button type="button" onClick={() => chooseProgram(camera)} className={`min-h-9 px-3 text-xs font-bold ${programId === camera.id ? 'bg-emerald-600 text-white' : 'bg-cyan-700 text-white hover:bg-cyan-600'}`}>{programId === camera.id ? <><Check className="mr-1 inline" size={12} />Program</> : 'Take live'}</button></div>{messageCameraId === camera.id && <form onSubmit={event => { event.preventDefault(); sendCameraMessage(camera); }} className="mt-2 flex gap-2"><input autoFocus value={messageDraft} onChange={event => setMessageDraft(event.target.value)} maxLength={500} placeholder={`Message ${camera.label}`} aria-label={`Message ${camera.label}`} className="min-h-10 min-w-0 flex-1 border border-slate-700 bg-slate-950 px-3 text-sm placeholder:text-slate-500" /><button type="submit" disabled={!messageDraft.trim()} className="inline-flex min-h-10 items-center gap-1.5 bg-cyan-800 px-3 text-xs font-bold disabled:opacity-40"><Send size={13} />Send</button></form>}{cameraMessages[camera.id] && <div role="status" className="mt-2 border-l-2 border-cyan-700 bg-slate-950 px-3 py-2 text-xs"><span className="font-semibold text-cyan-200">{cameraMessages[camera.id].status}:</span> <span className="text-slate-300">{cameraMessages[camera.id].text}</span>{cameraMessages[camera.id].reply && <p className="mt-1 text-emerald-300">Reply: {cameraMessages[camera.id].reply}</p>}</div>}</article>)}{cameras.length === 0 && <p className="border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">No phone cameras connected. Add one using the connection button.</p>}</div></section>
        </section>
        <aside className="min-w-0 space-y-4">
          <section className="border border-slate-800 bg-slate-900/50 p-3"><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Connection mode</h2><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => void chooseMode('local')} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded border text-xs font-bold ${mode === 'local' ? 'border-cyan-500 bg-cyan-900/40 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-400'}`}><Radio size={14} />Local Wi-Fi</button><button type="button" onClick={() => void chooseMode('online')} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded border text-xs font-bold ${mode === 'online' ? 'border-cyan-500 bg-cyan-900/40 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-400'}`}><Link2 size={14} />Online</button></div>{mode === 'local' && (serverStatus?.urls?.length ?? 0) > 1 && <label className="mt-2 block text-[11px] font-semibold text-slate-400">Wi-Fi network<select value={selectedLanInterface} onChange={event => setSelectedLanInterface(Number(event.target.value))} className="mt-1 min-h-9 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-white">{serverStatus?.urls.map((item, index) => <option key={`${item.interface}-${item.address}`} value={index}>{item.interface} · {item.address}</option>)}</select></label>}<p className="mt-2 text-[11px] leading-relaxed text-slate-400">Local uses the same Wi-Fi. Online creates a temporary Cloudflare HTTPS link; direct video may need TURN on restrictive networks.</p></section>
              {mode === 'online' && <section className="border border-slate-800 bg-slate-900/50 p-3"><div className="flex items-center gap-2 text-xs font-semibold">{tunnelBusy && <Loader2 className="h-4 w-4 animate-spin" />}{tunnel.running ? 'Online tunnel active' : tunnelBusy ? tunnel.stage || 'Starting secure tunnel...' : 'Online tunnel stopped'}</div>{tunnel.error && <p role="alert" className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-xs text-red-300">{tunnel.error}</p>}{onlineAccessPin && <p className="mt-2 text-xs text-amber-200">Remote-control PIN: <strong className="font-mono tracking-widest">{onlineAccessPin}</strong></p>}{tunnel.running && <button type="button" onClick={() => void stopOnline()} className="mt-2 min-h-9 rounded bg-red-800 px-3 text-xs font-bold hover:bg-red-700">Stop and release tunnel</button>}</section>}
          <section className="border border-cyan-900/50 bg-cyan-950/20 p-3"><h2 className="text-sm font-bold">Connect a phone camera</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Create a camera-only invitation, then scan it with the phone that will send video.</p><button type="button" onClick={async () => { if (!cameraInviteUrl) await chooseMode(mode); setCopyStatus(''); setInviteOpen(true); }} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-cyan-800 px-3 text-sm font-bold hover:bg-cyan-700"><QrCode size={17} />Show connection details</button></section>
          <section className="border border-slate-800 bg-slate-900/50 p-3"><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Override backgrounds</h2><div className="space-y-2"><label className="flex min-h-11 items-center gap-3 border border-cyan-900/60 bg-cyan-950/30 px-2.5 text-sm font-semibold"><input type="checkbox" checked={overrides.timer && overrides.bible && overrides.songs} onChange={event => { const enabled = event.target.checked; setOverrides({ timer: enabled, bible: enabled, songs: enabled }); }} className="h-4 w-4 accent-cyan-500" />All displays</label>{(['timer', 'bible', 'songs'] as const).map(key => <label key={key} className="flex min-h-11 items-center gap-3 border border-slate-800 bg-slate-900 px-2.5 text-sm capitalize"><input type="checkbox" checked={overrides[key]} onChange={event => updateOverride(key, event.target.checked)} className="h-4 w-4 accent-cyan-500" />{key} projection</label>)}</div></section>
        </aside>
      </div>
    </main>
    {inviteOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setInviteOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="camera-invite-title" className="my-auto w-full max-w-3xl border border-slate-700 bg-slate-950 shadow-2xl"><header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 sm:px-5"><Camera className="h-5 w-5 text-cyan-300" /><div className="min-w-0 flex-1"><h2 id="camera-invite-title" className="text-base font-bold">Connect a phone camera</h2><p className="text-xs text-slate-400">Scan the code with the phone that will provide video.</p></div><button type="button" onClick={() => setInviteOpen(false)} aria-label="Close connection details" className="grid h-10 w-10 place-items-center text-slate-300 hover:bg-slate-800"><X size={18} /></button></header><div className="grid gap-5 p-4 sm:grid-cols-[minmax(260px,1fr)_minmax(0,1.1fr)] sm:p-5">{qrDataUrl ? <div className="grid place-items-center bg-white p-3 sm:p-5"><img src={qrDataUrl} alt="Camera-only connection QR code" className="h-auto w-full max-w-[340px]" /></div> : <div className="grid min-h-64 place-items-center border border-slate-800 text-center text-sm text-slate-400">{tunnelBusy ? 'Preparing secure connection...' : 'Connection link is not ready yet.'}</div>}<div className="flex min-w-0 flex-col"><h3 className="font-bold text-cyan-100">Send the camera invitation</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">The QR opens the camera-only page directly. The phone needs camera permission; Online mode provides the HTTPS link required by phone browsers.</p><label className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Camera link</label><textarea readOnly value={cameraInviteUrl} rows={3} onFocus={event => event.currentTarget.select()} className="mt-1 w-full resize-none break-all border border-slate-700 bg-slate-900 p-2 font-mono text-xs leading-relaxed text-slate-300" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void copyInvite()} disabled={!cameraInviteUrl} className="inline-flex min-h-10 items-center gap-2 bg-slate-800 px-3 text-xs font-bold hover:bg-slate-700 disabled:opacity-40"><Copy size={14} />Copy link</button><button type="button" onClick={() => window.electronAPI?.openExternalUrl?.(whatsappUrl)} disabled={!whatsappUrl} className="inline-flex min-h-10 items-center gap-2 bg-emerald-700 px-3 text-xs font-bold hover:bg-emerald-600 disabled:opacity-40"><ExternalLink size={14} />Share with WhatsApp</button></div>{copyStatus && <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 size={14} />{copyStatus}</p>}<p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-500">Local Wi-Fi: both devices must use the same network. Online: leave the tunnel running while a camera is connected.</p></div></div></section></div>}
    </>
  );
}
