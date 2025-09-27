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
}

export function ProgramList({ programs, categories, onDelete, onStart, onNotify, onEdit }: ProgramListProps) {
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
                .map(program => (
                  <div key={program.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
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
                        <button
                          onClick={() => saveEdit(program.id, category.id)}
                          className="p-1 text-green-500 hover:text-green-400"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-500 hover:text-red-400"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
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
                            onClick={() => startEdit(program)}
                            className="p-1 text-yellow-500 hover:text-yellow-400"
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
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}