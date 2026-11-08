import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Mic, BookOpen, MonitorPlay, SlidersHorizontal, ArrowLeft, Smartphone, Monitor, ChevronRight, Radio } from 'lucide-react';
import { useRemoteState } from './useRemoteState';
import { ConnectionBadge, PinGate } from './RemoteShell';

type Tab = 'timer' | 'transcribe';
type Mode = 'display' | 'control';

export default function RemoteHome() {
	const conn = useRemoteState();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab | null>(null);
	const [mode, setMode] = useState<Mode | null>(null);

	const go = (view: 'full' | 'mini') => {
		if (!tab || !mode) return;
		navigate(`/remote/${tab}/${mode}${mode === 'control' && view === 'mini' ? '?view=mini' : ''}`);
	};

	return (
		<PinGate conn={conn}>
			<div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-blob" />
					<div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
				</div>
				<div className="relative max-w-2xl mx-auto px-5 py-8 min-h-screen flex flex-col">
					<header className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
								<Radio className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-lg font-bold leading-tight">Stage Timer Remote</h1>
								<p className="text-xs text-slate-400">Control and displays over your local network</p>
							</div>
						</div>
						<ConnectionBadge connected={conn.connected} />
					</header>

					{/* Step 1: choose workspace */}
					<section className="mb-6">
						<div className="flex items-center gap-2 mb-3">
							<span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${tab ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>1</span>
							<h2 className="font-semibold text-slate-200">What do you want to work with?</h2>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<ChoiceCard
								active={tab === 'timer'}
								onClick={() => { setTab('timer'); setMode(null); }}
								icon={<Timer className="w-6 h-6" />}
								title="Timer"
								desc="Stage countdown, programs, autopilot"
								accent="emerald"
							/>
							<ChoiceCard
								active={tab === 'transcribe'}
								onClick={() => { setTab('transcribe'); setMode(null); }}
								icon={<Mic className="w-6 h-6" />}
								title="Transcribe"
								desc="Live speech captions"
								accent="blue"
							/>
							<div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 opacity-50 cursor-not-allowed select-none">
								<BookOpen className="w-6 h-6 text-slate-500 mb-2" />
								<div className="font-semibold text-slate-400">Bible / Songs</div>
								<div className="text-xs text-slate-500 mt-1">Coming later</div>
							</div>
						</div>
					</section>

					{/* Step 2: display or control */}
					{tab && (
						<section className="mb-6 animate-scaleIn">
							<div className="flex items-center gap-2 mb-3">
								<span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${mode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>2</span>
								<h2 className="font-semibold text-slate-200">Alternate display or control?</h2>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<ChoiceCard
									active={mode === 'display'}
									onClick={() => setMode('display')}
									icon={<MonitorPlay className="w-6 h-6" />}
									title="Alternate Screen"
									desc="Live feed with its own background or green screen. Does not change the main display."
									accent="violet"
									big
								/>
								<ChoiceCard
									active={mode === 'control'}
									onClick={() => setMode('control')}
									icon={<SlidersHorizontal className="w-6 h-6" />}
									title="Control Panel"
									desc="Operate the actual program: settings, actions and a mini preview."
									accent="amber"
									big
								/>
							</div>
						</section>
					)}

					{/* Step 3: layout */}
					{tab && mode && (
						<section className="mb-6 animate-scaleIn">
							<div className="flex items-center gap-2 mb-3">
								<span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">3</span>
								<h2 className="font-semibold text-slate-200">{mode === 'control' ? 'Complete or mini layout?' : 'Open the live screen'}</h2>
							</div>
							{mode === 'control' ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<button onClick={() => go('full')} className="group flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 p-4 text-left transition-all">
										<Monitor className="w-7 h-7 text-emerald-400" />
										<div className="flex-1">
											<div className="font-semibold">Complete</div>
											<div className="text-xs text-slate-400">Preview + all controls side by side. Best for tablets and desktops.</div>
										</div>
										<ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
									</button>
									<button onClick={() => go('mini')} className="group flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 p-4 text-left transition-all">
										<Smartphone className="w-7 h-7 text-emerald-400" />
										<div className="flex-1">
											<div className="font-semibold">Mini (mobile)</div>
											<div className="text-xs text-slate-400">Big touch targets, compact tabs. Best for phones.</div>
										</div>
										<ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
									</button>
								</div>
							) : (
								<button onClick={() => go('full')} className="group w-full flex items-center gap-4 rounded-2xl border border-violet-500/50 bg-violet-600/15 hover:bg-violet-600/25 p-5 text-left transition-all">
									<MonitorPlay className="w-8 h-8 text-violet-300" />
									<div className="flex-1">
										<div className="font-semibold text-lg">Open {tab === 'timer' ? 'Timer' : 'Transcribe'} live screen</div>
										<div className="text-xs text-slate-400">Fullscreen-ready. Use the gear icon on the screen to set a green screen or custom background.</div>
									</div>
									<ChevronRight className="w-6 h-6 text-violet-300 group-hover:translate-x-1 transition-transform" />
								</button>
							)}
						</section>
					)}

					{(tab || mode) && (
						<button onClick={() => { if (mode) setMode(null); else setTab(null); }} className="self-start flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
							<ArrowLeft className="w-4 h-4" /> Back
						</button>
					)}

					<footer className="mt-auto pt-8 text-center text-xs text-slate-600">
						Keep this device on the same Wi-Fi network as the main computer.
					</footer>
				</div>
			</div>
		</PinGate>
	);
}

function ChoiceCard({
	active, onClick, icon, title, desc, accent, big,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	title: string;
	desc: string;
	accent: 'emerald' | 'blue' | 'violet' | 'amber';
	big?: boolean;
}) {
	const accents = {
		emerald: { icon: 'text-emerald-400', border: 'border-emerald-500', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10' },
		blue: { icon: 'text-blue-400', border: 'border-blue-500', ring: 'ring-blue-500/30', bg: 'bg-blue-500/10' },
		violet: { icon: 'text-violet-400', border: 'border-violet-500', ring: 'ring-violet-500/30', bg: 'bg-violet-500/10' },
		amber: { icon: 'text-amber-400', border: 'border-amber-500', ring: 'ring-amber-500/30', bg: 'bg-amber-500/10' },
	}[accent];
	return (
		<button
			onClick={onClick}
			className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${big ? 'min-h-[110px]' : ''} ${active ? `${accents.border} ${accents.bg} ring-2 ${accents.ring}` : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
		>
			<div className={`mb-2 ${accents.icon}`}>{icon}</div>
			<div className="font-semibold text-white">{title}</div>
			<div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
		</button>
	);
}