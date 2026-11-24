import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Verse } from './BibleSongsTab';
import { projectionFontStack, type ProjectionSettings } from './projectionSettings';

interface ProjectionSurfaceProps {
  settings: ProjectionSettings;
  verses?: Verse[];
  songTitle?: string;
  songBody?: string;
  blackout?: boolean;
  referenceOnly?: boolean;
  className?: string;
  backgroundOverlay?: React.ReactNode;
}

export const ProjectionSurface: React.FC<ProjectionSurfaceProps> = ({
  settings, verses, songTitle, songBody, blackout = false, referenceOnly = false, className = '', backgroundOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const [fitScale, setFitScale] = useState(1);

  const isSong = songBody !== undefined;
  const verseList = verses || [];
  const contentKey = isSong
    ? `song:${songTitle}:${songBody}`
    : verseList.map(v => `${v.book_name}${v.chapter}:${v.verse}`).join('|');

  useLayoutEffect(() => {
    setFitScale(1);
  }, [contentKey, settings.fontScale, settings.fontFamily, settings.bold, settings.italic, settings.uppercase, settings.lowercase, settings.lineSpacing, settings.showVerseNumbers, settings.showReference, settings.outlineSize, settings.shadowSize, settings.position, settings.referencePosition, settings.referenceFontScale, settings.align]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    if (content.scrollHeight > container.clientHeight || content.scrollWidth > container.clientWidth) {
      setFitScale(s => Math.max(0.18, s * 0.92));
    }
  }, [contentKey, fitScale, settings.fontScale, settings.fontFamily, settings.bold, settings.italic, settings.uppercase, settings.lowercase, settings.lineSpacing, settings.showVerseNumbers, settings.showReference, settings.outlineSize, settings.shadowSize, settings.position, settings.referencePosition, settings.referenceFontScale, settings.align]);

  useEffect(() => {
    if (settings.backgroundType !== 'camera') return;
    let active = true;
    let stream: MediaStream | null = null;
    const videoElement = backgroundVideoRef.current;
    void navigator.mediaDevices?.getUserMedia({
      video: settings.cameraDeviceId ? { deviceId: { exact: settings.cameraDeviceId } } : true,
      audio: false,
    }).then(cameraStream => {
      if (!active) {
        cameraStream.getTracks().forEach(track => track.stop());
        return;
      }
      stream = cameraStream;
      if (videoElement) {
        videoElement.srcObject = cameraStream;
        void videoElement.play().catch(() => undefined);
      }
    }).catch(error => console.error('Could not start projection camera background:', error));

    return () => {
      active = false;
      stream?.getTracks().forEach(track => track.stop());
      if (videoElement) videoElement.srcObject = null;
    };
  }, [settings.backgroundType, settings.cameraDeviceId]);

  if (blackout) {
    return <div className={`relative overflow-hidden bg-black ${className}`} />;
  }

  const baseVh = isSong ? 7 : Math.max(2.4, 6.4 - verseList.length * 0.35);
  const fontBase = baseVh * (settings.fontScale / 100) * fitScale;
  const justify = settings.position === 'top' ? 'flex-start' : settings.position === 'bottom' ? 'flex-end' : 'center';
  const sidePosition = settings.position === 'left' || settings.position === 'right';
  const refFontScale = settings.referenceFontScale ?? 100;
  const shadowRadians = settings.shadowDirection * Math.PI / 180;
  const shadowX = Math.cos(shadowRadians) * settings.shadowSize;
  const shadowY = Math.sin(shadowRadians) * settings.shadowSize;
  const shadow = settings.textShadow
    ? `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${Math.max(1, settings.shadowSize * 0.45).toFixed(1)}px ${settings.shadowColor}`
    : 'none';
  const textStroke = settings.outlineSize > 0 ? `${settings.outlineSize}px ${settings.outlineColor}` : '0 transparent';

  const textStyle: React.CSSProperties = {
    fontFamily: projectionFontStack(settings.fontFamily),
    fontWeight: settings.bold ? 700 : 400,
    fontStyle: settings.italic ? 'italic' : 'normal',
    textTransform: settings.uppercase ? 'uppercase' : settings.lowercase ? 'lowercase' : 'none',
    textAlign: settings.align,
    lineHeight: settings.lineSpacing,
    color: settings.textColor,
    textShadow: shadow,
    WebkitTextStroke: textStroke,
  };

  const reference = verseList.length > 0
    ? `${verseList[0].book_name} ${verseList[0].chapter}:${verseList.length > 1 ? `${verseList[0].verse}-${verseList[verseList.length - 1].verse}` : verseList[0].verse}`
    : '';
  const referenceText = settings.showBookName || verseList.length === 0
    ? reference
    : `${verseList[0].chapter}:${verseList.length > 1 ? `${verseList[0].verse}-${verseList[verseList.length - 1].verse}` : verseList[0].verse}`;
  const referenceIsTop = settings.referencePosition.startsWith('top');
  const referenceIsFull = settings.referencePosition.endsWith('full');
  const referenceIsLeft = settings.referencePosition.endsWith('left');
  const referenceIsRight = settings.referencePosition.endsWith('right');
  const referenceStyle: React.CSSProperties = {
    ...textStyle,
    color: settings.referenceColor || settings.textColor,
    position: 'absolute',
    zIndex: 2,
    top: referenceIsTop ? '3%' : undefined,
    bottom: referenceIsTop ? undefined : '3%',
    left: referenceIsFull || referenceIsLeft ? 0 : referenceIsRight ? undefined : '10%',
    right: referenceIsFull || referenceIsRight ? 0 : referenceIsLeft ? undefined : '10%',
    width: referenceIsFull ? '100%' : referenceIsLeft || referenceIsRight ? '42%' : undefined,
    textAlign: referenceIsLeft ? 'left' : referenceIsRight ? 'right' : 'center',
    fontSize: `${fontBase * (referenceOnly ? 1.25 : 0.45) * (refFontScale / 100)}cqh`,
    opacity: 0.92,
    padding: settings.referenceBackground === 'color' ? '1.2cqh 2.5cqw' : '0 2.5cqw',
    backgroundColor: settings.referenceBackground === 'color' ? settings.referenceBgColor : 'transparent',
  };
  const contentStyle: React.CSSProperties = sidePosition
    ? { width: '58%', marginLeft: settings.position === 'left' ? '0' : 'auto', marginRight: settings.position === 'right' ? '0' : 'auto', textAlign: settings.align }
    : { width: '100%', textAlign: settings.align };

  // Reserve space so the verse block doesn't slide under the reference bar.
  // The reference is absolutely positioned at 3% from top or bottom, with ~8% height for the label.
  const refBarClearance = settings.showReference && reference && !isSong ? '12%' : '4%';
  const paddingTop = !isSong && settings.showReference && reference && referenceIsTop ? refBarClearance : '4%';
  const paddingBottom = !isSong && settings.showReference && reference && !referenceIsTop ? refBarClearance : '4%';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: settings.bgColor, containerType: 'size' }}>
      {settings.backgroundType === 'image' && settings.bgImage && (
        <>
          <img src={settings.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
        </>
      )}
      {settings.backgroundType === 'video' && settings.bgVideo && (
        <>
          <video src={settings.bgVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
        </>
      )}
      {settings.backgroundType === 'camera' && (
        <>
          <video ref={backgroundVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" style={{ transform: `scale(${settings.cameraFlipHorizontal ? -1 : 1}, ${settings.cameraFlipVertical ? -1 : 1})` }} />
          <div className="absolute inset-0 bg-black" style={{ opacity: settings.bgDim / 100 }} />
        </>
      )}
      {backgroundOverlay}
      {settings.showReference && reference && !isSong && (
        <div style={referenceStyle}>
          {settings.referenceBackground === 'color' && <span className="sr-only">Reference background</span>}
          {referenceText}
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 flex flex-col px-[5%]" style={{ paddingTop, paddingBottom, justifyContent: justify, alignItems: sidePosition ? (settings.position === 'left' ? 'flex-start' : 'flex-end') : 'center' }}>
        <div ref={contentRef} style={contentStyle}>
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
              {!referenceOnly && verseList.map(v => (
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