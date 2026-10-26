import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  CheckSquare,
  Trash2,
  ExternalLink,
  Download,
  Building,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { NoticeAnalysis } from '../types/notice';

interface NoticeHistoryViewProps {
  savedNotices: NoticeAnalysis[];
  onOpenNotice: (notice: NoticeAnalysis) => void;
  onDeleteNotice: (id: string) => void;
  onClearAll: () => void;
}

export const NoticeHistoryView: React.FC<NoticeHistoryViewProps> = ({
  savedNotices,
  onOpenNotice,
  onDeleteNotice,
  onClearAll,
}) => {
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const handleExportJson = (notice: NoticeAnalysis) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${notice.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notice.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#373444] tracking-tight">
                My Saved Notices
              </h1>
              <p className="text-xs sm:text-sm text-[#6F6B78]">
                Your processed circulars, extracted facts, and action plans stored locally in this browser.
              </p>
            </div>
          </div>
        </div>

        {savedNotices.length > 0 && (
          <button
            onClick={() => setShowClearAllModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#8C2424] hover:bg-[#FCE4E4] border border-[#f5c2c2] rounded-xl cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Info notice about local storage */}
      <div className="p-4 bg-[#FFF9F2] rounded-2xl border border-[#EAE4E8] text-xs text-[#6F6B78] flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#8273B8] shrink-0 mt-0.5" />
        <span>
          <strong>Privacy First:</strong> Your analyzed notices and action items are saved locally in your browser storage. They are never sold, shared, or retained on external servers.
        </span>
      </div>

      {/* Notices List */}
      {savedNotices.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-[#8273B8] mx-auto mb-3 opacity-40" />
          <h2 className="text-base font-bold text-[#373444] mb-1">No notices saved yet</h2>
          <p className="text-xs text-[#6F6B78] max-w-sm mx-auto mb-5">
            When you process an official notice on the Home page, its extracted facts and action checklist are saved here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedNotices.map((notice) => {
            const completedCount = (notice.actionItems || []).filter((a) => a.completed).length;
            const totalActions = (notice.actionItems || []).length;
            const calendarCount = (notice.calendarEvents || []).length;

            return (
              <div
                key={notice.id}
                className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-5 sm:p-6 shadow-xs hover:border-[#8273B8] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-[#E8DFF5] text-[#55437a] text-xs font-bold rounded-lg">
                      {notice.category || 'Official Notice'}
                    </span>
                    <span className="text-xs text-[#6F6B78] bg-[#FFF9F2] px-2 py-0.5 rounded-lg border border-[#EAE4E8]">
                      Processed {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#373444] mb-1">
                    {notice.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#6F6B78] mb-3">
                    <Building className="w-3.5 h-3.5 text-[#8273B8]" />
                    <span>{notice.issuingOrganization}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6F6B78] line-clamp-2 mb-4 leading-relaxed">
                    {notice.summaryEnglish}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 bg-[#DDEBDD] text-[#284928] px-2.5 py-1 rounded-xl font-semibold">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{completedCount}/{totalActions} Tasks Done</span>
                    </span>

                    <span className="flex items-center gap-1 bg-[#DCEAF7] text-[#2c5378] px-2.5 py-1 rounded-xl font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{calendarCount} Calendar Deadlines</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-[#EAE4E8] w-full md:w-auto justify-end">
                  <button
                    onClick={() => onOpenNotice(notice)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <span>View Notice</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExportJson(notice)}
                    className="p-2 text-[#6F6B78] hover:text-[#373444] bg-[#FFF9F2] hover:bg-[#f0e4d7] rounded-xl border border-[#EAE4E8] cursor-pointer"
                    title="Export notice as JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setNoticeToDelete(notice.id)}
                    className="p-2 text-[#6F6B78] hover:text-red-600 bg-[#FFF9F2] hover:bg-[#FCE4E4] rounded-xl border border-[#EAE4E8] cursor-pointer"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Notice Modal */}
      {noticeToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EAE4E8] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#373444]">
              Delete Saved Notice?
            </h3>
            <p className="text-xs text-[#6F6B78]">
              This will remove this notice and its checklist from your local browser storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNoticeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4E8] text-xs font-semibold text-[#6F6B78] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteNotice(noticeToDelete);
                  setNoticeToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EAE4E8] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#373444]">
              Clear All Saved Notices?
            </h3>
            <p className="text-xs text-[#6F6B78]">
              This will delete all saved notices and action items from this browser. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE4E8] text-xs font-semibold text-[#6F6B78] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearAllModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
