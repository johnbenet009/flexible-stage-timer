import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Check, HelpCircle, Copy, Download, Loader2, Mic, Settings2, Sparkles, Square, Volume2, X, Wifi, WifiOff, ImagePlus, Archive, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import JSZip from 'jszip';

type AnalysisResponse = { text: string };
type SocialGraphic = { day: number; headline: string; attribution: string; dataUrl: string };
type GraphicTheme = { background: string; paper: string; accent: string; ink: string; muted: string };

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mostRecentSunday = () => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay());
  return toDateInputValue(date);
};

const GRAPHIC_THEMES: GraphicTheme[] = [
  { background: '#17191d', paper: '#f5f1e9', accent: '#e56b52', ink: '#202226', muted: '#555b62' },
  { background: '#102a43', paper: '#f0f4f8', accent: '#f0b429', ink: '#102a43', muted: '#486581' },
  { background: '#382f2b', paper: '#f4e9dc', accent: '#bc6c25', ink: '#30221b', muted: '#6f5e53' },
  { background: '#202c39', paper: '#e8f1f2', accent: '#36b3a8', ink: '#1b3035', muted: '#587579' },
  { background: '#3d1f31', paper: '#faedf2', accent: '#ed7a9b', ink: '#3b2030', muted: '#755669' },
  { background: '#223127', paper: '#edf1e5', accent: '#a7bd68', ink: '#243526', muted: '#65715d' },
  { background: '#292746', paper: '#f0effa', accent: '#a998e8', ink: '#2d2a4b', muted: '#696585' },
  { background: '#3a2820', paper: '#f8eee5', accent: '#e68a45', ink: '#3b281e', muted: '#766255' },
  { background: '#17343a', paper: '#edf5f1', accent: '#5ac1b4', ink: '#17363a', muted: '#5d7774' },
  { background: '#393521', paper: '#f5f0da', accent: '#d4b84d', ink: '#3c351f', muted: '#756d4e' },
  { background: '#202b34', paper: '#eff0ed', accent: '#ec795d', ink: '#21282c', muted: '#646e70' },
  { background: '#412c2b', paper: '#f7ece4', accent: '#c9846f', ink: '#392625', muted: '#795f5c' },
  { background: '#1b3030', paper: '#eaf1ec', accent: '#76aa91', ink: '#203730', muted: '#62766c' },
  { background: '#352539', paper: '#f3eaf2', accent: '#cf8fc5', ink: '#36263a', muted: '#725d74' },
  { background: '#263340', paper: '#f1eee6', accent: '#d98d60', ink: '#27333b', muted: '#6c7373' },
  { background: '#3b3020', paper: '#f5efdf', accent: '#d18e40', ink: '#372918', muted: '#766649' },
  { background: '#18323f', paper: '#eaf2f6', accent: '#6db4d2', ink: '#1c3441', muted: '#5b7582' },
  { background: '#382d3d', paper: '#f1edf4', accent: '#be9bd2', ink: '#352a3a', muted: '#716579' },
  { background: '#25362e', paper: '#f0f0e6', accent: '#cfaa61', ink: '#25332a', muted: '#657064' },
  { background: '#242c37', paper: '#f2eee9', accent: '#d7776c', ink: '#252a31', muted: '#6b6d70' },
];

const wrapCanvasText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const parseSocialPlanEntries = (analysis: string) => {
  const lines = analysis.replace(/\r/g, '').split('\n');
  const dayEntries: { day: number; headline: string; attribution: string }[] = [];
  let current: { day: number; headline: string; attribution: string } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^#{1,6}\s*/, '').replace(/^[-*+]\s*/, '').replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^_(.*?)_$/, '$1').trim();
    const dayMatch = line.match(/^(?:\*\*)?Day\s*(\d+)(?:\*\*)?\s*(?::|[.)]|[-–—])?\s*(.*?)\s*$/i);
    if (dayMatch) {
      if (current?.headline) dayEntries.push(current);
      current = { day: Number(dayMatch[1]), headline: dayMatch[2].replace(/^\*\*(.*?)\*\*$/, '$1').trim(), attribution: '' };
      continue;
    }
    if (!current || !line) continue;
    if (/^from\s+.+\s+sermon\s+titled\b/i.test(line)) {
      current.attribution = line;
    } else if (!current.headline && !/^seven[- ]day|^social media/i.test(line)) {
      current.headline = line.replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^_(.*?)_$/, '$1').trim();
    }
  }
  if (current?.headline) dayEntries.push(current);

  const uniqueDays = [...new Map(dayEntries.map(entry => [entry.day, entry])).values()]
    .filter(entry => entry.day >= 1 && entry.day <= 7)
    .sort((left, right) => left.day - right.day);
  if (uniqueDays.length === 7) return uniqueDays;

  const sectionMatch = analysis.match(/(?:^|\n)\s*#{1,6}\s*(?:\*\*)?(?:seven[- ]day|7[- ]day)\s+(?:social\s+)?(?:graphic\s+)?(?:text\s+)?plan(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*#{1,5}\s+(?!Day\s*\d)|$)/im);
  if (!sectionMatch) return uniqueDays;

  const sectionLines = sectionMatch[1].split('\n').map(line => line.trim()).filter(Boolean);
  const posts = sectionLines.filter(line => !/^from\s+.+\s+sermon\s+titled\b/i.test(line))
    .map(line => line.replace(/^\s*(?:[-*+]\s*|\d+[.)]\s*)/, '').replace(/^(?:\*\*)?Day\s*\d+(?:\*\*)?\s*(?::|[.)]|[-–—])\s*/i, '').replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^_(.*?)_$/, '$1').trim())
    .filter(Boolean);
  if (posts.length >= 7) return posts.slice(0, 7).map((headline, index) => ({ day: index + 1, headline, attribution: '' }));
  return uniqueDays;
};

const makeSocialGraphic = (day: number, headline: string, attribution: string, designIndex: number): SocialGraphic => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the graphic canvas.');

  const theme = GRAPHIC_THEMES[designIndex % GRAPHIC_THEMES.length];
  const layout = designIndex % 5;
  context.fillStyle = theme.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = theme.paper;
  if (layout === 0) context.fillRect(74, 170, 932, 1580);
  else if (layout === 1) context.fillRect(110, 190, 860, 1540);
  else if (layout === 2) context.fillRect(70, 250, 940, 1420);
  else if (layout === 3) context.fillRect(125, 160, 830, 1600);
  else context.fillRect(88, 210, 904, 1500);
  context.fillStyle = theme.accent;
  if (layout === 0) context.fillRect(74, 170, 932, 18);
  else if (layout === 1) context.fillRect(110, 190, 16, 1540);
  else if (layout === 2) context.fillRect(70, 250, 940, 12);
  else if (layout === 3) context.fillRect(125, 160, 830, 18);
  else context.fillRect(88, 210, 12, 1500);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = theme.accent;
  context.font = `${layout === 2 ? '800 28px Arial, sans-serif' : '700 30px Arial, sans-serif'}`;
  context.fillText(`SERMON NOTES     /     ${String(day).padStart(2, '0')}`, 540, layout === 2 ? 385 : 338, 790);

  if (layout === 2) {
    context.strokeStyle = theme.accent;
    context.lineWidth = 8;
    context.beginPath();
    context.arc(540, 930, 365, 0, Math.PI * 2);
    context.stroke();
  } else if (layout === 4) {
    context.fillStyle = theme.accent;
    context.globalAlpha = 0.12;
    context.beginPath();
    context.arc(830, 450, 250, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  context.fillStyle = theme.ink;
  let fontSize = layout === 3 ? 76 : 84;
  let lines: string[] = [];
  do {
    context.font = `${layout === 1 ? '700' : '800'} ${fontSize}px ${layout === 4 ? 'Georgia, serif' : 'Arial, sans-serif'}`;
    lines = wrapCanvasText(context, headline, layout === 1 ? 680 : 738);
    if (lines.length <= 6 && Math.max(...lines.map(line => context.measureText(line).width)) <= (layout === 1 ? 680 : 738)) break;
    fontSize -= 4;
  } while (fontSize > 48);

  const lineHeight = Math.round(fontSize * 1.22);
  const startY = 930 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, layout === 1 ? 570 : 540, startY + index * lineHeight, 740));

  context.fillStyle = theme.accent;
  context.fillRect(layout === 3 ? 474 : 170, 1420, layout === 3 ? 132 : 210, 8);
  context.fillStyle = theme.muted;
  context.font = '500 31px Arial, sans-serif';
  const attributionLines = wrapCanvasText(context, attribution, 740);
  attributionLines.slice(0, 3).forEach((line, index) => context.fillText(line, 540, 1510 + index * 48, 740));

  context.fillStyle = theme.paper;
  context.font = '700 28px Arial, sans-serif';
  context.fillText('RCCG LP112     •     FAITH IN EVERYDAY LIFE', 540, 1812, 900);

  return { day, headline, attribution, dataUrl: canvas.toDataURL('image/png') };
};

export const TranscribeTab: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [meterGain, setMeterGain] = useState(1);
  const [inputLevel, setInputLevel] = useState(0);
  const [inputDb, setInputDb] = useState(-60);
  const [inputLabel, setInputLabel] = useState('Microphone not connected');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [internetStatus, setInternetStatus] = useState<'unchecked' | 'checking' | 'online' | 'offline'>('unchecked');
  const [showInternetGate, setShowInternetGate] = useState(true);
  const [token, setToken] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [serviceDate, setServiceDate] = useState(mostRecentSunday);
  const [sermonTitle, setSermonTitle] = useState('');
  const [designIndex, setDesignIndex] = useState(0);
  const [socialGraphics, setSocialGraphics] = useState<SocialGraphic[]>([]);
  const [selectedGraphicDay, setSelectedGraphicDay] = useState<number | null>(null);
  const [previewGraphic, setPreviewGraphic] = useState<SocialGraphic | null>(null);
  const [graphicError, setGraphicError] = useState('');
  const [isGeneratingGraphics, setIsGeneratingGraphics] = useState(false);
  const [graphicsProgress, setGraphicsProgress] = useState(0);
  const [isDraftCollapsed, setIsDraftCollapsed] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [secureStorageAvailable, setSecureStorageAvailable] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const socialGraphicsRef = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const meterGainRef = useRef(1);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcript, interim]);

  useEffect(() => {
    if (socialGraphics.length > 0) {
      requestAnimationFrame(() => socialGraphicsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [socialGraphics]);

  useEffect(() => {
    if (!previewGraphic) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewGraphic(null);
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const currentIndex = socialGraphics.findIndex(graphic => graphic.day === previewGraphic.day);
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + socialGraphics.length) % socialGraphics.length;
        const nextGraphic = socialGraphics[nextIndex];
        if (nextGraphic) {
          setPreviewGraphic(nextGraphic);
          setSelectedGraphicDay(nextGraphic.day);
        }
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [previewGraphic, socialGraphics]);

  useEffect(() => {
    meterGainRef.current = meterGain;
  }, [meterGain]);

  useEffect(() => {
    void window.electronAPI?.getCopilotTokenStatus?.()
      .then(result => {
        setTokenConfigured(result.configured);
        setSecureStorageAvailable(result.encryptionAvailable);
      })
      .catch(() => setSecureStorageAvailable(false));
    void navigator.mediaDevices?.enumerateDevices().then(list => setDevices(list.filter(device => device.kind === 'audioinput'))).catch(() => undefined);
    const unsubscribe = window.electronAPI?.onSpeechRecognitionEvent?.(event => {
      if (event.type === 'start') {
        setIsListening(true);
        setStatus('Listening in Google Chrome');
      } else if (event.type === 'end') {
        setIsListening(false);
        setInterim('');
        setStatus('Stopped');
        stopMeter();
      } else if (event.type === 'error') {
        setIsListening(false);
        setInterim('');
        setStatus('Chrome recognition error');
        setError(event.error === 'not-allowed'
          ? 'Google Chrome microphone permission was denied. Allow microphone access and try again.'
          : event.error === 'network'
            ? 'Google Chrome could not reach its speech-recognition service. Check Chrome version and firewall, VPN, or proxy settings.'
            : `Google Chrome speech recognition error: ${event.error || 'unknown error'}`);
        stopMeter();
      } else if (event.type === 'result') {
        if (event.finalText?.trim()) {
          const finalText = event.finalText.trim();
          setTranscript(current => `${current}${current && !/\\s$/.test(current) ? ' ' : ''}${finalText}`);
        }
        setInterim(event.interimText || '');
      }
    });
    return () => {
      unsubscribe?.();
      void window.electronAPI?.stopChromeSpeechRecognition?.();
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  const startMeter = async () => {
    if (streamRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;
    setInputLabel(stream.getAudioTracks()[0]?.label || 'Default microphone');
    void navigator.mediaDevices.enumerateDevices().then(list => setDevices(list.filter(device => device.kind === 'audioinput'))).catch(() => undefined);
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const sample = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const value of samples) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / samples.length) * meterGainRef.current;
      setInputLevel(Math.min(1, rms * 3.4));
      const rawRms = Math.sqrt(sum / samples.length);
      setInputDb(rawRms > 0 ? Math.max(-60, Math.round(20 * Math.log10(rawRms))) : -60);
      animationRef.current = requestAnimationFrame(sample);
    };
    sample();
  };

  const stopMeter = () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setInputLevel(0);
    setInputDb(-60);
    setInputLabel('Microphone not connected');
  };

  const startTranscription = async () => {
    setError('');
    setIsPreparing(true);
    setStatus('Connecting to Google Chrome');
    try {
      setStatus('Connecting to Google Chrome');
      await startMeter();
      const result = await window.electronAPI?.startChromeSpeechRecognition?.({
        language: 'en-US',
        deviceLabel: streamRef.current?.getAudioTracks()[0]?.label || inputLabel,
      });
      if (!result) throw new Error('The Google Chrome speech bridge is unavailable. Restart the updated desktop app and try again.');
      setStatus(result.customTrack
        ? `Listening in Google Chrome · ${result.selectedDevice}`
        : `Listening in Google Chrome · ${result.selectedDevice} (Chrome input)`);
      setIsListening(true);
    } catch (cause) {
      stopMeter();
      setStatus('Transcription unavailable');
      setError(cause instanceof Error ? cause.message : 'Could not start Google Chrome speech recognition. Check Chrome installation and microphone permission.');
    } finally {
      setIsPreparing(false);
    }
  };

  const toggleMicrophoneTest = async () => {
    if (streamRef.current) {
      stopMeter();
      setStatus('Ready');
      return;
    }
    try {
      await startMeter();
      setStatus('Microphone test');
    } catch (cause) {
      setStatus('Microphone unavailable');
      setError(cause instanceof Error ? cause.message : 'Could not access the microphone. Check Windows microphone permissions.');
    }
  };

  const stopTranscription = () => {
    void window.electronAPI?.stopChromeSpeechRecognition?.();
    stopMeter();
    setIsListening(false);
    setInterim('');
    setStatus('Stopped');
  };

  const checkInternet = async () => {
    setInternetStatus('checking');
    try {
      const result = await window.electronAPI?.checkInternetConnection?.();
      if (!result) throw new Error('The desktop network checker is unavailable. Restart the updated app and try again.');
      if (result.online) {
        setInternetStatus('online');
        setShowInternetGate(false);
        setError('');
      } else {
        setInternetStatus('offline');
        setShowInternetGate(true);
        const failures = result.checks?.filter(check => !check.online).map(check => {
          const host = new URL(check.endpoint).hostname;
          return `${host}: ${check.error || `HTTP ${check.status}`}`;
        });
        setError(failures?.length ? `The desktop app could not reach its internet checks. ${failures.join('; ')}` : 'The desktop app could not reach the internet checks.');
      }
    } catch (cause) {
      setInternetStatus('offline');
      setShowInternetGate(true);
      setError(cause instanceof Error ? cause.message : 'Could not check internet access from the desktop app.');
    }
  };

  const saveToken = async () => {
    if (!token.trim()) return;
    try {
      const result = await window.electronAPI?.saveCopilotToken?.(token.trim());
      if (!result?.ok) throw new Error(result?.error || 'Could not securely save the token.');
      setToken('');
      setTokenConfigured(true);
      setShowSettings(false);
      setAnalysisError('');
    } catch (cause) {
      setAnalysisError(cause instanceof Error ? cause.message : 'Could not save GitHub Copilot token.');
    }
  };

  const clearToken = async () => {
    await window.electronAPI?.clearCopilotToken?.();
    setTokenConfigured(false);
    setToken('');
  };

  const analyzeTranscript = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysis('');
    setSocialGraphics([]);
    setSelectedGraphicDay(null);
    try {
      const result: AnalysisResponse | undefined = await window.electronAPI?.analyzeChurchTranscript?.({ transcript });
      if (!result?.text) throw new Error('The analysis did not return any content.');
      setAnalysis(result.text);
    } catch (cause) {
      setAnalysisError(cause instanceof Error ? cause.message : 'Analysis failed. Check your Copilot settings and internet connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `church-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyAnalysis = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(analysis);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopyStatus('copied');
    } catch {
      try {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = analysis;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const succeeded = document.execCommand('copy');
        temporaryInput.remove();
        setCopyStatus(succeeded ? 'copied' : 'failed');
      } catch {
        setCopyStatus('failed');
      }
    }
    window.setTimeout(() => setCopyStatus('idle'), 2500);
  };

  const makeSocialPosts = async () => {
    setGraphicError('');
    setIsGeneratingGraphics(true);
    setGraphicsProgress(0);
    try {
      const source = parseSocialPlanEntries(analysis);
      if (source.length !== 7) throw new Error('Could not find all seven daily graphic entries. Use Day 1: headline through Day 7: headline, with one attribution line under each, then try again.');

      const parsedTitle = analysis.match(/^\s*#{1,3}\s*Suggested sermon title\s*\n+\s*\*{0,2}([^\n*]+?)\*{0,2}\s*$/im)?.[1]?.replace(/^['"]|['"]$/g, '').trim();
      const title = sermonTitle.trim() || parsedTitle || source[0].attribution.match(/sermon titled\s+["“](.+?)["”]/i)?.[1] || source[0].headline;
      const dateValue = new Date(`${serviceDate}T12:00:00`);
      if (Number.isNaN(dateValue.getTime())) throw new Error('Choose a valid service date before creating graphics.');
      const dateLabel = dateValue.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
      const attribution = `From ${dateLabel} sermon titled "${title}"`;

      const graphics: SocialGraphic[] = [];
      for (const [index, item] of source.entries()) {
        graphics.push(makeSocialGraphic(item.day, item.headline, attribution, designIndex));
        setGraphicsProgress(index + 1);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      setSocialGraphics(graphics);
      setSelectedGraphicDay(graphics[0]?.day ?? null);
      setDesignIndex(current => (current + 1) % GRAPHIC_THEMES.length);
      setIsDraftCollapsed(true);
    } catch (cause) {
      setGraphicError(cause instanceof Error ? cause.message : 'Could not create the social graphics.');
    } finally {
      setIsGeneratingGraphics(false);
    }
  };

  const downloadGraphic = (graphic: SocialGraphic) => {
    const anchor = document.createElement('a');
    anchor.href = graphic.dataUrl;
    anchor.download = `sermon-social-day-${graphic.day}.png`;
    anchor.click();
  };

  const navigatePreview = (direction: -1 | 1) => {
    if (!previewGraphic || socialGraphics.length === 0) return;
    const currentIndex = socialGraphics.findIndex(graphic => graphic.day === previewGraphic.day);
    const nextIndex = (currentIndex + direction + socialGraphics.length) % socialGraphics.length;
    const nextGraphic = socialGraphics[nextIndex];
    if (nextGraphic) {
      setPreviewGraphic(nextGraphic);
      setSelectedGraphicDay(nextGraphic.day);
    }
  };

  const downloadSelectedGraphics = async () => {
    const selected = socialGraphics;
    if (!selected.length) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      selected.forEach(graphic => zip.file(`sermon-social-day-${graphic.day}.png`, graphic.dataUrl.split(',')[1], { base64: true }));
      const archive = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'sermon-social-graphics.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setGraphicError('Could not package the selected images. Try downloading them individually.');
    } finally {
      setIsZipping(false);
    }
  };

  const db = inputDb;

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-6 xl:grid-cols-[minmax(18rem,0.32fr)_minmax(0,1fr)]">
      <aside className="space-y-5 border-b border-gray-700 pb-6 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-red-700/20 text-red-400"><Activity size={21} /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Transcribe</h2>
              <p className="text-xs text-gray-400">Live church event transcript</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowSetup(true)} className="flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-gray-800" title="Audio setup guidance" aria-label="Audio setup guidance"><HelpCircle size={18} /></button>
        </header>

        <div className="space-y-4 border-y border-gray-800 py-5">
          <div className="flex items-center justify-between border border-gray-800 bg-gray-900/70 px-3 py-2.5">
            <span className={`inline-flex items-center gap-2 text-sm font-semibold ${internetStatus === 'online' ? 'text-emerald-300' : internetStatus === 'offline' ? 'text-red-300' : 'text-gray-300'}`}>
              {internetStatus === 'online' ? <Wifi size={16} /> : <WifiOff size={16} />}
              {internetStatus === 'online' ? 'Internet verified' : internetStatus === 'offline' ? 'No internet detected' : 'Internet not checked'}
            </span>
            <button type="button" onClick={() => void checkInternet()} disabled={internetStatus === 'checking'} className="border border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-gray-800 disabled:opacity-40">
              {internetStatus === 'checking' ? 'Checking…' : 'Check internet'}
            </button>
          </div>
          <label className="block space-y-2 text-sm font-semibold text-gray-300">
            Microphone input
            <select value={selectedDeviceId} onChange={event => setSelectedDeviceId(event.target.value)} disabled={isListening} className="w-full border border-gray-700 bg-gray-900 px-3 py-2.5 text-white">
              <option value="">System default microphone</option>
              {devices.map((device, index) => <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}
            </select>
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 font-semibold text-gray-300"><Mic size={15} className={isListening ? 'text-red-400' : 'text-gray-500'} /><span className="truncate">{inputLabel}</span></span>
              <span className={`shrink-0 font-mono ${isListening ? 'text-red-300' : 'text-gray-500'}`}>{isListening ? 'LISTENING' : status.toUpperCase()}</span>
            </div>
            <div className="flex h-3 gap-1" role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(inputLevel * 100)}>
              {Array.from({ length: 24 }, (_, index) => {
                const active = index < Math.round(inputLevel * 24);
                const color = index > 20 ? 'bg-red-500' : index > 16 ? 'bg-amber-400' : 'bg-emerald-500';
                return <span key={index} className={`flex-1 transition-colors duration-75 ${active ? color : 'bg-gray-800'}`} />;
              })}
            </div>
            <div className="flex items-center justify-end text-xs text-gray-400">
              <span className="shrink-0 font-mono">{db} dB</span>
            </div>
          </div>

          <label className="block space-y-2 text-xs text-gray-400">
            <span className="flex items-center justify-between"><span className="flex items-center gap-2"><Volume2 size={14} /> Meter sensitivity</span><span>{meterGain.toFixed(1)}x</span></span>
            <input type="range" min="0.5" max="3" step="0.1" value={meterGain} onChange={event => setMeterGain(Number(event.target.value))} className="w-full accent-red-500" />
            <span className="block text-[11px] text-gray-500">This calibrates the visual meter only. Adjust actual mic gain in Windows Sound settings.</span>
          </label>

          <p className="text-[11px] leading-relaxed text-gray-500">Google Chrome handles live speech recognition. Chrome requires internet access to its speech service.</p>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Social content</h3>
            <button type="button" onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800"><Settings2 size={14} /> AI Settings</button>
          </div>
          <p className="text-xs leading-relaxed text-gray-400">Review the transcript before sending it to GitHub Copilot. The model returns editable ideas; nothing is published automatically.</p>
          <button type="button" onClick={analyzeTranscript} disabled={!transcript.trim() || isAnalyzing || !tokenConfigured} className="flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3 font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
            {isAnalyzing ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
            {isAnalyzing ? 'Analyzing transcript' : tokenConfigured ? 'Analyze & Plan 7 Days' : 'Set Up AI to Analyze'}
          </button>
          {!tokenConfigured && <p className="text-xs text-amber-300">{secureStorageAvailable ? 'Add a GitHub Copilot token in AI Settings to enable analysis.' : 'Secure token storage is unavailable until the desktop app is updated.'}</p>}
          {analysisError && <p role="alert" className="text-xs text-red-300">{analysisError}</p>}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col overflow-hidden border border-gray-700 bg-[#090d13] shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-200"><span className={`h-2 w-2 rounded-full ${isListening ? 'animate-pulse bg-emerald-400' : 'bg-gray-600'}`} /> Live transcript</div>
            <span className="mt-1 block text-xs text-gray-500">{transcript.trim() ? `${transcript.trim().split(/\s+/).length.toLocaleString()} words` : 'Paste a transcript or start speaking'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void toggleMicrophoneTest()} disabled={isListening || isPreparing} title={streamRef.current ? 'Stop microphone test' : 'Test microphone'} aria-label={streamRef.current ? 'Stop microphone test' : 'Test microphone'} className="inline-flex h-9 items-center gap-2 border border-gray-700 px-3 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40">
              <Volume2 size={15} /> <span>{streamRef.current ? 'Stop test' : 'Mic test'}</span>
            </button>
            <button
              type="button"
              onClick={isListening ? stopTranscription : startTranscription}
              disabled={!isListening && (internetStatus !== 'online' || isPreparing)}
              className={`inline-flex h-9 min-w-40 items-center justify-center gap-2 px-4 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed ${isListening ? 'bg-emerald-700 hover:bg-emerald-600' : isPreparing ? 'bg-emerald-900 text-emerald-100' : internetStatus === 'online' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500'}`}
              aria-label={isListening ? 'Stop transcription' : 'Start transcription'}
            >
              {isPreparing ? <Loader2 size={16} className="animate-spin" /> : isListening ? <Square size={14} /> : <Mic size={16} />}
              {isPreparing ? 'Connecting…' : isListening ? 'Stop transcription' : internetStatus === 'online' ? 'Start transcription' : 'Internet required'}
            </button>
            <button type="button" onClick={downloadTranscript} disabled={!transcript} title="Download transcript" aria-label="Download transcript" className="flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-gray-800 disabled:opacity-30"><Download size={15} /></button>
            <button type="button" onClick={() => { setTranscript(''); setInterim(''); setAnalysis(''); setSocialGraphics([]); setSelectedGraphicDay(null); setPreviewGraphic(null); }} disabled={!transcript && !analysis} title="Clear transcript" aria-label="Clear transcript" className="flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-gray-800 disabled:opacity-30"><X size={16} /></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6" aria-label="Transcription output">
          <textarea
            value={transcript}
            onChange={event => setTranscript(event.target.value)}
            placeholder={isListening ? 'Listening for speech…' : 'Paste a transcript here, or start speaking to transcribe live.'}
            className="min-h-[50vh] w-full flex-1 resize-none bg-transparent font-sans text-base leading-8 text-gray-100 outline-none placeholder:text-gray-600 sm:text-lg"
            aria-label="Editable transcript. Paste or type text here."
            spellCheck
          />
          {interim && <p className="mt-3 border-t border-gray-800 pt-3 font-sans text-sm leading-6 text-emerald-300/80" aria-live="polite">{interim}</p>}
          <div ref={transcriptEndRef} />
        </div>

        {analysis && (
          <section className="border-t border-gray-700 bg-gray-900/70">
            <header className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
              <button type="button" onClick={() => setIsDraftCollapsed(value => !value)} aria-expanded={!isDraftCollapsed} className="flex items-center gap-2 text-left font-bold text-white hover:text-gray-300">
                {isDraftCollapsed ? <span aria-hidden="true">+</span> : <span aria-hidden="true">−</span>}
                Draft social plan
              </button>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {copyStatus !== 'idle' && <span role="status" className={`text-xs ${copyStatus === 'copied' ? 'text-emerald-300' : 'text-red-300'}`}>{copyStatus === 'copied' ? 'Plan copied' : 'Could not copy plan'}</span>}
                <button type="button" onClick={() => void makeSocialPosts()} disabled={isGeneratingGraphics} className="inline-flex min-w-44 items-center justify-center gap-2 bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70">
                  {isGeneratingGraphics ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  {isGeneratingGraphics ? `Creating ${graphicsProgress}/7` : socialGraphics.length ? `Regenerate · design ${(designIndex % GRAPHIC_THEMES.length) + 1}/20` : 'Make social media posts'}
                </button>
                <button type="button" onClick={copyAnalysis} className="inline-flex items-center gap-2 border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">{copyStatus === 'copied' ? <Check size={14} /> : copyStatus === 'failed' ? <AlertTriangle size={14} /> : <Copy size={14} />}{copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy plan'}</button>
              </div>
            </header>
            <div className="grid grid-cols-1 gap-3 border-b border-gray-800 bg-gray-950/40 px-4 py-3 sm:grid-cols-[minmax(12rem,0.7fr)_minmax(16rem,1.3fr)]">
              <label className="space-y-1 text-xs font-semibold text-gray-400">
                Service date
                <input type="date" value={serviceDate} onChange={event => setServiceDate(event.target.value)} className="block h-9 w-full border border-gray-700 bg-gray-900 px-2 text-sm text-gray-200" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-gray-400">
                Sermon title <span className="font-normal text-gray-500">(optional; uses plan title if blank)</span>
                <input type="text" value={sermonTitle} onChange={event => setSermonTitle(event.target.value)} placeholder="Use the title from the generated plan" className="block h-9 w-full border border-gray-700 bg-gray-900 px-3 text-sm text-gray-200 placeholder:text-gray-600" />
              </label>
            </div>
            {!isDraftCollapsed && <textarea
              value={analysis}
              onChange={event => { setAnalysis(event.target.value); setSocialGraphics([]); setSelectedGraphicDay(null); setPreviewGraphic(null); }}
              rows={12}
              className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-gray-200 outline-none"
              aria-label="Editable generated social plan"
            />}
            {!isDraftCollapsed && <p className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">Create seven portrait graphics from the daily headlines. Images are generated on this device and are not posted automatically.</p>}
            {isGeneratingGraphics && <div className="h-1 w-full bg-gray-800"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${(graphicsProgress / 7) * 100}%` }} /></div>}
            {graphicError && <p role="alert" className="px-4 pb-3 text-sm text-red-300">{graphicError}</p>}
            {socialGraphics.length > 0 && (
              <section ref={socialGraphicsRef} className="scroll-mt-4 border-t border-gray-700 p-4 sm:p-6" aria-label="Generated social graphics">
                <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white">Social graphic previews</h4>
                    <p className="mt-1 text-xs text-gray-400">Select a preview to download it, or download all seven together.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { const graphic = socialGraphics.find(item => item.day === selectedGraphicDay); if (graphic) downloadGraphic(graphic); }} disabled={!selectedGraphicDay} className="inline-flex items-center gap-2 border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 disabled:opacity-40">
                      <Download size={14} /> Download selected
                    </button>
                    <button type="button" onClick={() => void downloadSelectedGraphics()} disabled={isZipping} className="inline-flex items-center gap-2 bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-600 disabled:opacity-40">
                      {isZipping ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />} {isZipping ? 'Preparing ZIP' : 'Download all'}
                    </button>
                  </div>
                </header>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {socialGraphics.map(graphic => (
                    <button
                      key={graphic.day}
                      type="button"
                      onClick={() => { setSelectedGraphicDay(graphic.day); setPreviewGraphic(graphic); }}
                      aria-pressed={selectedGraphicDay === graphic.day}
                      title={`Preview Day ${graphic.day} graphic at full size`}
                      className={`group relative overflow-hidden border text-left transition-colors ${selectedGraphicDay === graphic.day ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-700 hover:border-gray-500'}`}
                    >
                      <img src={graphic.dataUrl} alt={`Day ${graphic.day}: ${graphic.headline}`} className="aspect-[9/16] w-full bg-[#073b2d] object-cover" />
                      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Eye size={16} /></span>
                      <span className="block truncate bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200">Day {graphic.day} · {graphic.headline}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </section>

      {previewGraphic && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="presentation"
          onMouseDown={event => { if (event.target === event.currentTarget) setPreviewGraphic(null); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="social-graphic-preview-title" className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden border border-gray-700 bg-gray-950 shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
              <div className="min-w-0">
                <h3 id="social-graphic-preview-title" className="truncate font-bold text-white">Day {previewGraphic.day} · {previewGraphic.headline}</h3>
                <p className="mt-1 truncate text-xs text-gray-400">Full-size graphic preview</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => navigatePreview(-1)} aria-label="Previous social graphic" title="Previous (left arrow)" className="flex h-9 w-9 items-center justify-center border border-gray-700 text-gray-200 hover:bg-gray-800"><ChevronLeft size={18} /></button>
                <span className="min-w-12 text-center text-xs tabular-nums text-gray-400">{socialGraphics.findIndex(graphic => graphic.day === previewGraphic.day) + 1} / {socialGraphics.length}</span>
                <button type="button" onClick={() => navigatePreview(1)} aria-label="Next social graphic" title="Next (right arrow)" className="flex h-9 w-9 items-center justify-center border border-gray-700 text-gray-200 hover:bg-gray-800"><ChevronRight size={18} /></button>
                <button type="button" onClick={() => downloadGraphic(previewGraphic)} className="inline-flex h-9 items-center gap-2 bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-600"><Download size={15} /> Download PNG</button>
                <button type="button" onClick={() => setPreviewGraphic(null)} aria-label="Close preview" className="flex h-9 w-9 items-center justify-center text-gray-300 hover:bg-gray-800"><X size={18} /></button>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#090b0e] p-3 sm:p-6">
              <img src={previewGraphic.dataUrl} alt={`Full-size Day ${previewGraphic.day} social graphic: ${previewGraphic.headline}`} className="max-h-[calc(100vh-9rem)] max-w-full object-contain shadow-2xl" />
            </div>
          </section>
        </div>
      )}

      {showInternetGate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="transcribe-internet-title" className="w-full max-w-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-sky-500/15 text-sky-300"><Wifi size={22} /></div>
              <div>
                <h3 id="transcribe-internet-title" className="text-lg font-bold text-white">Internet connection required</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">This page requires an internet connection for live transcription. Connect this PC, then check the connection here to enable the transcript controls.</p>
              </div>
            </div>
            {internetStatus === 'offline' && <p role="alert" className="mt-4 border-l-2 border-red-500 bg-red-500/10 p-3 text-sm text-red-200">Connection check failed. Check Wi-Fi, VPN, firewall, or proxy settings, then retry.</p>}
            {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
            <button type="button" onClick={() => void checkInternet()} disabled={internetStatus === 'checking'} className="mt-6 flex w-full items-center justify-center gap-2 bg-sky-700 px-4 py-3 font-bold text-white hover:bg-sky-600 disabled:opacity-50">
              {internetStatus === 'checking' ? <Loader2 size={17} className="animate-spin" /> : <Wifi size={17} />}
              {internetStatus === 'checking' ? 'Checking this PC…' : 'Check internet connection'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">The app checks general internet access. Google Chrome also needs to reach its separate speech-recognition service.</p>
          </section>
        </div>
      )}

      {showSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowSetup(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="audio-setup-title" className="w-full max-w-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div><h3 id="audio-setup-title" className="text-lg font-bold text-white">Get a clean recording</h3><p className="mt-1 text-sm text-gray-400">A short setup makes recognition noticeably better.</p></div>
              <button type="button" onClick={() => setShowSetup(false)} aria-label="Close guidance" className="p-1 text-gray-400 hover:text-white"><X size={18} /></button>
            </header>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-300">
              <li>Use a dedicated microphone close to the preacher, aimed away from speakers and congregation noise.</li>
              <li>In Windows Sound settings, select that microphone and set its input level so normal speech reaches the green meter without touching red.</li>
              <li>Reduce room noise and avoid placing the mic beside loudspeakers; this app cannot isolate a speaker from a mixed room feed.</li>
              <li>Keep the PC online: Google Chrome sends audio to its speech-recognition service.</li>
            </ol>
            <div className="mt-5 flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Chrome speech recognition requires internet access and may be blocked by firewall, VPN, or proxy settings.</div>
            <button type="button" onClick={() => setShowSetup(false)} className="mt-6 w-full bg-gray-700 px-4 py-3 font-semibold text-white hover:bg-gray-600">Understood</button>
          </section>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowSettings(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" className="w-full max-w-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div><h3 id="ai-settings-title" className="text-lg font-bold text-white">GitHub Copilot</h3><p className="mt-1 text-sm text-gray-400">Token is encrypted by Windows and never stored in browser storage.</p></div>
              <button type="button" onClick={() => setShowSettings(false)} aria-label="Close AI settings" className="p-1 text-gray-400 hover:text-white"><X size={18} /></button>
            </header>
            <label className="mt-5 block space-y-2 text-sm font-semibold text-gray-300">GitHub token with Copilot access
              <input value={token} onChange={event => setToken(event.target.value)} type="password" autoComplete="new-password" placeholder={tokenConfigured ? 'Token saved securely; enter a new one to replace' : 'Paste token here'} className="w-full border border-gray-700 bg-gray-950 px-3 py-3 font-mono text-white placeholder:text-gray-600" />
            </label>
            <div className="mt-5 space-y-3 border-y border-gray-800 py-4">
              <p className="text-sm leading-relaxed text-gray-300">Create a GitHub personal access token with Copilot access, then paste it here. GitHub Copilot selects an available model automatically. Transcript text is sent to Copilot only when you choose to analyze it.</p>
              <button type="button" onClick={() => void window.electronAPI?.openCopilotTokenPage?.()} className="inline-flex items-center gap-2 border border-gray-700 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-gray-800">
                Open GitHub token settings
              </button>
            </div>
            {!secureStorageAvailable && <div className="mt-3 flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" />This installed Electron version does not provide OS-encrypted token storage. Update the app before saving credentials; tokens will not be written in plaintext.</div>}
            {analysisError && <p role="alert" className="mt-3 text-sm text-red-300">{analysisError}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {tokenConfigured && <button type="button" onClick={() => void clearToken()} className="mr-auto border border-red-900 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-950">Remove saved token</button>}
              <button type="button" onClick={() => setShowSettings(false)} className="border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800">Cancel</button>
              <button type="button" onClick={() => void saveToken()} disabled={!token.trim() || !secureStorageAvailable} className="bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-40">Save securely</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
