import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Lesson, TimetableSettings, Language } from './types/timetable';
import { INITIAL_SETTINGS, SAMPLE_ICS_DATA, DEFAULT_PALETTE } from './utils/sampleData';
import { parseIcsContent } from './utils/icsParser';
import { translations } from './utils/translations';
import { downloadTimetableImage, downloadTimetableIcs, downloadTimetableProjectJson } from './utils/exportUtils';
import { TimetableGrid } from './components/TimetableGrid';
import { SettingsPanel } from './components/SettingsPanel';
import { LectureEditModal } from './components/LectureEditModal';
import { UploadModal } from './components/UploadModal';
import {
  Upload,
  Download,
  Plus,
  Sliders,
  Sparkles,
  Calendar,
  CalendarHeart,
  FileDown,
  FileCode2,
  Globe,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export default function App() {
  // Initialize with the sample data provided by the user
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    return parseIcsContent(SAMPLE_ICS_DATA);
  });

  const [settings, setSettings] = useState<TimetableSettings>(INITIAL_SETTINGS);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'both' | 'settings'>('both');

  const timetableRef = useRef<HTMLDivElement>(null);
  const t = translations[settings.language];

  // Distinct course codes from current lessons
  const courseCodes = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => {
      if (l.code) set.add(l.code);
    });
    return Array.from(set);
  }, [lessons]);

  // Distinct lesson types from current lessons
  const lessonTypes = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => {
      if (l.type) set.add(l.type);
    });
    return Array.from(set);
  }, [lessons]);

  // Initialize or update codeColors if new codes are detected
  useEffect(() => {
    setSettings((prev) => {
      let changed = false;
      const updatedCodeColors = { ...prev.codeColors };
      const updatedCodeOpacities = { ...prev.codeOpacities };

      courseCodes.forEach((code, idx) => {
        if (!updatedCodeColors[code]) {
          updatedCodeColors[code] = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
          updatedCodeOpacities[code] = 88;
          changed = true;
        }
      });

      if (!changed) return prev;
      return {
        ...prev,
        codeColors: updatedCodeColors,
        codeOpacities: updatedCodeOpacities,
      };
    });
  }, [courseCodes]);

  // Earliest and latest minutes bounds across current lessons
  const { earliestStart, latestEnd } = useMemo(() => {
    if (lessons.length === 0) {
      return { earliestStart: 8 * 60, latestEnd: 18 * 60 };
    }
    const starts = lessons.map((l) => l.startMinutes);
    const ends = lessons.map((l) => l.endMinutes);
    return {
      earliestStart: Math.min(...starts),
      latestEnd: Math.max(...ends),
    };
  }, [lessons]);

  // Language switch
  const handleLanguageChange = (lang: Language) => {
    setSettings((prev) => ({
      ...prev,
      language: lang,
      scheduleTitle:
        lang === 'sk'
          ? prev.scheduleTitle === 'Weekly Timetable'
            ? 'Rozvrh hodín'
            : prev.scheduleTitle
          : prev.scheduleTitle === 'Rozvrh hodín'
          ? 'Weekly Timetable'
          : prev.scheduleTitle,
      scheduleSubtitle:
        lang === 'sk'
          ? prev.scheduleSubtitle === 'Winter semester 2026/2027'
            ? 'Zimný semester 2026/2027'
            : prev.scheduleSubtitle
          : prev.scheduleSubtitle === 'Zimný semester 2026/2027'
          ? 'Winter semester 2026/2027'
          : prev.scheduleSubtitle,
    }));
  };

  // Lesson CRUD operations
  const handleSaveLesson = (savedLesson: Lesson) => {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l.id === savedLesson.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedLesson;
        return next;
      }
      return [...prev, savedLesson];
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const handleDuplicateLesson = (duplicatedLesson: Lesson) => {
    setLessons((prev) => [...prev, duplicatedLesson]);
  };

  const handleOpenAddModal = (day = 1, startM = 8 * 60) => {
    setSelectedLesson({
      id: `lesson-${Date.now()}`,
      code: 'NOVY',
      fullCode: 'NOVY/01',
      title: settings.language === 'sk' ? 'Nový predmet' : 'New Course',
      type: 'P',
      teacher: '',
      room: '',
      fullLocation: '',
      dayOfWeek: day,
      startMinutes: startM,
      endMinutes: startM + 90,
    });
    setIsNewLesson(true);
    setIsEditModalOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsNewLesson(false);
    setIsEditModalOpen(true);
  };

  // Image Export
  const handleExportPng = async () => {
    if (!timetableRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${settings.scheduleTitle || 'rozvrh'}.png`.toLowerCase().replace(/\s+/g, '-');
      await downloadTimetableImage(timetableRef.current, filename);
    } catch (err) {
      console.error(err);
      alert(settings.language === 'sk' ? 'Nastala chyba pri ukladaní obrázka.' : 'Error generating timetable image.');
    } finally {
      setIsExporting(false);
    }
  };

  // .ICS Export
  const handleExportIcs = () => {
    const filename = `${settings.scheduleTitle || 'rozvrh'}.ics`.toLowerCase().replace(/\s+/g, '-');
    downloadTimetableIcs(lessons, filename, settings.scheduleTitle || 'Rozvrh');
  };

  // JSON Project Export
  const handleExportJson = () => {
    const filename = `${settings.scheduleTitle || 'rozvrh'}-projekt.json`.toLowerCase().replace(/\s+/g, '-');
    downloadTimetableProjectJson(lessons, settings, filename);
  };

  // Restore Project from JSON Backup
  const handleProjectLoaded = (restoredLessons: Lesson[], restoredSettings: TimetableSettings) => {
    setLessons(restoredLessons);
    setSettings((prev) => ({
      ...INITIAL_SETTINGS,
      ...restoredSettings,
      language: restoredSettings.language || prev.language,
    }));
  };

  // Load sample data
  const handleLoadSample = () => {
    const parsed = parseIcsContent(SAMPLE_ICS_DATA);
    setLessons(parsed);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-fuchsia-600 text-white flex items-center justify-center shadow-sm">
              <CalendarHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {(() => {
                  const title = t.appTitle || "";
                  const mainText = title.slice(0, -2); // Všetko okrem posledných 2 písmen
                  const lastTwo = title.slice(-2);   // Posledné 2 písmená

                  return (
                    <span className="font-bold text-indigo-600  tracking-tight text-lg">
                      {mainText}
                      <span className="text-fuchsia-600">{lastTwo}</span> 
                    </span>
                  );
                })()}
                <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  AiS2 / iCal
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.nav.uploadFile}</span>
            </button>

            {/* Add Lesson Button */}
            <button
              type="button"
              onClick={() => handleOpenAddModal(1, 8 * 60)}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.nav.addLesson}</span>
            </button>

            {/* Export PNG Button */}
            <button
              type="button"
              disabled={isExporting || lessons.length === 0}
              onClick={handleExportPng}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? (settings.language === 'sk' ? 'Ukladám...' : 'Exporting...') : t.nav.exportImage}</span>
            </button>

            {/* Export .ics Button */}
            <button
              type="button"
              onClick={handleExportIcs}
              title={t.nav.exportIcs}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>

            {/* Export JSON Project Backup Button */}
            <button
              type="button"
              onClick={handleExportJson}
              title={t.nav.exportJson}
              className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">{t.nav.exportJson}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 ml-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('sk')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  settings.language === 'sk'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SK
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  settings.language === 'en'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Sample / Empty Banner if empty */}
        {lessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {t.emptyState.title}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {t.emptyState.description}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition-colors"
              >
                {t.emptyState.uploadAction}
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                {t.emptyState.sampleAction}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View Mode Bar for smaller screens & preview control */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{lessons.length}</span>
                <span>
                  {settings.language === 'sk'
                    ? lessons.length === 1
                      ? 'lekcia'
                      : lessons.length >= 2 && lessons.length <= 4
                      ? 'lekcie'
                      : 'lekcií'
                    : lessons.length === 1
                    ? 'lesson'
                    : 'lessons'}
                </span>
                <span className="text-slate-300">·</span>
                <span>{courseCodes.length} {settings.language === 'sk' ? 'predmetov' : 'courses'}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-[11px] bg-slate-200/70 px-2 py-0.5 rounded-sm">
                  {settings.orientation === 'horizontal' ? (settings.language === 'sk' ? 'Dni v stĺpcoch' : 'Columns') : (settings.language === 'sk' ? 'Dni v riadkoch' : 'Rows')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.nav.loadSample}</span>
                </button>
              </div>
            </div>

            {/* Timetable Canvas Display */}
            <div className="overflow-x-auto pb-4">
              <TimetableGrid
                gridRef={timetableRef}
                lessons={lessons}
                settings={settings}
                onEditLesson={handleEditLesson}
                onAddLessonAt={handleOpenAddModal}
              />
            </div>

            {/* Settings Accordion / Panel */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t.nav.settings}
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {settings.language === 'sk' ? 'Zmeny sa okamžite prejavia na rozvrhu vyššie' : 'Changes apply live to the timetable above'}
                </span>
              </div>

              <SettingsPanel
                settings={settings}
                lessons={lessons}
                courseCodes={courseCodes}
                lessonTypes={lessonTypes}
                earliestPossibleStart={earliestStart}
                latestPossibleEnd={latestEnd}
                onUpdateSettings={setSettings}
                onResetSettings={() => setSettings(INITIAL_SETTINGS)}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white/60 text-center text-xs text-slate-500">
        <p>
          {t.appTitle} • {settings.language === 'sk' ? 'Vytvorené pre študentov vysokých škôl (optimalizované pre UPJŠ a TUKE)' : 'Crafted for university students (optimized for UPJŠ and TUKE)'}
        </p>
      </footer>

      {/* Lecture Edit/Add Modal */}
      <LectureEditModal
        isOpen={isEditModalOpen}
        isNew={isNewLesson}
        lesson={selectedLesson}
        language={settings.language}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
        onDuplicate={handleDuplicateLesson}
      />

      {/* Upload .ics / .txt / .json Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        language={settings.language}
        onClose={() => setIsUploadModalOpen(false)}
        onLessonsLoaded={(newLessons) => {
          setLessons(newLessons);
        }}
        onProjectLoaded={handleProjectLoaded}
      />
    </div>
  );
}
