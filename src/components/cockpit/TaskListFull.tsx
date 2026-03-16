'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskPriority, TaskCategory, PRIORITY_CONFIG, CATEGORY_CONFIG } from '@/types/cockpit';
import AddTaskModal from './AddTaskModal';
import {
  CheckSquare, Plus, ArrowUpDown, Filter, Square,
  Check, Trash2,
} from 'lucide-react';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function TaskListFull() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'title'>('due_date');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modal
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (priorityFilter) params.set('priority', priorityFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    params.set('completed', showCompleted ? 'true' : 'false');
    params.set('sort', sortBy);
    params.set('limit', '200');

    try {
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, categoryFilter, showCompleted, sortBy]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function toggleTask(taskId: string, completed: boolean) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, is_completed: completed }),
    });
    fetchTasks();
  }

  async function bulkComplete() {
    if (selected.size === 0) return;
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    fetchTasks();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selected.size === tasks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tasks.map(t => t.id)));
    }
  }

  const sortLabels = { due_date: 'Scadenza', priority: 'Priorita', title: 'Titolo' };
  function cycleSortBy() {
    const order: typeof sortBy[] = ['due_date', 'priority', 'title'];
    setSortBy(order[(order.indexOf(sortBy) + 1) % order.length]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Gestione <span className="text-[#D4AF37]">Task</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total} task</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-6 py-3 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center gap-2">
          <Plus size={16} /> Nuovo Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-wrap gap-3">
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] bg-white">
          <option value="">Tutte le priorita</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] bg-white">
          <option value="">Tutte le categorie</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        <button onClick={() => setShowCompleted(!showCompleted)}
          className={`flex items-center gap-1.5 border rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            showCompleted ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          <CheckSquare size={14} /> {showCompleted ? 'Completati' : 'Aperti'}
        </button>

        <button onClick={cycleSortBy}
          className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:border-slate-300 transition-colors">
          <ArrowUpDown size={14} /> {sortLabels[sortBy]}
        </button>

        {selected.size > 0 && (
          <button onClick={bulkComplete}
            className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-emerald-600 transition-colors ml-auto">
            <Check size={14} /> Completa {selected.size}
          </button>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <CheckSquare size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-sm">{showCompleted ? 'Nessun task completato' : 'Nessun task aperto'}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={toggleSelectAll} className="w-5 flex-shrink-0">
              {selected.size === tasks.length ? <CheckSquare size={16} className="text-[#D4AF37]" /> : <Square size={16} />}
            </button>
            <span className="w-8">Pri</span>
            <span className="flex-1">Titolo</span>
            <span className="w-20 text-right">Scadenza</span>
            <span className="w-24 text-right">Categoria</span>
          </div>

          <div className="divide-y divide-slate-50">
            {tasks.map(task => {
              const pri = PRIORITY_CONFIG[task.priority];
              const cat = CATEGORY_CONFIG[task.category];
              const days = daysUntil(task.due_date);
              const isOverdue = days !== null && days < 0 && !task.is_completed;
              const isSelected = selected.has(task.id);

              return (
                <div key={task.id}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                    isOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50/50'
                  } ${task.is_completed ? 'opacity-60' : ''}`}>

                  {/* Select checkbox */}
                  <button onClick={() => toggleSelect(task.id)} className="w-5 flex-shrink-0">
                    {isSelected ? <CheckSquare size={16} className="text-[#D4AF37]" /> : <Square size={16} className="text-slate-300" />}
                  </button>

                  {/* Priority */}
                  <span className="text-sm w-8 flex-shrink-0">{pri.emoji}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Complete checkbox */}
                      {!showCompleted && (
                        <button onClick={() => toggleTask(task.id, true)}
                          className="w-4 h-4 rounded border-2 border-slate-300 hover:border-[#D4AF37] flex-shrink-0 transition-colors" />
                      )}
                      <span className={`text-sm ${task.is_completed ? 'line-through text-slate-300' : 'text-slate-800'}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 pl-6">
                      {task.deal?.title && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{task.deal.title}</span>
                      )}
                      {task.contact?.full_name && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{task.contact.full_name}</span>
                      )}
                      {task.tags?.length > 0 && task.tags.map(tag => (
                        <span key={tag} className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Due date */}
                  <span className={`text-[10px] w-20 text-right flex-shrink-0 font-medium ${
                    isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'
                  }`}>
                    {task.due_date ? formatDate(task.due_date) : '—'}
                  </span>

                  {/* Category */}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 w-24 text-right flex-shrink-0">
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddTaskModal open={showModal} onClose={() => setShowModal(false)} onSaved={fetchTasks} />
    </div>
  );
}
