import React, { useRef, useState } from 'react';
import { X, Settings2, RotateCcw, Image as ImageIcon, Bold, Italic, CaseSensitive } from 'lucide-react';
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
  const [imgError, setImgError] = useState('');

  const onImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      setImgError('Image is too large (max 3.5 MB).');
      return;
    }
    setImgError('');
    const reader = new FileReader();
    reader.onload = () => onChange({ bgImage: String(reader.result) });
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
                onClick={() => onChange({ bgColor: t.bg, textColor: t.text, bgImage: '' })}
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
          </select>
          <div className="flex gap-1.5 mt-2">
            <button onClick={() => onChange({ bold: !settings.bold })} title="Bold" className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${settings.bold ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><Bold size={14} /></button>
            <button onClick={() => onChange({ italic: !settings.italic })} title="Italic" className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${settings.italic ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><Italic size={14} /></button>
            <button onClick={() => onChange({ uppercase: !settings.uppercase })} title="Uppercase" className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${settings.uppercase ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><CaseSensitive size={16} /></button>
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
          <div className={label}>Background image</div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onImage(e.target.files?.[0])} />
          {settings.bgImage ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-gray-600">
                <img src={settings.bgImage} alt="Background" className="w-full h-20 object-cover" />
                <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400"><span>Dimming</span><span>{settings.bgDim}%</span></div>
              <input type="range" min={0} max={90} value={settings.bgDim} onChange={e => onChange({ bgDim: Number(e.target.value) })} className="w-full accent-blue-500" />
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex-1 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-white font-semibold">Replace</button>
                <button onClick={() => onChange({ bgImage: '' })} className="flex-1 py-1.5 rounded-lg bg-gray-700 hover:bg-red-900 text-xs text-red-300 font-semibold">Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-500 hover:border-blue-400 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition-colors">
              <ImageIcon size={14} /> Upload image
            </button>
          )}
          {imgError && <p className="text-[11px] text-red-400 mt-1">{imgError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={label}>Position</div>
            <select value={settings.position} onChange={e => onChange({ position: e.target.value as ProjectionSettings['position'] })} className={selectCls}>
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
          <div>
            <div className={label}>Alignment</div>
            <select value={settings.align} onChange={e => onChange({ align: e.target.value as ProjectionSettings['align'] })} className={selectCls}>
              <option value="center">Centered</option>
              <option value="left">Left</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className={label}>Display options</div>
          {toggle('showVerseNumbers', 'Verse numbers')}
          {toggle('showReference', 'Reference / title')}
          {toggle('textShadow', 'Text shadow')}
        </div>
      </div>
    </div>
  );
};