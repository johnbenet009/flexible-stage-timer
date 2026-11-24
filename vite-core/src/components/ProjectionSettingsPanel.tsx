import React, { useEffect, useRef, useState } from 'react';
import { X, Settings2, RotateCcw, Image as ImageIcon, Bold, Italic, Video, Camera, Palette, RefreshCw } from 'lucide-react';
import { DEFAULT_PROJECTION_SETTINGS, type ProjectionSettings } from './projectionSettings';

interface Props {
  settings: ProjectionSettings;
  onChange: (patch: Partial<ProjectionSettings>) => void;
  onClose: () => void;
}

const QUICK_THEMES = [
  { name: 'Dark', bg: '#000000', text: '#ffffff' },
  { name: 'Light', bg: '#ffffff', text: '#000000' },
  { name: 'Blue', bg: '#1e3a8a', text: '#ffffff' },
  { name: 'Warm', bg: '#292524', text: '#fef3c7' },
];

export const ProjectionSettingsPanel: React.FC<Props> = ({ settings, onChange, onClose }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraError, setCameraError] = useState('');
  const [systemFonts, setSystemFonts] = useState<string[]>([]);

  const refreshCameras = async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices() || [];
      setCameras(devices.filter(device => device.kind === 'videoinput'));
      setCameraError('');
    } catch {
      setCameraError('Camera list is unavailable.');
    }
  };

  useEffect(() => {
    void refreshCameras();
    const mediaDevices = navigator.mediaDevices;
    mediaDevices?.addEventListener?.('devicechange', refreshCameras);
    const queryFonts = (window as Window & { queryLocalFonts?: () => Promise<Array<{ family: string }>> }).queryLocalFonts;
    if (queryFonts) {
      void queryFonts.call(window).then(fonts => {
        setSystemFonts([...new Set(fonts.map(font => font.family))].sort((a, b) => a.localeCompare(b)));
      }).catch(() => undefined);
    }
    return () => mediaDevices?.removeEventListener?.('devicechange', refreshCameras);
  }, []);

  const onImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setImgError('Image is too large to store in browser settings (max 2.5 MB).');
      return;
    }
    setImgError('');
    const reader = new FileReader();
    reader.onload = () => onChange({ backgroundType: 'image', bgImage: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const onVideo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setVideoError('Video is too large to store in browser settings (max 2.5 MB).');
      return;
    }
    setVideoError('');
    const reader = new FileReader();
    reader.onload = () => onChange({ backgroundType: 'video', bgVideo: String(reader.result), bgImage: '' });
    reader.readAsDataURL(file);
  };

  const label = 'text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5';
  const selectCls = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500';
  const toggle = (key: keyof ProjectionSettings, text: string) => (
    <button
      onClick={() => onChange({ [key]: !settings[key] } as Partial<ProjectionSettings>)}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${settings[key] ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
    >
      {text}
      <span className={`w-8 h-4.5 rounded-full relative transition-colors ${settings[key] ? 'bg-blue-500' : 'bg-gray-600'}`} style={{ height: 18 }}>
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${settings[key] ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  );

  return (
    <div className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-gray-900/98 backdrop-blur border-l border-gray-700 shadow-2xl z-40 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Settings2 size={15} className="text-blue-400" /> Screen Settings</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => onChange({ ...DEFAULT_PROJECTION_SETTINGS })} title="Reset to defaults" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><RotateCcw size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-300" aria-label="Close settings"><X size={15} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <div>
          <div className={label}>Quick themes</div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_THEMES.map(t => (
              <button
                key={t.name}
                onClick={() => onChange({ backgroundType: 'color', bgColor: t.bg, textColor: t.text, bgImage: '', bgVideo: '' })}
                className={`rounded-lg border-2 py-2 text-[10px] font-bold transition-all ${settings.bgColor === t.bg && settings.textColor === t.text && !settings.bgImage ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-gray-600 hover:border-gray-400'}`}
                style={{ backgroundColor: t.bg, color: t.text }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className={label}>Font</div>
          <select value={settings.fontFamily} onChange={e => onChange({ fontFamily: e.target.value as ProjectionSettings['fontFamily'] })} className={selectCls}>
            <option value="sans">Sans serif (Arial)</option>
            <option value="serif">Serif (Georgia)</option>
            <option value="mono">Monospace (Courier)</option>
            {systemFonts.filter(font => !['Arial', 'Georgia', 'Courier New'].includes(font)).map(font => <option key={font} value={font}>{font}</option>)}
          </select>
          <div className="flex gap-1.5 mt-2">
            <button onClick={() => onChange({ bold: !settings.bold })} title="Bold" className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${settings.bold ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><Bold size={14} /></button>
            <button onClick={() => onChange({ italic: !settings.italic })} title="Italic" className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${settings.italic ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><Italic size={14} /></button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-gray-700 bg-gray-950 p-1" aria-label="Text case">
            <button type="button" onClick={() => onChange({ uppercase: false, lowercase: false })} aria-pressed={!settings.uppercase && !settings.lowercase} className={`rounded py-1.5 text-xs font-semibold ${!settings.uppercase && !settings.lowercase ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>Aa</button>
            <button type="button" onClick={() => onChange({ uppercase: true, lowercase: false })} aria-pressed={settings.uppercase} title="Uppercase" className={`rounded py-1.5 text-xs font-semibold ${settings.uppercase ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>AA</button>
            <button type="button" onClick={() => onChange({ uppercase: false, lowercase: true })} aria-pressed={settings.lowercase} title="Lowercase" className={`rounded py-1.5 text-xs font-semibold ${settings.lowercase ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>aa</button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className={label.replace(' mb-1.5', '')}>Text size</span>
            <span className="text-xs font-bold text-blue-300 tabular-nums">{settings.fontScale}%</span>
          </div>
          <input type="range" min={50} max={160} step={5} value={settings.fontScale} onChange={e => onChange({ fontScale: Number(e.target.value) })} className="w-full accent-blue-500" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className={label.replace(' mb-1.5', '')}>Line spacing</span>
            <span className="text-xs font-bold text-blue-300 tabular-nums">{settings.lineSpacing.toFixed(2)}</span>
          </div>
          <input type="range" min={1} max={2} step={0.05} value={settings.lineSpacing} onChange={e => onChange({ lineSpacing: Number(e.target.value) })} className="w-full accent-blue-500" />
        </div>

        <div className="space-y-3 border-t border-gray-800 pt-4">
          <div className={label}>Text outline</div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label className="text-xs text-gray-300">Outline size <span className="ml-1 text-blue-300">{settings.outlineSize}px</span>
              <input aria-label="Text outline size" type="range" min="0" max="8" step="0.5" value={settings.outlineSize} onChange={event => onChange({ outlineSize: Number(event.target.value) })} className="mt-2 w-full accent-blue-500" />
            </label>
            <label className="text-xs text-gray-300">Color<input aria-label="Text outline color" type="color" value={settings.outlineColor} onChange={event => onChange({ outlineColor: event.target.value })} className="mt-1 block h-9 w-10 cursor-pointer border border-gray-600 bg-transparent" /></label>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-800 pt-4">
          <div className={label}>Text shadow</div>
          {toggle('textShadow', 'Enable shadow')}
          {settings.textShadow && <>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <label className="text-xs text-gray-300">Shadow size <span className="ml-1 text-blue-300">{settings.shadowSize}px</span>
                <input aria-label="Text shadow size" type="range" min="0" max="32" step="1" value={settings.shadowSize} onChange={event => onChange({ shadowSize: Number(event.target.value) })} className="mt-2 w-full accent-blue-500" />
              </label>
              <label className="text-xs text-gray-300">Color<input aria-label="Text shadow color" type="color" value={settings.shadowColor} onChange={event => onChange({ shadowColor: event.target.value })} className="mt-1 block h-9 w-10 cursor-pointer border border-gray-600 bg-transparent" /></label>
            </div>
            <label className="block text-xs text-gray-300">Direction <span className="ml-1 text-blue-300">{settings.shadowDirection}°</span>
              <input aria-label="Text shadow direction" type="range" min="0" max="360" step="15" value={settings.shadowDirection} onChange={event => onChange({ shadowDirection: Number(event.target.value) })} className="mt-2 w-full accent-blue-500" />
            </label>
          </>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={label}>Text color</div>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.textColor} onChange={e => onChange({ textColor: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-[10px] font-mono text-gray-400">{settings.textColor}</span>
            </div>
          </div>
          <div>
            <div className={label}>Background</div>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.bgColor} onChange={e => onChange({ bgColor: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-[10px] font-mono text-gray-400">{settings.bgColor}</span>
            </div>
          </div>
        </div>

        <div>
          <div className={label}>Projection background</div>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              ['color', Palette, 'Color'],
              ['image', ImageIcon, 'Image'],
              ['video', Video, 'Video'],
              ['camera', Camera, 'Camera'],
            ] as const).map(([type, Icon, title]) => (
              <button key={type} type="button" onClick={() => {
                onChange({ backgroundType: type });
                if (type === 'image' && !settings.bgImage) fileRef.current?.click();
                if (type === 'video' && !settings.bgVideo) videoRef.current?.click();
              }} aria-pressed={settings.backgroundType === type} title={title} className={`flex min-h-9 items-center justify-center gap-1 rounded border text-[10px] font-semibold ${settings.backgroundType === type ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'}`}><Icon size={13} />{title}</button>
            ))}
          </div>
        </div>

        {settings.backgroundType === 'color' && <p className="-mt-3 text-[11px] text-gray-500">Choose a background color above.</p>}

        {settings.backgroundType === 'image' && <div>
          <div className={label}>Background image</div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onImage(e.target.files?.[0])} />
          {settings.bgImage ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-gray-600">
                <img src={settings.bgImage} alt="Background" className="w-full h-20 object-cover" />
                <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex-1 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-white font-semibold">Replace</button>
                <button onClick={() => onChange({ bgImage: '', backgroundType: 'color' })} className="flex-1 py-1.5 rounded-lg bg-gray-700 hover:bg-red-900 text-xs text-red-300 font-semibold">Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-500 hover:border-blue-400 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition-colors">
              <ImageIcon size={14} /> Upload image
            </button>
          )}
          {imgError && <p className="text-[11px] text-red-400 mt-1">{imgError}</p>}
        </div>}

        {settings.backgroundType === 'video' && <div>
          <div className={label}>Background video</div>
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={event => onVideo(event.target.files?.[0])} />
          {settings.bgVideo ? <div className="space-y-2">
            <video src={settings.bgVideo} muted loop autoPlay playsInline className="h-24 w-full border border-gray-700 object-cover" />
            <div className="flex gap-2">
              <button type="button" onClick={() => videoRef.current?.click()} className="flex-1 rounded bg-gray-700 py-1.5 text-xs font-semibold text-white hover:bg-gray-600">Replace</button>
              <button type="button" onClick={() => onChange({ bgVideo: '', backgroundType: 'color' })} className="flex-1 rounded bg-gray-700 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900">Remove</button>
            </div>
          </div> : <button type="button" onClick={() => videoRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-gray-500 py-2.5 text-xs font-semibold text-gray-300 hover:border-blue-400 hover:bg-gray-800"><Video size={14} /> Upload video (MP4/WebM)</button>}
          {videoError && <p className="mt-1 text-[11px] text-red-400">{videoError}</p>}
        </div>}

        {settings.backgroundType === 'camera' && <div>
          <div className={label}>Live camera background</div>
          <select value={settings.cameraDeviceId} onChange={event => onChange({ cameraDeviceId: event.target.value })} className={selectCls}>
            <option value="">Default camera</option>
            {cameras.map((camera, index) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Camera ${index + 1}`}</option>)}
          </select>
          <button type="button" onClick={() => void refreshCameras()} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded border border-gray-700 bg-gray-800 px-3 text-xs font-semibold text-gray-200 hover:bg-gray-700"><RefreshCw size={13} /> Refresh cameras</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([['cameraFlipHorizontal', 'Flip left / right'], ['cameraFlipVertical', 'Flip up / down']] as const).map(([key, text]) => <button key={key} type="button" aria-pressed={settings[key]} onClick={() => onChange({ [key]: !settings[key] })} className={`min-h-9 rounded border px-2 text-xs font-semibold ${settings[key] ? 'border-blue-500 bg-blue-600/20 text-blue-200' : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{text}</button>)}
          </div>
          {cameraError && <p className="mt-1 text-[11px] text-red-400">{cameraError}</p>}
          <p className="mt-1 text-[11px] text-gray-500">Camera permission may be requested when the projection opens.</p>
        </div>}

        {settings.backgroundType !== 'color' && <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400"><span>Background dimming</span><span>{settings.bgDim}%</span></div>
          <input type="range" min={0} max={90} value={settings.bgDim} onChange={event => onChange({ bgDim: Number(event.target.value) })} className="w-full accent-blue-500" />
        </div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={label}>Verse position</div>
            <select value={settings.position} onChange={e => onChange({ position: e.target.value as ProjectionSettings['position'] })} className={selectCls}>
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left side</option>
              <option value="right">Right side</option>
            </select>
          </div>
          <div>
            <div className={label}>Alignment</div>
            <select value={settings.align} onChange={e => onChange({ align: e.target.value as ProjectionSettings['align'] })} className={selectCls}>
              <option value="center">Centered</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="justify">Justified</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-800 pt-4">
          <div className={label}>Book / reference position</div>
          <select aria-label="Book reference position" value={settings.referencePosition} onChange={event => onChange({ referencePosition: event.target.value as ProjectionSettings['referencePosition'] })} className={selectCls}>
            <option value="top-full">Top, full width</option>
            <option value="top-center">Top, centered</option>
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-full">Bottom, full width</option>
            <option value="bottom-center">Bottom, centered</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
          </select>
          <div className="flex justify-between items-center mb-1.5 mt-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Reference font size</span>
            <span className="text-xs font-bold text-blue-300 tabular-nums">{settings.referenceFontScale ?? 100}%</span>
          </div>
          <input type="range" min={40} max={200} step={5} value={settings.referenceFontScale ?? 100} onChange={e => onChange({ referenceFontScale: Number(e.target.value) })} className="w-full accent-blue-500" aria-label="Reference font size" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Reference color
              <input aria-label="Reference text color" type="color" value={settings.referenceColor ?? settings.textColor} onChange={event => onChange({ referenceColor: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer border border-gray-600 bg-transparent" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ref. background
              <select aria-label="Reference background mode" value={settings.referenceBackground} onChange={event => onChange({ referenceBackground: event.target.value as ProjectionSettings['referenceBackground'] })} className={`${selectCls} mt-1`}>
                <option value="none">Transparent</option><option value="color">Solid color</option>
              </select>
            </label>
          </div>
          {settings.referenceBackground === 'color' && <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Background color
            <input aria-label="Reference background color" type="color" value={settings.referenceBgColor} onChange={event => onChange({ referenceBgColor: event.target.value })} className="mt-1 block h-9 w-full cursor-pointer border border-gray-600 bg-transparent" />
          </label>}
        </div>

        <div className="space-y-2">
          <div className={label}>Display options</div>
          {toggle('showVerseNumbers', 'Verse numbers')}
          {toggle('showBookName', 'Book name')}
          {toggle('showReference', 'Reference / title')}
        </div>
      </div>
    </div>
  );
};