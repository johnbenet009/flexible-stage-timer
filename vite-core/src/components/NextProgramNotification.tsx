import React, { useEffect, useState } from 'react';

interface NextProgramNotificationProps {
  programName: string;
  fullscreen?: boolean;
}

export function NextProgramNotification({ programName, fullscreen = false }: NextProgramNotificationProps) {
  const [scale, setScale] = useState(100);

  useEffect(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    if (savedSizes) {
      const sizes = JSON.parse(savedSizes);
      setScale(sizes.nextProgram);
    }
  }, []);

  const containerClasses = fullscreen
    ? 'fixed top-8 right-8 bg-blue-600 text-white px-8 py-4 rounded-lg shadow-lg animate-[slideIn_0.3s_ease-out,slideOut_0.3s_ease-in_4.7s_forwards] min-w-[400px]'
    : 'absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-[slideIn_0.3s_ease-out,slideOut_0.3s_ease-in_4.7s_forwards]';

  const titleClasses = fullscreen
    ? `text-[${2 * scale/100}rem] font-medium`
    : `text-[${1 * scale/100}rem] font-bold`;

  const nameClasses = fullscreen
    ? `text-[${6 * scale/100}rem] font-bold mt-1`
    : `text-[${8 * scale/100}rem]`;

  const style = {
    transform: `scale(${scale/100})`,
    transformOrigin: fullscreen ? 'top right' : 'top right'
  };

  return (
    <div className={containerClasses} style={style}>
      <div className={titleClasses}>Up Next</div>
      <div className={nameClasses}>{programName}</div>
    </div>
  );
}