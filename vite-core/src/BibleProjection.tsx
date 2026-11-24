import { useEffect, useState } from 'react';
import type { Verse } from './components/BibleSongsTab';
import { ProjectionSurface } from './components/ProjectionSurface';
import { useProjectionSettings } from './components/projectionSettings';
import { useRemoteState } from './remote/useRemoteState';
import { RemoteCameraVideo } from './remote/RemoteCameraVideo';

interface ProjectionData {
  verses: Verse[];
  theme: string;
  referenceOnly?: boolean;
  description?: string;
}

interface SongProjectionData {
  title: string;
  body: string;
  theme: string;
}

export default function BibleProjection() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [song, setSong] = useState<SongProjectionData | null>(null);
  const [projectionType, setProjectionType] = useState(() => localStorage.getItem('activeProjection') || 'bible');
  const [settings] = useProjectionSettings();
  const remote = useRemoteState();
  const cameraOverride = projectionType === 'songs' ? remote.state.cameraMixer?.overrides.songs : remote.state.cameraMixer?.overrides.bible;
  const cameraOverlay = cameraOverride ? <RemoteCameraVideo conn={remote} enabled className="absolute inset-0 z-[1] h-full w-full object-cover" /> : null;

  useEffect(() => {
    const loadProjection = (stored: string | null) => {
      if (!stored) return;
      try {
        setData(JSON.parse(stored));
      } catch {
        console.error('invalid projection data');
      }
    };
    loadProjection(localStorage.getItem('bibleProjectionData'));
    const loadSong = (stored: string | null) => {
      if (!stored) return;
      try {
        setSong(JSON.parse(stored));
      } catch {
        console.error('invalid song projection data');
      }
    };
    loadSong(localStorage.getItem('songProjectionData'));
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'bibleProjectionData') loadProjection(event.newValue);
      if (event.key === 'songProjectionData') loadSong(event.newValue);
      if (event.key === 'activeProjection' && event.newValue) setProjectionType(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setProjectionType('bible');
        setData(previous => previous ? { ...previous, verses: [], referenceOnly: false, description: '' } : previous);
        const stored = localStorage.getItem('bibleProjectionData');
        if (stored) {
          try {
            const projection = JSON.parse(stored);
            localStorage.setItem('bibleProjectionData', JSON.stringify({ ...projection, verses: [], referenceOnly: false, description: '' }));
          } catch { /* ignore invalid projection data */ }
        }
        return;
      }
      if (projectionType === 'bible' && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        window.electronAPI?.navigateBibleProjection?.(e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      // Forward alphanumeric keys and Backspace to the control window so the
      // quick-lookup modal can be opened/operated while the projection is active.
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if ((e.key.length === 1 && /^[a-z0-9]$/i.test(e.key)) || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          window.electronAPI?.typeBibleProjectionKey?.(e.key);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [projectionType]);

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: settings.bgColor, color: settings.textColor }}>
        <p>Loading Bible...</p>
      </div>
    );
  }

  if (projectionType === 'songs' && song) {
    return <ProjectionSurface settings={settings} songTitle={song.title} songBody={song.body} backgroundOverlay={cameraOverlay} className="fixed inset-0" />;
  }

  if (projectionType === 'bible') {
    return (
      <div className="fixed inset-0">
        {data.description && <div className="absolute left-0 right-0 top-[5%] z-10 text-center text-[3cqh] font-semibold" style={{ color: settings.textColor }}>{data.description}</div>}
        <ProjectionSurface settings={settings} verses={data.verses} referenceOnly={data.referenceOnly} backgroundOverlay={cameraOverlay} className="h-full w-full" />
      </div>
    );
  }

  // Keep the background active when no passage is on screen.
  return <ProjectionSurface settings={settings} backgroundOverlay={cameraOverlay} className="fixed inset-0" />;
}
