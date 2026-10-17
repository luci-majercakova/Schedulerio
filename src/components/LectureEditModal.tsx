import React, { useState, useEffect } from 'react';
import { Lesson, Language } from '../types/timetable';
import { translations } from '../utils/translations';
import { formatMinutes, parseTimeToMinutes } from '../utils/icsParser';
import { X, Trash2, Copy, Save, Clock, MapPin, User, Tag, BookOpen, Calendar } from 'lucide-react';

interface LectureEditModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  isNew?: boolean;
  language: Language;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
  onDelete?: (lessonId: string) => void;
  onDuplicate?: (lesson: Lesson) => void;
}

export const LectureEditModal: React.FC<LectureEditModalProps> = ({
  lesson,
  isOpen,
  isNew = false,
  language,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const t = translations[language];

  const [formData, setFormData] = useState<Partial<Lesson>>({
    code: '',
    fullCode: '',
    title: '',
    type: 'P',
    teacher: '',
    room: '',
    fullLocation: '',
    dayOfWeek: 1,
    startMinutes: 8 * 60,
    endMinutes: 9 * 60 + 30,
    customColor: '',
    customOpacity: undefined,
    notes: '',
  });

  const [startTimeStr, setStartTimeStr] = useState('08:00');
  const [endTimeStr, setEndTimeStr] = useState('09:30');

  useEffect(() => {
    if (lesson) {
      setFormData({ ...lesson });
      setStartTimeStr(formatMinutes(lesson.startMinutes, '24h'));
      setEndTimeStr(formatMinutes(lesson.endMinutes, '24h'));
    } else {
      setFormData({
        id: `lesson-${Date.now()}`,
        code: 'NOVY',
        fullCode: 'NOVY/01',
        title: language === 'sk' ? 'Nový predmet' : 'New Course',
        type: 'P',
        teacher: '',
        room: '',
        fullLocation: '',
        dayOfWeek: 1,
        startMinutes: 8 * 60,
        endMinutes: 9 * 60 + 30,
      });
      setStartTimeStr('08:00');
      setEndTimeStr('09:30');
    }
  }, [lesson, isOpen, language]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startM = parseTimeToMinutes(startTimeStr);
    const endM = parseTimeToMinutes(endTimeStr);

    if (endM <= startM) {
      alert(language === 'sk' ? 'Čas konca musí byť neskôr ako čas začiatku!' : 'End time must be after start time!');
      return;
    }

    const updated: Lesson = {
      id: formData.id || `lesson-${Date.now()}`,
      code: (formData.code || 'SUBJ').toUpperCase().trim(),
      fullCode: formData.fullCode || formData.code || 'SUBJ',
      title: formData.title?.trim() || (language === 'sk' ? 'Predmet' : 'Course'),
      type: (formData.type || 'P').trim().toUpperCase().slice(0, 1),
      teacher: formData.teacher?.trim() || '',
      room: formData.room?.trim() || '',
      fullLocation: formData.fullLocation?.trim() || formData.room?.trim() || '',
      dayOfWeek: formData.dayOfWeek || 1,
      startMinutes: startM,
      endMinutes: endM,
      customColor: formData.customColor || undefined,
      customOpacity: formData.customOpacity,
      notes: formData.notes?.trim() || undefined,
    };

    onSave(updated);
    onClose();
  };

  const handleDuplicate = () => {
    if (!formData.id) return;
    const duplicated: Lesson = {
      ...(formData as Lesson),
      id: `lesson-dup-${Date.now()}`,
      title: `${formData.title} (${language === 'sk' ? 'kópia' : 'copy'})`,
    };
    if (onDuplicate) {
      onDuplicate(duplicated);
      onClose();
    }
  };

  const handleDelete = () => {
    if (!formData.id) return;
    if (confirm(language === 'sk' ? 'Naozaj chcete vymazať túto lekciu z rozvrhu?' : 'Are you sure you want to delete this lesson?')) {
      if (onDelete) {
        onDelete(formData.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                {isNew ? t.modal.addTitle : t.modal.editTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {formData.code} • {formData.title || (language === 'sk' ? 'Názov lekcie' : 'Lesson title')}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Row 1: Code and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {t.modal.courseCode}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="APA1, VSM..."
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase tracking-wide"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.modal.lessonType}
              </label>
              <input
                type="text"
                maxLength={1}
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase().slice(0, 1) })}
                placeholder="P"
                className="w-full px-3 py-2 text-sm font-bold text-center rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {t.modal.courseTitle}
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === 'sk' ? 'Aproximačné a pravdepodobnostné algoritmy' : 'Approximation and Probabilistic Algorithms'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {t.modal.day}
            </label>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFormData({ ...formData, dayOfWeek: d })}
                  className={`py-2 text-center text-xs font-semibold rounded-lg transition-all border ${
                    formData.dayOfWeek === d
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.daysShort[d as keyof typeof t.daysShort]}
                </button>
              ))}
            </div>
          </div>

          {/* Time: Start and End */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {t.modal.startTime}
              </label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {t.modal.endTime}
              </label>
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Room and Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {t.modal.room}
              </label>
              <input
                type="text"
                value={formData.room || ''}
                onChange={(e) => setFormData({ ...formData, room: e.target.value, fullLocation: formData.fullLocation || e.target.value })}
                placeholder="SJ2P11, SA1C05..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.modal.teacher}
              </label>
              <input
                type="text"
                value={formData.teacher || ''}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="doc. RNDr. Jozef Mrkva, PhD."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Full Location */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.modal.fullLocation}
            </label>
            <input
              type="text"
              value={formData.fullLocation || ''}
              onChange={(e) => setFormData({ ...formData, fullLocation: e.target.value })}
              placeholder="SJ2P11, poschodie 2, Jesenná 5, Košice-Sever"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Optional Individual Color Override */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                {t.modal.customColor}
              </label>
              {formData.customColor && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customColor: undefined })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {language === 'sk' ? 'Resetovať na globálnu tému' : 'Reset to global theme'}
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={formData.customColor || '#ffffff'}
                onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <span className="text-xs text-slate-500">
                {formData.customColor
                  ? `${language === 'sk' ? 'Vlastná farba' : 'Custom color'}: ${formData.customColor}`
                  : (language === 'sk' ? 'Riadí sa nastaveniami farebného režimu rozvrhu' : 'Controlled by timetable color theme')}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.modal.delete}
                </button>
              )}
              {!isNew && onDuplicate && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t.modal.duplicate}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                {t.modal.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t.modal.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
