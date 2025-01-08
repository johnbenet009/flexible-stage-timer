import React, { useEffect } from 'react';

interface NextProgramNotificationProps {
  programName: string;
}

export function NextProgramNotification({ programName }: NextProgramNotificationProps) {
  return (
    <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-[slideIn_0.3s_ease-out,slideOut_0.3s_ease-in_4.7s_forwards]">
      <div className="font-bold">Next Program:</div>
      <div>{programName}</div>
    </div>
  );
}