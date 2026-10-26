import React, { useState } from 'react';
import {
  FileText,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileBadge2,
  DollarSign,
  ShieldCheck,
  Building,
  Calendar,
} from 'lucide-react';
import { NoticeAnalysis, AppLanguage, AppSettings } from '../types/notice';
import { AudioSpeechBar } from './AudioSpeechBar';

interface NoticeSummaryProps {
  analysis: NoticeAnalysis;
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  settings: AppSettings;
}

export const NoticeSummary: React.FC<NoticeSummaryProps> = ({
  analysis,
  currentLanguage,
  onLanguageChange,
  settings,
}) => {
  const [showOriginalText, setShowOriginalText] = useState(false);

  const isHindi = currentLanguage === 'hi';
  const summaryText = isHindi ? analysis.summaryHindi : analysis.summaryEnglish;
  const whatThisMeans = isHindi ? analysis.whatThisMeansHindi : analysis.whatThisMeansEnglish;

  const fullSpokenText = `${analysis.title}. From ${analysis.issuingOrganization}. Summary: ${summaryText}. What this means for you: ${whatThisMeans}`;

  return (
    <div className="space-y-6">
      {/* Notice Header Banner */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#EAE4E8] pb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#E8DFF5] text-[#55437a] text-xs font-semibold rounded-lg">
                {analysis.category || 'Official Circular'}
              </span>
              {analysis.announcementDate && (
                <span className="flex items-center gap-1 text-xs text-[#6F6B78] bg-[#FFF9F2] px-2.5 py-0.5 rounded-lg border border-[#EAE4E8]">
                  <Calendar className="w-3.5 h-3.5 text-[#8273B8]" />
                  <span>Announced: {analysis.announcementDate}</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#373444] tracking-tight mb-2">
              {analysis.title}
            </h2>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#6F6B78]">
              <Building className="w-4 h-4 text-[#8273B8] shrink-0" />
              <span className="font-medium text-[#373444]">{analysis.issuingOrganization}</span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-[#FFF9F2] p-1.5 rounded-2xl border border-[#EAE4E8] self-start">
            <Languages className="w-4 h-4 text-[#8273B8] ml-1.5" />
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isHindi
                  ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                  : 'text-[#6F6B78] hover:text-[#373444]'
              }`}
              aria-label="View explanation in English"
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isHindi
                  ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                  : 'text-[#6F6B78] hover:text-[#373444]'
              }`}
              aria-label="View explanation in Hindi"
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Text to Speech controls */}
        <div className="mt-5">
          <AudioSpeechBar
            textToSpeak={fullSpokenText}
            title={isHindi ? 'सारांश (Hindi)' : 'Summary & Implications'}
            language={currentLanguage}
            settings={settings}
          />
        </div>

        {/* Quick Summary & What this means */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="p-5 rounded-2xl bg-[#DCEAF7]/30 border border-[#c4ddf3]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#DCEAF7] text-[#2c5378] flex items-center justify-center">
                <Info className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-[#373444] uppercase tracking-wide">
                {isHindi ? 'त्वरित सारांश' : 'Quick Summary (Key Points)'}
              </h3>
            </div>
            {!isHindi && analysis.summaryBullets && analysis.summaryBullets.length > 0 ? (
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#373444] leading-relaxed list-disc list-inside">
                {analysis.summaryBullets.map((bullet, idx) => (
                  <li key={idx} className="pl-1">
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-[#373444] leading-relaxed">
                {summaryText}
              </p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[#DDEBDD]/40 border border-[#c9e1c9]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#DDEBDD] text-[#2a4d2a] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-[#373444] uppercase tracking-wide">
                {isHindi ? 'आपके लिए इसका क्या अर्थ है' : 'What This Means For You'}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-[#373444] leading-relaxed">
              {whatThisMeans}
            </p>
          </div>
        </div>

        {/* Warnings & Missing Info Banner */}
        {analysis.warningsAndMissingInfo && analysis.warningsAndMissingInfo.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-[#F9E4B7]/40 border border-[#ecd299] text-[#784e12] text-xs">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <AlertTriangle className="w-4 h-4 text-[#784e12]" />
              <span>Warnings &amp; Items Requiring Attention</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              {analysis.warningsAndMissingInfo.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Transparency Disclaimer */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#6F6B78] bg-[#FFF9F2] p-2.5 rounded-xl border border-[#EAE4E8]">
          <ShieldCheck className="w-4 h-4 text-[#8273B8] shrink-0" />
          <span>
            Notice Mate simplifies official circulars for readability. Always consult the official document for final academic or legal confirmation.
          </span>
        </div>
      </div>

      {/* Important Instructions & Conditions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Instructions */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#F8E2D5] text-[#78462c] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#373444]">Important Instructions</h3>
                <p className="text-xs text-[#6F6B78]">Must-follow guidelines from the issuing authority</p>
              </div>
            </div>

            {analysis.importantInstructions && analysis.importantInstructions.length > 0 ? (
              <ul className="space-y-2.5">
                {analysis.importantInstructions.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFF9F2]/70 border border-[#EAE4E8] text-xs sm:text-sm text-[#373444] flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E8DFF5] text-[#55437a] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-normal">{item.instruction}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#6F6B78]">No explicit special instructions noted in this announcement.</p>
            )}
          </div>
        </div>

        {/* Required Documents & Fees */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] p-6 shadow-xs space-y-5">
          {/* Documents checklist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8DFF5] text-[#55437a] flex items-center justify-center">
                <FileBadge2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#373444]">Required Documents Checklist</h3>
                <p className="text-xs text-[#6F6B78]">Check and gather these before applying</p>
              </div>
            </div>

            {analysis.requiredDocuments && analysis.requiredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.requiredDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs font-medium text-[#373444] flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#DDEBDD] text-[#2c532c] flex items-center justify-center shrink-0">
                      ✓
                    </div>
                    <span className="truncate">{doc}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6F6B78]">No specific documents mandated in this notice.</p>
            )}
          </div>

          {/* Fees & Payment Info */}
          {analysis.feesAndPayment && analysis.feesAndPayment.length > 0 && (
            <div className="pt-4 border-t border-[#EAE4E8]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-[#DDEBDD] text-[#2c532c] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#373444]">Fee Structure &amp; Deadlines</h4>
                </div>
              </div>

              <div className="space-y-2">
                {analysis.feesAndPayment.map((fee, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#FFF9F2] border border-[#EAE4E8] rounded-xl text-xs text-[#373444] flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-[#373444]">{fee.feeType}</span>
                      {fee.paymentMethod && (
                        <p className="text-[11px] text-[#6F6B78]">{fee.paymentMethod}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#8273B8] text-sm">{fee.amount || 'As applicable'}</span>
                      {fee.deadline && (
                        <p className="text-[10px] text-[#6F6B78]">Due: {fee.deadline}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Original Notice Source Viewer */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowOriginalText(!showOriginalText)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FFF9F2]/60 cursor-pointer transition-colors"
          aria-expanded={showOriginalText}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFF9F2] border border-[#EAE4E8] text-[#8273B8] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373444]">Original Notice Source Text</h3>
              <p className="text-xs text-[#6F6B78]">
                {showOriginalText ? 'Click to collapse source text' : 'Click to inspect raw text extracted from document'}
              </p>
            </div>
          </div>
          {showOriginalText ? (
            <ChevronUp className="w-5 h-5 text-[#6F6B78]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#6F6B78]" />
          )}
        </button>

        {showOriginalText && (
          <div className="p-5 pt-0 border-t border-[#EAE4E8] bg-[#FFF9F2]/40">
            <pre className="p-4 bg-[#FFFFFF] border border-[#EAE4E8] rounded-2xl text-xs text-[#373444] font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {analysis.originalText || analysis.extractedRawTextSnippet || 'Original text extracted from document is preserved for verification.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
