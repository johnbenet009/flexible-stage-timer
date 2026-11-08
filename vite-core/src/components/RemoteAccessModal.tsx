import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Radio, X, Copy, Check, ExternalLink, Wifi, ShieldCheck, ShieldOff, MonitorSmartphone, LayoutDashboard, Tv, Mic, FileText, Power, Loader2, RefreshCw } from 'lucide-react';

interface RemoteAccessModalProps {
  onClose: () => void;
  onStatusChange: (running: boolean, clients: number) => void;
}

type Status = RemoteServerStatus & { ok?: boolean; error?: string };

const QUICK_LINKS = [
  { label: 'Remote Home', path: '/#/remote', icon: LayoutDashboard, hint: 'Pick a tool, screen or control' },
  { label: 'Timer Control', path: '/#/remote/timer/control', icon: MonitorSmartphone, hint: 'Full operator console' },
  { label: 'Timer Control (Mini)', path: '/#/remote/timer/control?view=mini', icon: MonitorSmartphone, hint: 'Phone-friendly buttons' },
  { label: 'Timer Display', path: '/#/remote/timer/display', icon: Tv, hint: 'Live feed with own background' },
  { label: 'Transcribe Control', path: '/#/remote/transcribe/control', icon: Mic, hint: 'Start, stop and read live text' },
  { label: 'Transcribe Display', path: '/#/remote/transcribe/display', icon: FileText, hint: 'Live captions screen' },
];

export const RemoteAccessModal: React.FC<RemoteAccessModalProps> = ({ onClose, onStatusChange }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedInterface, setSelectedInterface] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  const applyStatus = (next: Status) => {
    setStatus(next);
    onStatusChange(Boolean(next.running), next.clients || 0);
  };

  const refresh = async () => {
    try {
      const result = await window.electronAPI?.remoteStatus?.();
      if (result) applyStatus(result);
    } catch {}
  };

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 3000);
    const unsubscribe = window.electronAPI?.onRemoteClientsChanged?.(() => void refresh());
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => {
      clearInterval(interval);
      unsubscribe?.();
      window.removeEventListener('keydown', onEscape);
    };
  }, []);

  const baseUrl = status?.urls?.[selectedInterface]?.url || '';
  const remoteHomeUrl = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/#/remote` : '';

  useEffect(() => {
    if (!remoteHomeUrl) { setQrDataUrl(''); return; }
    QRCode.toDataURL(remoteHomeUrl, { width: 232, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [remoteHomeUrl]);

  const toggleServer = async () => {
    setBusy(true);
    setError('');
    try {
      const result = status?.running
        ? await window.electronAPI?.remoteStop?.()
        : await window.electronAPI?.remoteStart?.();
      if (result) {
        if (result.ok === false) setError((result as any).error || 'Could not change the remote server state.');
        applyStatus(result as Status);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Remote server request failed.');
    } finally {
      setBusy(false);
    }
  };

  const savePin = async (pin: string) => {
    setBusy(true);
    try {
      const result = await window.electronAPI?.remoteSetPin?.(pin);
      if (result) {
        applyStatus(result as Status);
        setPinInput('');
        setPinSaved(true);
        setTimeout(() => setPinSaved(false), 2000);
      }
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {}
  };

  const running = Boolean(status?.running);
  const interfaceOptions = useMemo(() => status?.urls || [], [status]);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="remote-access-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${running ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
              <Radio size={22} />
            </div>
            <div>
              <h3 id="remote-access-title" className="text-lg font-black text-white">Remote Access</h3>
              <p className="text-xs text-gray-400">Control the timer and transcriber, or mirror live screens, from any device on this network.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close remote access" className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${running ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                <span className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-emerald-400' : 'bg-gray-600'}`} />
                {running ? `Broadcasting on port ${status?.port}` : 'Server off'}
              </span>
              {running && (
                <span className="text-xs font-semibold text-gray-400">
                  {status?.clients === 1 ? '1 device connected' : `${status?.clients || 0} devices connected`}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void toggleServer()}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 ${running ? 'bg-red-600/90 text-white hover:bg-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
              {running ? 'Stop broadcasting' : 'Start broadcasting'}
            </button>
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg border-l-2 border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

          {running && baseUrl ? (
            <>
              <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="mx-auto flex flex-col items-center gap-2">
                  <div className="rounded-2xl bg-white p-3 shadow-xl shadow-emerald-950/30">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR code for the remote selection screen" className="h-56 w-56" /> : <div className="flex h-56 w-56 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /></div>}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Scan to choose a remote tool</span>
                </div>

                <div className="min-w-0 space-y-4">
                  {interfaceOptions.length > 1 && (
                    <label className="block space-y-1.5 text-xs font-bold text-gray-400">
                      Network interface
                      <select
                        value={selectedInterface}
                        onChange={event => setSelectedInterface(Number(event.target.value))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white"
                      >
                        {interfaceOptions.map((option, index) => (
                          <option key={option.address} value={index}>{option.interface} · {option.address}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Remote selection screen</div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 font-mono text-sm font-bold text-emerald-300">{remoteHomeUrl}</code>
                      <button type="button" onClick={() => void copyLink('base', remoteHomeUrl)} title="Copy remote selection link" className="rounded-lg border border-gray-700 p-2.5 text-gray-300 hover:bg-gray-800">
                        {copiedKey === 'base' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                      <button type="button" onClick={() => window.electronAPI?.openExternalUrl?.(remoteHomeUrl)} title="Open remote selection screen in this PC's browser" className="rounded-lg border border-gray-700 p-2.5 text-gray-300 hover:bg-gray-800">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs leading-relaxed text-sky-200">
                    <Wifi size={15} className="mt-0.5 shrink-0" />
                    <span>The remote device must be on the same Wi-Fi or LAN. If it cannot connect, allow Stage Timer through Windows Firewall on private networks.</span>
                  </div>

                  <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                      {status?.pinEnabled ? <ShieldCheck size={15} className="text-emerald-400" /> : <ShieldOff size={15} className="text-amber-400" />}
                      {status?.pinEnabled ? 'Access PIN is on. Devices must enter it to connect.' : 'No PIN set. Anyone on this network can connect.'}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={pinInput}
                        onChange={event => setPinInput(event.target.value)}
                        placeholder={status?.pinEnabled ? 'Enter a new PIN to replace' : 'Set an access PIN (optional)'}
                        maxLength={24}
                        className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                      />
                      <button type="button" onClick={() => void savePin(pinInput)} disabled={busy || !pinInput.trim()} className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-bold text-white hover:bg-gray-600 disabled:opacity-40">
                        {pinSaved ? <Check size={14} className="text-emerald-400" /> : 'Save PIN'}
                      </button>
                      {status?.pinEnabled && (
                        <button type="button" onClick={() => void savePin('')} disabled={busy} className="rounded-lg border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950 disabled:opacity-40">Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">All remote pages</h4>
                  <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-300"><RefreshCw size={12} /> Refresh</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {QUICK_LINKS.map(link => {
                    const fullUrl = `${baseUrl}${link.path}`;
                    const Icon = link.icon;
                    return (
                      <div key={link.path} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 transition-colors hover:border-gray-600">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300"><Icon size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">{link.label}</div>
                          <div className="truncate text-[11px] text-gray-500">{link.hint}</div>
                        </div>
                        <button type="button" onClick={() => void copyLink(link.path, fullUrl)} title={`Copy ${link.label} link`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
                          {copiedKey === link.path ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                        </button>
                        <button type="button" onClick={() => window.electronAPI?.openExternalUrl?.(fullUrl)} title={`Open ${link.label} in browser`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
                          <ExternalLink size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : running ? (
            <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">No LAN network was detected. Connect this PC to Wi-Fi or Ethernet, then press Refresh.</p>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-700 px-6 py-10 text-center">
              <Radio size={36} className="text-gray-600" />
              <p className="max-w-md text-sm leading-relaxed text-gray-400">Start broadcasting to get a local address and QR code. Phones, tablets and other PCs on the same network can then open remote controls and live displays for the Timer and Transcribe tools.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};