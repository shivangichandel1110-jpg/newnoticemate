import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ListTodo,
  FileText,
  Search,
} from 'lucide-react';
import { NoticeAnalysis, ActionItem } from '../types/notice';

interface ActionItemsViewProps {
  notices: NoticeAnalysis[];
  onToggleAction: (noticeId: string, actionId: string) => void;
  onSyncAllTasks: (actions: ActionItem[]) => Promise<void>;
  isSyncingTasks: boolean;
  googleConnected: boolean;
}

export const ActionItemsView: React.FC<ActionItemsViewProps> = ({
  notices,
  onToggleAction,
  onSyncAllTasks,
  isSyncingTasks,
  googleConnected,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all action items paired with their parent notice title and id
  const allActions: Array<ActionItem & { noticeTitle: string; noticeId: string }> = [];
  notices.forEach((n) => {
    (n.actionItems || []).forEach((a) => {
      allActions.push({
        ...a,
        noticeTitle: n.title,
        noticeId: n.id,
      });
    });
  });

  const now = new Date().toISOString().split('T')[0];

  const filtered = allActions.filter((item) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotice = item.noticeTitle.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotice && !matchDesc) return false;
    }

    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    if (filter === 'overdue') {
      return !item.completed && item.dueDate && item.dueDate < now;
    }
    return true;
  });

  const pendingCount = allActions.filter((a) => !a.completed).length;
  const overdueCount = allActions.filter((a) => !a.completed && a.dueDate && a.dueDate < now).length;
  const completedCount = allActions.filter((a) => a.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#373444] tracking-tight">
                Consolidated Action Plan
              </h1>
              <p className="text-xs sm:text-sm text-[#6F6B78]">
                Every action item, deadline, and checklist extracted across all your notices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSyncAllTasks(allActions.filter((a) => !a.completed))}
            disabled={isSyncingTasks || pendingCount === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs font-bold rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
            title={googleConnected ? 'Sync pending tasks to Google Tasks' : 'Connect Google to sync'}
          >
            <ListTodo className="w-4 h-4" />
            <span>{isSyncingTasks ? 'Syncing...' : 'Sync Pending to Google Tasks'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#6F6B78] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions or notices..."
              className="w-full pl-9 pr-4 py-2 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs sm:text-sm text-[#373444] focus-visible:ring-2 focus-visible:ring-[#8273B8]"
            />
          </div>

          <div className="inline-flex bg-[#FFF9F2] p-1 rounded-2xl border border-[#EAE4E8] self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'all' ? 'bg-white text-[#373444] shadow-xs' : 'text-[#6F6B78]'
              }`}
            >
              All ({allActions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'pending' ? 'bg-white text-[#373444] shadow-xs' : 'text-[#6F6B78]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            {overdueCount > 0 && (
              <button
                onClick={() => setFilter('overdue')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                  filter === 'overdue' ? 'bg-[#FCE4E4] text-[#8C2424] shadow-xs' : 'text-[#8C2424]'
                }`}
              >
                Overdue ({overdueCount})
              </button>
            )}
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                filter === 'completed' ? 'bg-white text-[#373444] shadow-xs' : 'text-[#6F6B78]'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-[#FFF9F2] rounded-2xl border border-dashed border-[#EAE4E8]">
            <CheckSquare className="w-8 h-8 text-[#8273B8] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#373444]">No tasks match this filter.</p>
            <p className="text-xs text-[#6F6B78]">Upload or process a notice to extract your actionable next steps.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {filtered.map((item) => (
              <div
                key={`${item.noticeId}-${item.id}`}
                className={`p-4 rounded-2xl border transition-all ${
                  item.completed
                    ? 'bg-[#FFF9F2]/40 border-[#EAE4E8] opacity-70'
                    : 'bg-[#FFFFFF] border-[#EAE4E8] hover:border-[#8273B8] shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleAction(item.noticeId, item.id)}
                    className="mt-0.5 text-[#8273B8] hover:text-[#7061A6] cursor-pointer"
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark completed'}
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

                      {item.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8273B8] bg-[#E8DFF5] px-2 py-0.5 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {item.dueDate}</span>
                        </span>
                      )}

                      {item.dueDate && item.dueDate < now && !item.completed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8C2424] bg-[#FCE4E4] px-2 py-0.5 rounded-lg">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue</span>
                        </span>
                      )}

                      {item.syncedToGoogleTasks && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2b4c2b] bg-[#DDEBDD] px-2 py-0.5 rounded-lg">
                          <Sparkles className="w-3 h-3" />
                          <span>Google Tasks</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#6F6B78] mb-2">{item.description}</p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-[#6F6B78] pt-2 border-t border-[#EAE4E8]">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#373444]">
                        <FileText className="w-3.5 h-3.5 text-[#8273B8]" />
                        <span className="truncate max-w-xs">{item.noticeTitle}</span>
                      </span>

                      {item.sourceQuote && (
                        <span className="text-[11px] italic text-[#6F6B78] truncate max-w-sm hidden sm:inline">
                          &quot;{item.sourceQuote}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
