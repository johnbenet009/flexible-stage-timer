/// <reference types="vite/client" />

interface Window {
	electronAPI?: {
		clearCache?: () => Promise<void>;
		openAdvancedMultiScreen?: () => void;
		getDisplays?: () => Promise<Array<{ id: number; label: string; isPrimary: boolean; isUsedByMainTimer: boolean; isUsedByOverlay: boolean }>>;
		checkInternetConnection?: () => Promise<{ online: boolean; checkedAt: number; checks?: Array<{ endpoint: string; online: boolean; status?: number; error?: string }> }>;
		startChromeSpeechRecognition?: (request: { language: string; deviceLabel: string }) => Promise<{ selectedDevice: string; customTrack: boolean }>;
		stopChromeSpeechRecognition?: () => Promise<{ ok: boolean }>;
		openCopilotTokenPage?: () => Promise<void>;
		onSpeechRecognitionEvent?: (callback: (event: { type: 'start' | 'end' | 'error' | 'result'; error?: string; finalText?: string; interimText?: string }) => void) => () => void;
		openGreenScreenTimer?: (displayId: number | null) => void;
		closeGreenScreenTimer?: () => void;
		openBibleProjection?: (displayId: number) => void;
		closeBibleProjection?: () => void;
		windowMinimize?: () => void;
		windowToggleMaximize?: () => void;
		windowClose?: () => void;
		windowIsMaximized?: () => Promise<boolean>;
		closeAllDisplays?: () => void;
		openTimerDisplay?: (displayId: number) => void;
		closeTimerDisplay?: () => void;
		testDisplay?: (displayId: number) => void;
		getCopilotTokenStatus?: () => Promise<{ configured: boolean; encryptionAvailable: boolean }>;
		saveCopilotToken?: (token: string) => Promise<{ ok: boolean; error?: string }>;
		clearCopilotToken?: () => Promise<{ ok: boolean }>;
		analyzeChurchTranscript?: (request: { transcript: string }) => Promise<{ text: string }>;
	};
}
