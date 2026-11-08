import React, { useLayoutEffect, useRef, useState } from 'react';
import type { Verse } from './BibleSongsTab';
import { FONT_STACKS, type ProjectionSettings } from './projectionSettings';

interface ProjectionSurfaceProps {
  settings: ProjectionSettings;
  verses?: Verse[];
  songTitle?: string;
  songBody?: string;
  blackout?: boolean;
  className?: string;
}

export const ProjectionSurface: React.FC<ProjectionSurfaceProps> = ({
  settings, verses, songTitle, songBody, blackout = false, className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  const isSong = songBody !== undefined;
  const verseList = verses || [];
  const contentKey = isSong
    ? `song:${songTitle}:${songBody}`
    : verseList.map(v => `${v.book_name}${v.chapter}:${v.verse}`).join('|');

  useLayoutEffect(() => {
    setFitScale(1);
  }, [contentKey, settings.fontScale, settings.fontFamily, settings.bold, settings.uppercase, settings.lineSpacing, settings.showVerseNumbers, settings.showReference]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    if (content.scrollHeight > container.clientHeight || content.scrollWidth > container.clientWidth) {
      setFitScale(s => Math.max(0.18, s * 0.92));
    }
  });

  if (blackout) {
    return <div className={`relative overflow-hidden bg-black ${className}`} />;
  }

  const baseVh = isSong ? 7 : Math.max(2.4, 6.4 - verseList.length * 0.35);
  const fontBase = baseVh * (settings.fontScale / 100) * fitScale;
  const justify = settings.position === 'top' ? 'flex-start' : settings.position === 'bottom' ? 'flex-end' : 'center';
  const shadow = settings.textShadow
    ? (settings.bgColor === '#ffffff' || settings.bgImage ? '2px 2px 6px rgba(0,0,0,0.55)' : '2px 2px 8px rgba(0,0,0,0.85)')
    : 'none';

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_STACKS[settings.fontFamily],
    fontWeight: settings.bold ? 700 : 400,
    fontStyle: settings.italic ? 'italic' : 'normal',
    textTransform: settings.uppercase ? 'uppercase' : 'none',
    textAlign: settings.align,
    lineHeight: settings.lineSpacing,
    color: settings.textColor,
    textShadow: shadow,
  };

  const reference = verseList.length > 0
    ? `${verseList[0].book_name} ${verseList[0].chapter}:${verseList.length > 1 ? `${verseList[0].verse}-${verseList[verseList.length - 1].verse}` : verseList[0].verse}`
    : '';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: settings.bgColor, containerType: 'size' }}>
      {settings.bgImage && (
        <>
          <img src={settings.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
        </>
      )}
      <div ref={containerRef} className="absolute inset-0 flex flex-col px-[5%] py-[4%]" style={{ justifyContent: justify }}>
        <div ref={contentRef} className="w-full">
          {isSong ? (
            <>
              {songTitle && settings.showReference && (
                <div style={{ ...textStyle, fontSize: `${fontBase * 0.42}cqh`, opacity: 0.75, fontWeight: 600, marginBottom: '2.5cqh' }}>
                  {songTitle}
                </div>
              )}
              <div className="whitespace-pre-line break-words" style={{ ...textStyle, fontSize: `${fontBase}cqh` }}>
                {songBody}
              </div>
            </>
          ) : (
            <>
              {settings.showReference && reference && (
                <div style={{ ...textStyle, fontSize: `${fontBase * 0.45}cqh`, opacity: 0.8, fontWeight: 600, marginBottom: '2cqh' }}>
                  {reference}
                </div>
              )}
              {verseList.map(v => (
                <p key={`${v.book}-${v.chapter}-${v.verse}`} className="break-words" style={{ ...textStyle, fontSize: `${fontBase}cqh`, margin: '0.6cqh 0' }}>
                  {settings.showVerseNumbers && (
                    <sup style={{ fontSize: '0.45em', opacity: 0.75, marginRight: '0.35em', fontWeight: 700 }}>{v.verse}</sup>
                  )}
                  {v.text}
                </p>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};