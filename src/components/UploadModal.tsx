import React, { useState } from 'react';
import { Language, Lesson, TimetableSettings } from '../types/timetable';
import { translations } from '../utils/translations';
import { parseIcsContent } from '../utils/icsParser';
import { SAMPLE_ICS_DATA } from '../utils/sampleData';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onLessonsLoaded: (lessons: Lesson[]) => void;
  onProjectLoaded?: (lessons: Lesson[], settings: TimetableSettings) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  language,
  onClose,
  onLessonsLoaded,
  onProjectLoaded,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'image'>('file');
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleProcessText = (content: string) => {
    setErrorMsg(null);
    setSuccessInfo(null);
    const trimmed = content.trim();

    // 1. Check if content is a JSON project backup
    if (trimmed.startsWith('{') && (trimmed.includes('"lessons"') || trimmed.includes('"type"'))) {
      try {
        const data = JSON.parse(trimmed);
        if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
          if (onProjectLoaded && data.settings) {
            setSuccessInfo(
              (t.upload as { projectSuccessMessage?: string }).projectSuccessMessage ||
                (language === 'sk'
                  ? 'Projekt úspešne obnovený vrátane lekcií a všetkých nastavení!'
                  : 'Project successfully restored with all lessons and settings!')
            );
            setTimeout(() => {
              onProjectLoaded(data.lessons, data.settings);
              onClose();
            }, 600);
            return;
          } else {
            setSuccessInfo(t.upload.successMessage.replace('{count}', data.lessons.length.toString()));
            setTimeout(() => {
              onLessonsLoaded(data.lessons);
              onClose();
            }, 600);
            return;
          }
        }
      } catch (err) {
        console.warn('JSON parse attempt failed, trying iCal format:', err);
      }
    }

    // 2. Otherwise parse as standard iCalendar (.ics / .txt) format
    try {
      const parsed = parseIcsContent(content);
      if (parsed.length === 0) {
        setErrorMsg(t.upload.errorMessage);
        return;
      }
      setSuccessInfo(t.upload.successMessage.replace('{count}', parsed.length.toString()));
      setTimeout(() => {
        onLessonsLoaded(parsed);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      setErrorMsg(t.upload.errorMessage);
    }
  };

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        handleProcessText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    handleProcessText(SAMPLE_ICS_DATA);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                {t.upload.title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.upload.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.upload.fileTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.upload.pasteTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'sk' ? 'Z obrázku' : 'From image'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {activeTab === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.ics,.txt,.json';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files && target.files[0]) {
                    handleFileChange(target.files[0]);
                  }
                };
                input.click();
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">
                {t.upload.dropzoneTitle}
              </h4>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                {t.upload.dropzoneSubtitle}
              </p>
              <span className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs">
                {language === 'sk' ? 'Vybrať súbor z počítača' : 'Browse Files'}
              </span>
            </div>
          ) : activeTab === 'paste' ? (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={t.upload.pastePlaceholder}
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
              <button
                type="button"
                onClick={() => handleProcessText(rawText)}
                disabled={!rawText.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {t.upload.parseButton}
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-slate-700">
              <div className="flex items-center gap-2.5 text-blue-700 font-semibold text-sm">
                <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  {language === 'sk'
                    ? 'Pre získanie rozvrhu z obrázku sa riaďte týmto postupom:'
                    : 'To extract a timetable from an image, follow these steps:'}
                </span>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    {language === 'sk'
                      ? 'Uložte si ukážkový rozvrh v .ics formáte.'
                      : 'Save a sample timetable in .ics format.'}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    {language === 'sk'
                      ? 'Svojmu obľúbenému AI četovaciemu modelu dajte na vstup tento súbor a obrázok vášho rozvrhu, vyžiadajte si rozvrh v tomto .ics formáte. Ak má model problém s čítaním súboru, otvorte si ho v počítači v textovom editore a skopírujte jeho obsah.'
                      : 'Provide this file and an image of your timetable to your favorite AI chat model, requesting the timetable in this .ics format. If the model has trouble reading the file, open it in a text editor on your computer and copy its contents.'}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    {language === 'sk'
                      ? 'Nahrajte získaný .ics súbor v možnosti "Nahrať súbor" alebo priamo jeho text v možnosti "Vložiť text".'
                      : 'Upload the obtained .ics file using "Upload File" or directly paste its text in "Paste Text".'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick sample loader button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {language === 'sk' ? 'Nemáte po ruke súbor?' : 'Don\'t have a file ready?'}
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.upload.sampleButton}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
