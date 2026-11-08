import React, { useEffect, useRef, useState } from 'react';
import { useRemoteState } from './useRemoteState';
import { PinGate, BackgroundLayer, DisplayChrome, useRemoteBackground } from './RemoteShell';

function useNow(intervalMs = 200) {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

export default function RemoteTimerDisplay() {
	const conn = useRemoteState();
	const [bg, setBg] = useRemoteBackground('remoteBg.timer');
	const [showCooldownInfo, setShowCooldownInfo] = useState(() => localStorage.getItem('remoteTimer.showCooldownInfo') !== 'false');

	useEffect(() => {
		localStorage.setItem('remoteTimer.showCooldownInfo', String(showCooldownInfo));
	}, [showCooldownInfo]);

	return (
		<PinGate conn={conn}>
			<div className="fixed inset-0 overflow-hidden select-none">
				<BackgroundLayer bg={bg} />
				<TimerFeed conn={conn} showCooldownInfo={showCooldownInfo} />
				<DisplayChrome
					connected={conn.connected}
					bg={bg}
					setBg={setBg}
					bgKey="remoteBg.timer"
					showTimerCooldownInfo={showCooldownInfo}
					setShowTimerCooldownInfo={setShowCooldownInfo}
				/>
			</div>
		</PinGate>
	);
}

export function TimerFeed({ conn, compact = false, showCooldownInfo = true }: { conn: ReturnType<typeof useRemoteState>; compact?: boolean; showCooldownInfo?: boolean }) {
	const { state, serverOffset } = conn;
	const now = useNow();
	const serverNow = now + serverOffset;
	const timer = state.timer;
	const auto = state.auto;
	const extra = state.extraTime;
	const alert = state.alert;
	const transition = auto?.enabled ? auto.transition : null;
	const showCooldown = !!transition && serverNow < transition.deadline + 900;

	const prevTransition = useRef(transition);
	const lastNameRef = useRef('');
	if (transition?.programName) lastNameRef.current = transition.programName;
	const [handoffUntil, setHandoffUntil] = useState<number | null>(null);
	useEffect(() => {
		if (prevTransition.current && !transition) {
			setHandoffUntil(Date.now() + 850);
			const id = setTimeout(() => setHandoffUntil(null), 900);
			prevTransition.current = transition;
			return () => clearTimeout(id);
		}
		prevTransition.current = transition;
	}, [transition]);

	const minutes = timer?.minutes ?? 0;
	const seconds = timer?.seconds ?? 0;
	const total = minutes * 60 + seconds;
	const running = !!timer?.isRunning && !timer?.isPaused;
	const color = !running ? '#ffffff' : total <= 60 && total > 0 ? '#ef4444' : total <= 120 ? '#eab308' : '#84cc16';
	const criticalFlash = running && total <= 60 && total > 0;
	const warnPulse = running && total <= 120 && total > 60;

	const cooldownSec = transition ? Math.max(0, Math.ceil((transition.deadline - serverNow) / 1000)) : 0;
	const handoff = handoffUntil !== null && now < handoffUntil;

	const digitSize = compact ? 'min(18vw, 22vh)' : 'min(25vw, 50vh)';

	return (
		<div className="absolute inset-0">
			{(showCooldown || handoff) ? (
				<div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white overflow-hidden ${compact ? 'px-3 py-2' : showCooldownInfo ? 'px-6 pb-20 pt-10' : 'px-4'} ${handoff && !showCooldown ? 'animate-handoff-out' : 'animate-handoff-in'}`}>
					{showCooldownInfo ? <div className="w-full max-w-[94vw] animate-next-program-enter">
						<p className={`font-black uppercase tracking-[0.25em] text-amber-300 ${compact ? 'text-[10px]' : 'text-sm sm:text-xl'}`}>Next Program</p>
						<h1 className={`break-words font-black leading-[0.95] text-white ${compact ? 'mt-1' : 'mt-4'}`} style={{ fontSize: compact ? 'clamp(1.1rem, 6vw, 2rem)' : 'clamp(3rem, 12vw, 11rem)', textShadow: '3px 3px 8px rgba(0,0,0,0.8)' }}>
							{transition?.programName || lastNameRef.current}
						</h1>
						<p className={`font-semibold text-white/80 ${compact ? 'mt-1 text-[10px]' : 'mt-4 text-lg sm:text-3xl'}`}>{cooldownSec <= 0 ? 'Starting now' : 'Starts in'}</p>
						<p className="mt-0.5 font-black tabular-nums text-amber-300" style={{ fontSize: compact ? 'clamp(1.2rem, 6vw, 2.2rem)' : 'clamp(2.5rem, 7vw, 6rem)', textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
							{cooldownSec} <span className={compact ? 'text-xs font-bold text-white/60' : 'text-xl font-bold text-white/60 sm:text-3xl'}>seconds</span>
						</p>
					</div> : <p className="font-black tabular-nums text-white animate-next-program-enter" style={{ fontSize: 'min(28vw, 34vh)', lineHeight: 1, textShadow: '3px 3px 8px rgba(0,0,0,0.8)' }}>
						{String(Math.floor(cooldownSec / 60)).padStart(2, '0')}:{String(cooldownSec % 60).padStart(2, '0')}
					</p>}
				</div>
			) : extra?.isRunning ? (
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<div className={`font-black text-red-400 ${compact ? 'text-[10px] tracking-widest' : 'text-xl sm:text-3xl tracking-[0.3em]'} uppercase mb-2 animate-pulse`} style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
						Extra time
					</div>
					<div className="font-bold tabular-nums text-red-500 animate-flash-zoom" style={{ fontSize: digitSize, textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
						+{String(extra.minutes).padStart(2, '0')}:{String(extra.seconds).padStart(2, '0')}
					</div>
					{timer?.programName && (
						<div className={`mt-3 font-bold text-white/80 ${compact ? 'text-xs' : 'text-2xl'}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{timer.programName}</div>
					)}
				</div>
			) : (
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					{timer?.programName && (
						<div className={`absolute left-0 right-0 text-center font-bold text-white/85 pointer-events-none px-4 ${compact ? 'top-2 text-xs' : 'top-[6vh] text-[3vw]'}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
							Now: {timer.programName}
						</div>
					)}
					<div
						className={`font-bold tabular-nums transition-colors duration-500 ${warnPulse ? 'animate-pulse' : ''} ${timer?.isAttention ? 'animate-attentionPulse' : ''} ${timer?.isComplete ? 'scale-110' : ''}`}
						style={{ fontSize: digitSize, color, whiteSpace: 'nowrap', textShadow: '2px 2px 6px rgba(0,0,0,0.85)' }}
					>
						{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
					</div>
					{criticalFlash && <div className="absolute inset-0 pointer-events-none animate-lastMinute" />}
					{timer?.isPaused && (
						<div className={`absolute font-bold uppercase tracking-[0.3em] text-white/60 ${compact ? 'bottom-2 text-[10px]' : 'bottom-[8vh] text-xl'}`}>Paused</div>
					)}
					{state.clock?.show && state.clock.time && (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/90">
							<span className="font-bold text-white" style={{ fontSize: 'min(18vw, 30vh)', whiteSpace: 'nowrap', letterSpacing: '0.05em', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
								{state.clock.time}
							</span>
						</div>
					)}
				</div>
			)}

			{(alert?.show || alert?.flashing) && alert.message && (
				<div className="absolute bottom-0 left-0 right-0 z-30">
					<div className={`w-full text-center font-bold text-white px-4 ${compact ? 'py-1.5 text-xs' : 'py-4 text-[3vw]'} ${alert.flashing ? 'animate-pulse bg-red-600' : 'bg-red-600/90'}`} style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
						{alert.message}
					</div>
				</div>
			)}
		</div>
	);
}