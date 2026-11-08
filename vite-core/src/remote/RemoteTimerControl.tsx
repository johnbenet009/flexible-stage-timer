import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
	Play, Pause, Square, RotateCcw, Bell, SkipForward, Home, Plus, Minus,
	Zap, ZapOff, ListOrdered, SlidersHorizontal, Megaphone, Clock, TimerReset,
} from 'lucide-react';
import { useRemoteState, type RemoteConnection } from './useRemoteState';
import { PinGate, ConnectionBadge } from './RemoteShell';
import { TimerFeed } from './RemoteTimerDisplay';

export default function RemoteTimerControl() {
	const conn = useRemoteState();
	const [params] = useSearchParams();
	const mini = params.get('view') === 'mini';
	const [tab, setTab] = useState<'controls' | 'programs' | 'alerts'>('controls');

	useEffect(() => {
		if (mini) window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}, [mini, tab]);

	return (
		<PinGate conn={conn}>
			<div className="min-h-screen bg-slate-950 text-white">
				<header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
					<Link to="/remote" className="p-2 rounded-lg hover:bg-slate-800 text-slate-300" title="Remote home"><Home className="w-4 h-4" /></Link>
					<h1 className="font-bold flex-1">Timer Control {mini && <span className="text-xs font-medium text-slate-500">· mini</span>}</h1>
					<ConnectionBadge connected={conn.connected} />
				</header>

				{mini ? (
					<div className="pb-20">
						<div className="relative h-36 bg-black mx-3 mt-3 rounded-xl overflow-hidden border border-slate-800">
							<TimerFeed conn={conn} compact />
						</div>
						{tab === 'controls' && <div className="p-3 space-y-4"><Transport conn={conn} big /><TimeAdjust conn={conn} /><AutopilotPanel conn={conn} /></div>}
						{tab === 'programs' && <div className="p-3"><ProgramList conn={conn} /></div>}
						{tab === 'alerts' && <div className="p-3 space-y-4"><AlertPanel conn={conn} /><ClockPanel conn={conn} /></div>}
						<nav className="fixed bottom-0 inset-x-0 z-20 bg-slate-900 border-t border-slate-700 grid grid-cols-3">
							{([['controls', SlidersHorizontal, 'Controls'], ['programs', ListOrdered, 'Programs'], ['alerts', Megaphone, 'Alerts']] as const).map(([key, Icon, label]) => (
								<button key={key} onClick={() => setTab(key)} className={`py-3 flex flex-col items-center gap-1 text-xs font-medium ${tab === key ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'}`}>
									<Icon className="w-5 h-5" /> {label}
								</button>
							))}
						</nav>
					</div>
				) : (
					<div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="space-y-4">
							<div className="relative h-64 bg-black rounded-2xl overflow-hidden border border-slate-800">
								<TimerFeed conn={conn} compact />
								<span className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold z-10">Live preview</span>
							</div>
							<Panel title="Transport"><Transport conn={conn} big /></Panel>
							<Panel title="Adjust time"><TimeAdjust conn={conn} /></Panel>
						</div>
						<div className="space-y-4">
							<Panel title="Autopilot"><AutopilotPanel conn={conn} /></Panel>
							<Panel title="Programs"><ProgramList conn={conn} /></Panel>
							<Panel title="Alerts & clock"><div className="space-y-4"><AlertPanel conn={conn} /><ClockPanel conn={conn} /></div></Panel>
						</div>
					</div>
				)}
			</div>
		</PinGate>
	);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
			<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h2>
			{children}
		</section>
	);
}

function Transport({ conn, big = false }: { conn: RemoteConnection; big?: boolean }) {
	const t = conn.state.timer;
	const auto = conn.state.auto;
	const extra = conn.state.extraTime;
	const cmd = (action: string, payload?: Record<string, unknown>) => conn.sendCommand('timer', action, payload);
	const running = !!t?.isRunning && !t?.isPaused;
	const canSkip = !!auto?.enabled && (running || !!extra?.isRunning || !!auto?.transition);
	const btn = `flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95 ${big ? 'py-4 text-base' : 'py-3 text-sm'}`;
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				{running ? (
					<button onClick={() => cmd('pause')} className={`${btn} bg-amber-600 hover:bg-amber-500 text-white`}><Pause className="w-5 h-5" /> Pause</button>
				) : t?.isPaused ? (
					<button onClick={() => cmd('resume')} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}><Play className="w-5 h-5" /> Resume</button>
				) : (
					<button onClick={() => cmd('start')} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}><Play className="w-5 h-5" /> Start</button>
				)}
				<button onClick={() => cmd('stop')} className={`${btn} bg-slate-700 hover:bg-slate-600 text-white`}><Square className="w-5 h-5" /> Stop / Reset</button>
				<button onClick={() => cmd('restart')} className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}><RotateCcw className="w-5 h-5" /> Restart</button>
				<button onClick={() => cmd('attention')} className={`${btn} ${t?.isAttention ? 'bg-yellow-500 text-black' : 'bg-slate-700 hover:bg-slate-600 text-yellow-300'}`}><Bell className="w-5 h-5" /> Attention</button>
			</div>
			<button
				onClick={() => cmd('nextProgram')}
				disabled={!canSkip}
				className={`${btn} w-full ${canSkip ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
			>
				<SkipForward className="w-5 h-5" /> NEXT PROG
			</button>
			<div className="grid grid-cols-2 gap-2">
				{extra?.isRunning ? (
					<button onClick={() => cmd('extraStop')} className={`${btn} bg-red-600 hover:bg-red-500 text-white`}><TimerReset className="w-4 h-4" /> Stop extra time</button>
				) : (
					<button onClick={() => cmd('extraStart')} className={`${btn} bg-slate-700 hover:bg-red-700 text-red-300 hover:text-white`}><TimerReset className="w-4 h-4" /> Extra time</button>
				)}
				<div className={`${btn} bg-slate-800 text-slate-300 cursor-default truncate px-2`} title={t?.programName || ''}>
					{t?.programName || 'No program loaded'}
				</div>
			</div>
		</div>
	);
}

function TimeAdjust({ conn }: { conn: RemoteConnection }) {
	const cmd = (action: string, value: number) => conn.sendCommand('timer', action, { value });
	return (
		<div className="grid grid-cols-2 gap-3">
			<Stepper label="Minutes" onDelta={(d) => cmd('addMinutes', d)} steps={[-5, -1, 1, 5]} />
			<Stepper label="Seconds" onDelta={(d) => cmd('addSeconds', d)} steps={[-30, -10, 10, 30]} />
		</div>
	);
}

function Stepper({ label, onDelta, steps }: { label: string; onDelta: (d: number) => void; steps: number[] }) {
	return (
		<div>
			<div className="text-xs text-slate-400 font-medium mb-1.5">{label}</div>
			<div className="grid grid-cols-4 gap-1.5">
				{steps.map((s) => (
					<button
						key={s}
						onClick={() => onDelta(s)}
						className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 ${s > 0 ? 'bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100' : 'bg-red-900/50 hover:bg-red-800 text-red-200'}`}
					>
						{s > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}{Math.abs(s)}
					</button>
				))}
			</div>
		</div>
	);
}

function AutopilotPanel({ conn }: { conn: RemoteConnection }) {
	const auto = conn.state.auto;
	const programs = conn.state.programs || [];
	const categories = conn.state.categories || [];
	const [categoryId, setCategoryId] = useState('');
	const cooldown = auto?.cooldownSec ?? 30;
	const effectiveCategory = categoryId || auto?.categoryId || categories[0]?.id || '';
	const catPrograms = programs.filter((p) => p.categoryId === effectiveCategory);
	const currentProgram = auto?.enabled && auto.queueIds[auto.index] ? programs.find((p) => p.id === auto.queueIds[auto.index]) : null;
	const nextId = auto?.enabled ? auto.queueIds[auto.index + 1] : undefined;
	const nextProgram = nextId ? programs.find((p) => p.id === nextId) : null;

	return (
		<div className="space-y-3">
			{auto?.enabled ? (
				<div className="rounded-xl bg-amber-500/10 border border-amber-500/40 p-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold text-amber-300 flex items-center gap-1.5"><Zap className="w-4 h-4" /> Autopilot running</span>
						<button onClick={() => conn.sendCommand('timer', 'autoStop')} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1"><ZapOff className="w-3.5 h-3.5" /> Stop</button>
					</div>
					<div className="text-xs text-amber-200/80 mt-2">
						Program {auto.index + 1} of {auto.queueIds.length}{currentProgram ? ` · ${currentProgram.name}` : ''}
						{nextProgram && <span className="block mt-0.5 text-slate-400">Next: {nextProgram.name}</span>}
						{!nextProgram && <span className="block mt-0.5 text-slate-400">Last program in queue</span>}
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<select
						value={effectiveCategory}
						onChange={(e) => setCategoryId(e.target.value)}
						className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
					>
						{categories.length === 0 && <option value="">No categories yet</option>}
						{categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({programs.filter((p) => p.categoryId === c.id).length})</option>)}
					</select>
					<button
						onClick={() => effectiveCategory && conn.sendCommand('timer', 'autoStart', { categoryId: effectiveCategory, programId: catPrograms[0]?.id })}
						disabled={!effectiveCategory || catPrograms.length === 0}
						className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
					>
						<Zap className="w-5 h-5" /> Start Autopilot
					</button>
				</div>
			)}
			<div className="flex items-center justify-between rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2">
				<span className="text-xs font-medium text-slate-300">Cooldown between programs</span>
				<div className="flex items-center gap-2">
					<button onClick={() => conn.sendCommand('timer', 'setCooldown', { value: Math.max(3, cooldown - 5) })} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white" aria-label="Decrease cooldown"><Minus className="w-4 h-4" /></button>
					<span className="w-12 text-center font-bold tabular-nums text-amber-300">{cooldown}s</span>
					<button onClick={() => conn.sendCommand('timer', 'setCooldown', { value: Math.min(300, cooldown + 5) })} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white" aria-label="Increase cooldown"><Plus className="w-4 h-4" /></button>
				</div>
			</div>
		</div>
	);
}

function ProgramList({ conn }: { conn: RemoteConnection }) {
	const programs = conn.state.programs || [];
	const categories = conn.state.categories || [];
	const auto = conn.state.auto;
	const [filter, setFilter] = useState('');
	const filtered = useMemo(
		() => programs.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase())),
		[programs, filter]
	);
	const grouped = categories
		.map((c) => ({ category: c, items: filtered.filter((p) => p.categoryId === c.id) }))
		.filter((g) => g.items.length > 0);
	const ungrouped = filtered.filter((p) => !categories.some((c) => c.id === p.categoryId));
	if (programs.length === 0) return <p className="text-sm text-slate-500">No programs on the main computer yet. Add them in the Timer tab.</p>;

	const fmt = (min: number) => `${min} min`;
	const row = (p: { id: string; name: string; duration: number }) => {
		const isCurrent = auto?.enabled && auto.queueIds[auto.index] === p.id;
		const inQueue = auto?.enabled && auto.queueIds.includes(p.id);
		return (
			<div key={p.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isCurrent ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-800 bg-slate-800/40'}`}>
				<div className="flex-1 min-w-0">
					<div className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-300' : 'text-white'}`}>{p.name}</div>
					<div className="text-xs text-slate-500 tabular-nums">{fmt(p.duration)}{inQueue && !isCurrent ? ' · queued' : ''}{isCurrent ? ' · playing' : ''}</div>
				</div>
				<button onClick={() => conn.sendCommand('timer', 'startProgram', { id: p.id })} className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white" title="Load and start"><Play className="w-4 h-4" /></button>
				{!auto?.enabled && (
					<button onClick={() => conn.sendCommand('timer', 'autoStart', { categoryId: p.categoryId, programId: p.id })} className="p-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white" title="Autopilot from here"><Zap className="w-4 h-4" /></button>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-3">
			<input
				type="search"
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				placeholder="Search programs…"
				className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
			/>
			<div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-1">
				{grouped.map((g) => (
					<div key={g.category.id}>
						<div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{g.category.name}</div>
						<div className="space-y-1.5">{g.items.map(row)}</div>
					</div>
				))}
				{ungrouped.length > 0 && <div className="space-y-1.5">{ungrouped.map(row)}</div>}
				{filtered.length === 0 && <p className="text-sm text-slate-500">No programs match “{filter}”.</p>}
			</div>
		</div>
	);
}

function AlertPanel({ conn }: { conn: RemoteConnection }) {
	const [message, setMessage] = useState('');
	const alert = conn.state.alert;
	const send = (mode: 'show' | 'flash' | 'clear') => conn.sendCommand('timer', 'alert', { mode, message: message.trim() });
	return (
		<div className="space-y-2">
			{alert?.show || alert?.flashing ? (
				<div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 truncate">
					On screen: {alert.message} {alert.flashing && '(flashing)'}
				</div>
			) : null}
			<input
				type="text"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) send('show'); }}
				placeholder="Message for the stage screen…"
				className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
			/>
			<div className="grid grid-cols-3 gap-2">
				<button onClick={() => send('show')} disabled={!message.trim()} className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold">Show</button>
				<button onClick={() => send('flash')} disabled={!message.trim()} className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold animate-none">Flash</button>
				<button onClick={() => { send('clear'); setMessage(''); }} className="py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold">Clear</button>
			</div>
		</div>
	);
}

function ClockPanel({ conn }: { conn: RemoteConnection }) {
	const show = !!conn.state.clock?.show;
	return (
		<button
			onClick={() => conn.sendCommand('timer', 'clock', { show: !show })}
			className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${show ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
		>
			<Clock className="w-4 h-4" /> {show ? 'Hide system clock on displays' : 'Show system clock on displays'}
		</button>
	);
}