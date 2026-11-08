import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Mic, BookOpen, MonitorPlay, SlidersHorizontal, ArrowLeft, Smartphone, Monitor, ChevronRight, Radio } from 'lucide-react';
import { useRemoteState } from './useRemoteState';
import { ConnectionBadge, PinGate } from './RemoteShell';

type Tab = 'timer' | 'transcribe';
type Mode = 'display' | 'control';
type Step = 1 | 2 | 3;

export default function RemoteHome() {
	const conn = useRemoteState();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab | null>(null);
	const [mode, setMode] = useState<Mode | null>(null);
	const [step, setStep] = useState<Step>(1);

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}, [step]);

	// Function to navigate to different views
	const go = (view: 'full' | 'mini') => {
		if (!tab || !mode) return;
		navigate(`/remote/${tab}/${mode}${mode === 'control' && view === 'mini' ? '?view=mini' : ''}`);
	};

	const goBack = () => {
		if (step === 3) setStep(2);
		else if (step === 2) { setMode(null); setStep(1); }
	};

	return (
		<PinGate conn={conn}>
			<div className="min-h-screen bg-slate-950 text-white relative overflow-x-hidden">
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-blob" />
					<div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
				</div>
				<div className="relative max-w-2xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-8 min-h-screen flex flex-col">
					<header className="flex items-center gap-3 mb-5 sm:mb-8">
						{step > 1 && (
							<button type="button" onClick={goBack} className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Go to previous selection">
								<ArrowLeft className="w-4 h-4" /> Back
							</button>
						)}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
								<Radio className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-sm sm:text-lg font-bold leading-tight">Stage Timer Remote</h1>
								<p className="hidden sm:block text-xs text-slate-400">Control and displays over your local network</p>
							</div>
						</div>
						<ConnectionBadge connected={conn.connected} className="ml-auto shrink-0" />
					</header>

					<div className="mb-6" aria-label={`Step ${step} of 3`}>
						<div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
							<span>Step {step} of 3</span>
							<span>{step === 1 ? 'Choose a tool' : step === 2 ? `Choose ${tab === 'timer' ? 'Timer' : 'Transcribe'} mode` : 'Choose a layout'}</span>
						</div>
						<div className="mt-2 grid grid-cols-3 gap-2" aria-hidden="true">
							{[1, 2, 3].map(index => <span key={index} className={`h-1 rounded-full ${index <= step ? 'bg-emerald-400' : 'bg-slate-800'}`} />)}
						</div>
					</div>

					<main className="flex-1">
					{step === 1 && <section className="animate-scaleIn">
						<h2 className="mb-1 text-xl font-bold text-white">What do you want to open?</h2>
						<p className="mb-4 text-sm text-slate-400">Choose a tool to continue.</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<ChoiceCard
								active={false}
								onClick={() => { setTab('timer'); setMode(null); setStep(2); }}
								icon={<Timer className="w-6 h-6" />}
								title="Timer"
								desc="Stage countdown, programs, autopilot"
								accent="emerald"
							/>
							<ChoiceCard
								active={false}
								onClick={() => { setTab('transcribe'); setMode(null); setStep(2); }}
								icon={<Mic className="w-6 h-6" />}
								title="Transcribe"
								desc="Live speech captions"
								accent="blue"
							/>
							<div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 opacity-60 select-none">
								<BookOpen className="w-6 h-6 text-slate-500 mb-2" />
								<div className="font-semibold text-slate-400">Bible / Lyrics</div>
								<div className="text-xs text-slate-500 mt-1">In development</div>
							</div>
						</div>
					</section>}

					{step === 2 && tab && (
						<section className="animate-scaleIn">
							<h2 className="mb-1 text-xl font-bold text-white">How do you want to use {tab === 'timer' ? 'Timer' : 'Transcribe'}?</h2>
							<p className="mb-4 text-sm text-slate-400">Choose a control panel or a separate live screen.</p>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<ChoiceCard
									active={false}
									onClick={() => { setMode('display'); setStep(3); }}
									icon={<MonitorPlay className="w-6 h-6" />}
									title="Live Screen"
									desc="Show the live timer or captions on a separate screen."
									accent="violet"
									big
								/>
								<ChoiceCard
									active={false}
									onClick={() => { setMode('control'); setStep(3); }}
									icon={<SlidersHorizontal className="w-6 h-6" />}
									title="Control Panel"
									desc="Operate the timer or transcription from this device."
									accent="amber"
									big
								/>
							</div>
						</section>
					)}

					{step === 3 && tab && mode && (
						<section className="animate-scaleIn">
							<h2 className="mb-1 text-xl font-bold text-white">{mode === 'control' ? 'Choose a control layout' : 'Open the live screen'}</h2>
							<p className="mb-4 text-sm text-slate-400">{tab === 'timer' ? 'Timer' : 'Transcribe'} · {mode === 'control' ? 'Control panel' : 'Live screen'}</p>
							{mode === 'control' ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<button onClick={() => go('full')} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 p-4 text-left transition-all">
										<Monitor className="w-7 h-7 text-emerald-400" />
										<div className="flex-1">
											<div className="font-semibold">Complete</div>
											<div className="text-xs text-slate-400">Preview + all controls side by side. Best for tablets and desktops.</div>
										</div>
										<ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
									</button>
									<button onClick={() => go('mini')} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 p-4 text-left transition-all">
										<Smartphone className="w-7 h-7 text-emerald-400" />
										<div className="flex-1">
											<div className="font-semibold">Mini (mobile)</div>
											<div className="text-xs text-slate-400">Big touch targets, compact tabs. Best for phones.</div>
										</div>
										<ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
									</button>
								</div>
							) : (
								<button onClick={() => go('full')} className="group w-full flex min-h-24 items-center gap-4 rounded-2xl border border-violet-500/50 bg-violet-600/15 hover:bg-violet-600/25 p-4 text-left transition-all">
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

					</main>

					<footer className="mt-auto pt-6 text-center text-xs text-slate-600">
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
			<div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-xs font-bold text-slate-300">
				<span>Choose {title}</span>
				<ChevronRight className="h-4 w-4" aria-hidden="true" />
			</div>
		</button>
	);
}