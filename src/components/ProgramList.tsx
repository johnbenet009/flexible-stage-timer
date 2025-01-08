import React from 'react';
import { Program } from '../types';
import { Edit2, Trash2, Play, Bell } from 'lucide-react';

interface ProgramListProps {
  programs: Program[];
  onDelete: (id: string) => void;
  onEdit: (program: Program) => void;
  onStart: (program: Program) => void;
  onNotify: (program: Program) => void;
}

export function ProgramList({ programs, onDelete, onEdit, onStart, onNotify }: ProgramListProps) {
  return (
    <div className="max-h-[400px] overflow-y-auto space-y-2">
      {programs.map((program) => (
        <div key={program.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
          <div className="text-white">
            <span className="font-bold">{program.name}</span>
            <span className="ml-2 text-gray-400">({program.duration}m)</span>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => onStart(program)}
              className="p-1 text-green-500 hover:text-green-400"
            >
              <Play size={18} />
            </button>
            <button
              onClick={() => onNotify(program)}
              className="p-1 text-blue-500 hover:text-blue-400"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => onEdit(program)}
              className="p-1 text-blue-500 hover:text-blue-400"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDelete(program.id)}
              className="p-1 text-red-500 hover:text-red-400"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}