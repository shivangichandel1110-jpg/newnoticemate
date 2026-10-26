import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Calendar,
  AlertTriangle,
  Clock,
  Edit2,
  Check,
  X,
  ListTodo,
  Quote,
  Sparkles,
} from 'lucide-react';
import { ActionItem } from '../types/notice';

interface ActionChecklistProps {
  actionItems: ActionItem[];
  onToggleAction: (id: string) => void;
  onUpdateAction: (id: string, updated: Partial<ActionItem>) => void;
  onSyncGoogleTasks?: (actions: ActionItem[]) => Promise<void>;
  isSyncingTasks?: boolean;
  googleConnected: boolean;
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({
  actionItems,
  onToggleAction,
  onUpdateAction,
  onSyncGoogleTasks,
  isSyncingTasks = false,
  googleConnected,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const completedCount = actionItems.filter((a) => a.completed).length;

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const startEditing = (item: ActionItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate || '');
  };

  const saveEdit = (id: string) => {
    onUpdateAction(id, {
      title: editTitle.trim(),
      dueDate: editDueDate || null,
      isAmbiguousDate: false, // User resolved it
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs">
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#373444] tracking-tight">Your Next Steps</h2>
            <span className="text-xs font-bold px-2 py-0.5 bg-[#E8DFF5] text-[#55437a] rounded-full">
              {completedCount} / {actionItems.length} Done
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6F6B78]">
            Check off steps as you complete them or edit deadlines to fit your schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="inline-flex bg-[#FFF9F2] p-1 rounded-2xl border border-[#EAE4E8]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#373444] shadow-xs'
                  : 'text-[#6F6B78] hover:text-[#373444]'
              }`}
            >
              All ({actionItems.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-[#373444] shadow-xs'
                  : 'text-[#6F6B78] hover:text-[#373444]'
              }`}
            >
              Pending ({actionItems.length - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white text-[#373444] shadow-xs'
                  : 'text-[#6F6B78] hover:text-[#373444]'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Sync to Google Tasks button */}
          {onSyncGoogleTasks && (
            <button
              onClick={() => onSyncGoogleTasks(actionItems.filter((a) => !a.completed))}
              disabled={isSyncingTasks || actionItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DDEBDD] hover:bg-[#cbe0cb] text-[#284928] text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              title={googleConnected ? 'Add tasks to your Google Tasks list' : 'Connect Google to sync tasks'}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>{isSyncingTasks ? 'Syncing...' : 'Sync to Google Tasks'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#FFF9F2] rounded-full h-2.5 mb-6 overflow-hidden border border-[#EAE4E8]">
        <div
          className="bg-[#8273B8] h-2.5 rounded-full transition-all duration-300"
          style={{
            width: `${actionItems.length > 0 ? (completedCount / actionItems.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Action items list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#6F6B78] bg-[#FFF9F2] rounded-2xl border border-dashed border-[#EAE4E8]">
          No action items found under this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.completed
                    ? 'bg-[#FFF9F2]/40 border-[#EAE4E8] opacity-75'
                    : 'bg-[#FFFFFF] border-[#EAE4E8] shadow-xs hover:border-[#8273B8]'
                }`}
              >
                {isEditing ? (
                  /* Edit form */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full p-2 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-sm text-[#373444] focus-visible:ring-2 focus-visible:ring-[#8273B8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#373444] mb-1">
                        Due Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="p-2 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs text-[#373444] focus-visible:ring-2 focus-visible:ring-[#8273B8]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#8273B8] text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#EAE4E8] text-[#6F6B78] rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal display */
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleAction(item.id)}
                      className="mt-0.5 text-[#8273B8] hover:text-[#7061A6] cursor-pointer"
                      aria-label={item.completed ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as completed`}
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 fill-[#8273B8] text-white" />
                      ) : (
                        <Square className="w-5 h-5 stroke-[1.8]" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            item.completed ? 'line-through text-[#6F6B78]' : 'text-[#373444]'
                          }`}
                        >
                          {item.title}
                        </span>

                        {/* Due date badges */}
                        {item.dueDate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8273B8] bg-[#E8DFF5] px-2 py-0.5 rounded-lg">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {item.dueDate}</span>
                          </span>
                        ) : item.rawDueDateText ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F6B78] bg-[#FFF9F2] px-2 py-0.5 rounded-lg border border-[#EAE4E8]">
                            <Clock className="w-3 h-3" />
                            <span>{item.rawDueDateText}</span>
                          </span>
                        ) : null}

                        {/* Ambiguity or Passed flags */}
                        {item.isAmbiguousDate && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7a4918] bg-[#F9E4B7] px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Ambiguous Date: {item.ambiguityReason || 'Verify in notice'}</span>
                          </span>
                        )}

                        {item.hasPassed && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8C2424] bg-[#FCE4E4] px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Deadline Passed</span>
                          </span>
                        )}

                        {item.syncedToGoogleTasks && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2a4d2a] bg-[#DDEBDD] px-2 py-0.5 rounded-lg">
                            <Sparkles className="w-3 h-3" />
                            <span>In Google Tasks</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#6F6B78] mb-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Source quote */}
                      {item.sourceQuote && (
                        <div className="flex items-start gap-1.5 text-xs text-[#524f60] italic bg-[#FFF9F2] p-2 rounded-xl border border-[#EAE4E8] mb-2">
                          <Quote className="w-3 h-3 text-[#8273B8] shrink-0 mt-0.5 opacity-70" />
                          <span>&quot;{item.sourceQuote}&quot;</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => startEditing(item)}
                      className="p-1.5 text-[#6F6B78] hover:text-[#373444] rounded-lg hover:bg-[#FFF9F2] cursor-pointer"
                      title="Edit task or resolve date"
                      aria-label="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
