import React, { useState } from 'react';
import { Program, Category } from '../types';
import { Trash2, Play, Bell, Edit2, Check, X, ChevronDown, ChevronRight, GripVertical, Square } from 'lucide-react';

interface ProgramListProps {
  programs: Program[];
  categories: Category[];
  onDelete: (id: string) => void;
  onStart: (program: Program) => void;
  onNotify: (program: Program) => void;
  onEdit: (program: Program) => void;
  onReorder: (sourceId: string, targetId: string) => void;
  onReorderCategory: (sourceId: string, targetId: string) => void;
  onStartAutoRun: (categoryId: string) => void;
  onStopAutoRun: () => void;
  autoRunCategoryId?: string;
  currentProgramName?: string;
  isRunning?: boolean;
}

export function ProgramList({ 
  programs, 
  categories, 
  onDelete, 
  onStart, 
  onNotify, 
  onEdit,
  onReorder,
  onReorderCategory,
  onStartAutoRun,
  onStopAutoRun,
  autoRunCategoryId,
  currentProgramName,
  isRunning = false
}: ProgramListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const startEdit = (program: Program) => {
    setEditingId(program.id);
    setEditName(program.name);
    setEditDuration(program.duration);
    setEditNotes(program.notes || '');
  };

  const saveEdit = (id: string, categoryId: string) => {
    onEdit({
      id,
      name: editName,
      duration: editDuration,
      categoryId,
      notes: editNotes.trim() || undefined
    });
    setEditingId(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getProgramCount = (categoryId: string) => {
    return programs.filter(program => program.categoryId === categoryId).length;
  };

  return (
    <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
      {categories.map(category => (
        <div
          key={category.id}
          draggable
          title="Drag category to reorder the run queue"
          onDragStart={event => {
            event.dataTransfer.setData('application/x-stage-timer-category', category.id);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={event => {
            if (event.dataTransfer.types.includes('application/x-stage-timer-category')) event.preventDefault();
          }}
          onDrop={event => {
            const sourceId = event.dataTransfer.getData('application/x-stage-timer-category');
            if (!sourceId) return;
            event.preventDefault();
            onReorderCategory(sourceId, category.id);
          }}
          className="bg-gray-700 rounded overflow-hidden"
        >
          <div className="flex items-center gap-2 p-2">
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex min-w-0 flex-1 items-center justify-between p-2 text-left text-white hover:bg-gray-600"
              title="Expand or collapse category"
            >
              <span className="flex min-w-0 items-center gap-2 font-bold">
                <GripVertical size={16} className="text-gray-400" aria-label="Drag to reorder category" />
                <span className="truncate">{category.name}</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-md font-medium border border-gray-600">
                  {getProgramCount(category.id)} {getProgramCount(category.id) === 1 ? 'program' : 'programs'}
                </span>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => autoRunCategoryId === category.id ? onStopAutoRun() : onStartAutoRun(category.id)}
              disabled={autoRunCategoryId !== category.id && getProgramCount(category.id) === 0}
              className={`flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${autoRunCategoryId === category.id ? 'bg-red-700 hover:bg-red-600' : 'bg-amber-600 hover:bg-amber-500'}`}
              title={autoRunCategoryId === category.id ? `Stop ${category.name} autopilot` : `Start ${category.name} autopilot`}
            >
              {autoRunCategoryId === category.id ? <Square size={13} /> : <Play size={14} />}
              <span>{autoRunCategoryId === category.id ? 'Stop Autopilot' : 'Start Autopilot'}</span>
            </button>
          </div>
          
          {expandedCategories.includes(category.id) && (
            <div className="p-2 space-y-2">
              {programs
                .filter(program => program.categoryId === category.id)
                .map(program => {
                  const isCurrent = program.name === currentProgramName && isRunning;
                  return (
                    <div 
                      key={program.id} 
                      draggable={editingId !== program.id}
                      title="Drag program to reorder the run queue"
                      onDragStart={event => {
                        event.stopPropagation();
                        event.dataTransfer.setData('text/plain', program.id);
                      }}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        onReorder(event.dataTransfer.getData('text/plain'), program.id);
                      }}
                      className={`flex items-center justify-between p-2 rounded transition-all ${
                        isCurrent ? 'bg-green-900/40 border border-green-500/50' : 'bg-gray-800'
                      }`}
                    >
                      {editingId === program.id ? (
                        <div className="flex-1 flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                              placeholder="Program name"
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditDuration(Math.max(0, editDuration - 1))}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-xs"
                              >
                                -1
                              </button>
                              <span className="text-white w-12 text-center text-sm">{editDuration}m</span>
                              <button
                                onClick={() => setEditDuration(editDuration + 1)}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs"
                              >
                                +1
                              </button>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => saveEdit(program.id, program.categoryId)}
                                className="p-1 bg-green-600 text-white rounded hover:bg-green-500"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="bg-gray-700 text-white px-2 py-1 rounded text-xs text-amber-200"
                            placeholder="Cue notes (optional)"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <GripVertical size={16} className="shrink-0 cursor-grab text-gray-500" aria-label="Drag to reorder" />
                                {isCurrent && (
                                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                )}
                                <span className={`text-white font-medium ${isCurrent ? 'text-green-400' : ''}`}>
                                  {program.name}
                                </span>
                                <span className="text-gray-400 text-sm">({program.duration}m)</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Live
                                  </span>
                                )}
                              </div>
                              {program.notes && (
                                <span className="text-xs text-amber-300/80 italic ml-6 truncate max-w-md mt-0.5">
                                  📝 {program.notes}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onStartAutoRun(category.id, program.id)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Start Autopilot from this program (Pilot)"
                            >
                              <Play size={12} /> Pilot
                            </button>
                            <button
                              onClick={() => onStart(program)}
                              className={`p-1 rounded transition-colors ${
                                isCurrent ? 'bg-green-600 text-white' : 'text-green-500 hover:bg-green-600 hover:text-white'
                              }`}
                              title="Start Timer"
                            >
                              <Play size={18} />
                            </button>
                            <button
                              onClick={() => onNotify(program)}
                              className="p-1 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors"
                              title="Notify Next"
                            >
                              <Bell size={18} />
                            </button>
                            <button
                              onClick={() => startEdit(program)}
                              className="p-1 text-yellow-500 hover:bg-yellow-600 hover:text-white rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => onDelete(program.id)}
                              className="p-1 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}