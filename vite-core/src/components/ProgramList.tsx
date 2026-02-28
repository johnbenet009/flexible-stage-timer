import React, { useState } from 'react';
import { Program, Category } from '../types';
import { Trash2, Play, Bell, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';

interface ProgramListProps {
  programs: Program[];
  categories: Category[];
  onDelete: (id: string) => void;
  onStart: (program: Program) => void;
  onNotify: (program: Program) => void;
  onEdit: (program: Program) => void;
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
  currentProgramName,
  isRunning = false
}: ProgramListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const startEdit = (program: Program) => {
    setEditingId(program.id);
    setEditName(program.name);
    setEditDuration(program.duration);
  };

  const saveEdit = (id: string, categoryId: string) => {
    onEdit({
      id,
      name: editName,
      duration: editDuration,
      categoryId
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
        <div key={category.id} className="bg-gray-700 rounded overflow-hidden">
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between p-3 text-white hover:bg-gray-600"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold">{category.name}</span>
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
            </div>
          </button>
          
          {expandedCategories.includes(category.id) && (
            <div className="p-2 space-y-2">
              {programs
                .filter(program => program.categoryId === category.id)
                .map(program => {
                  const isCurrent = program.name === currentProgramName && isRunning;
                  return (
                    <div 
                      key={program.id} 
                      className={`flex items-center justify-between p-2 rounded transition-all ${
                        isCurrent ? 'bg-green-900/40 border border-green-500/50' : 'bg-gray-800'
                      }`}
                    >
                      {editingId === program.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-gray-700 text-white px-2 py-1 rounded"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditDuration(Math.max(0, editDuration - 1))}
                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500"
                            >
                              -1
                            </button>
                            <span className="text-white w-12 text-center">{editDuration}m</span>
                            <button
                              onClick={() => setEditDuration(editDuration + 1)}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500"
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
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
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
                          </div>
                          <div className="flex items-center space-x-2">
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