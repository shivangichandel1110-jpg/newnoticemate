import React, { useState } from 'react';
import {
  Quote,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  GraduationCap,
  CreditCard,
  UserCheck,
  FileText,
  Filter,
} from 'lucide-react';
import { ExtractedFact } from '../types/notice';

interface FactListProps {
  facts: ExtractedFact[];
}

export const FactList: React.FC<FactListProps> = ({ facts }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Facts', count: facts.length },
    { id: 'deadline', label: 'Deadlines', count: facts.filter((f) => f.category === 'deadline').length },
    { id: 'exam', label: 'Exams', count: facts.filter((f) => f.category === 'exam').length },
    { id: 'fee', label: 'Fees', count: facts.filter((f) => f.category === 'fee').length },
    { id: 'eligibility', label: 'Eligibility', count: facts.filter((f) => f.category === 'eligibility').length },
    { id: 'document', label: 'Documents', count: facts.filter((f) => f.category === 'document').length },
  ];

  const filteredFacts =
    selectedCategory === 'all'
      ? facts
      : facts.filter((f) => f.category.toLowerCase().includes(selectedCategory));

  const handleCopyQuote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'deadline':
        return <Calendar className="w-3.5 h-3.5 text-[#8273B8]" />;
      case 'exam':
        return <GraduationCap className="w-3.5 h-3.5 text-[#3b6d92]" />;
      case 'fee':
        return <CreditCard className="w-3.5 h-3.5 text-[#2c532c]" />;
      case 'eligibility':
        return <UserCheck className="w-3.5 h-3.5 text-[#7a492d]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[#55437a]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'deadline':
        return 'bg-[#E8DFF5] text-[#55437a] border-[#d9cbe8]';
      case 'exam':
        return 'bg-[#DCEAF7] text-[#2c5378] border-[#c0d9f0]';
      case 'fee':
        return 'bg-[#DDEBDD] text-[#2a4d2a] border-[#c4dec4]';
      case 'eligibility':
        return 'bg-[#F8E2D5] text-[#78462c] border-[#ebd0bf]';
      default:
        return 'bg-[#FFF9F2] text-[#373444] border-[#EAE4E8]';
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#373444] tracking-tight">
            Verified Facts &amp; Evidence
          </h2>
          <p className="text-xs sm:text-sm text-[#6F6B78]">
            Every extracted fact is linked directly to verbatim quotations from the original notice.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FFF9F2] p-1.5 rounded-2xl border border-[#EAE4E8]">
          <Filter className="w-3.5 h-3.5 text-[#8273B8] ml-1 mr-0.5 shrink-0" />
          {categories
            .filter((c) => c.id === 'all' || c.count > 0)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                    : 'text-[#6F6B78] hover:text-[#373444]'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
        </div>
      </div>

      {filteredFacts.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#6F6B78] bg-[#FFF9F2] rounded-2xl border border-dashed border-[#EAE4E8]">
          No facts found under this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className="p-4 rounded-2xl border border-[#EAE4E8] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg border uppercase tracking-wider ${getCategoryBadgeClass(
                      fact.category
                    )}`}
                  >
                    {getCategoryIcon(fact.category)}
                    <span>{fact.category}</span>
                  </span>

                  {fact.status === 'confirmed' ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#2d522d] bg-[#DDEBDD]/80 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      <span>Confirmed Fact</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#845214] bg-[#F9E4B7] px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      <span>Verify Source</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-[#373444] mb-3 leading-snug">
                  {fact.fact}
                </p>

                {/* Source evidence quote */}
                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#EAE4E8] relative mb-2">
                  <div className="flex items-start gap-2">
                    <Quote className="w-4 h-4 text-[#8273B8] shrink-0 mt-0.5 opacity-60" />
                    <p className="text-xs text-[#555263] italic font-serif leading-relaxed">
                      &quot;{fact.sourceQuote}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6F6B78] pt-2 border-t border-[#EAE4E8]">
                <span>{fact.pageOrLocation || 'Original Document Text'}</span>
                <button
                  onClick={() => handleCopyQuote(fact.id, fact.sourceQuote)}
                  className="inline-flex items-center gap-1 text-[#8273B8] hover:text-[#7061A6] font-medium cursor-pointer"
                  title="Copy quotation"
                  aria-label="Copy source quote"
                >
                  {copiedId === fact.id ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy quote</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
