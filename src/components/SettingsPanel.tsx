import React, { useRef } from 'react';
import {
  TimetableSettings,
  ColorMode,
  RoundedCorners,
  FontFamily,
  TextSize,
  PresetBackground,
  Lesson,
} from '../types/timetable';
import { translations } from '../utils/translations';
import { PRESET_BACKGROUNDS, DEFAULT_PALETTE } from '../utils/sampleData';
import { formatMinutes } from '../utils/icsParser';
import { calculateTimetableDimensions } from '../utils/timetableDimensions';
import {
  Layout,
  Palette,
  Image as ImageIcon,
  Type,
  Eye,
  Sliders,
  Upload,
  Sparkles,
  Calendar,
  Clock,
  RotateCcw,
  Ruler,
} from 'lucide-react';

interface SettingsPanelProps {
  settings: TimetableSettings;
  lessons?: Lesson[];
  courseCodes: string[];
  lessonTypes: string[];
  earliestPossibleStart: number;
  latestPossibleEnd: number;
  onUpdateSettings: (updater: (prev: TimetableSettings) => TimetableSettings) => void;
  onResetSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  lessons = [],
  courseCodes,
  lessonTypes,
  earliestPossibleStart,
  latestPossibleEnd,
  onUpdateSettings,
  onResetSettings,
}) => {
  const t = translations[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = React.useState<
    'layout' | 'background' | 'appearance' | 'typography' | 'toggles' | 'title'
  >('layout');

  // Timetable dimension scaling calculations
  const isHorizontal = settings.orientation === 'horizontal';
  const calculatedDims = calculateTimetableDimensions(lessons, settings);
  const {
    defaultHorizontalDayWidth,
    defaultHorizontalHourHeight,
    defaultVerticalDayHeight,
    defaultVerticalHourWidth,
    daysCount,
    totalHours,
  } = calculatedDims;

  const isCustomDay = isHorizontal
    ? settings.horizontalDayWidth !== undefined
    : settings.verticalDayHeight !== undefined;

  const currentDayVal = isHorizontal
    ? (settings.horizontalDayWidth ?? defaultHorizontalDayWidth)
    : (settings.verticalDayHeight ?? defaultVerticalDayHeight);

  const isCustomHour = isHorizontal
    ? settings.horizontalHourHeight !== undefined
    : settings.verticalHourWidth !== undefined;

  const currentHourVal = isHorizontal
    ? (settings.horizontalHourHeight ?? defaultHorizontalHourHeight)
    : (settings.verticalHourWidth ?? defaultVerticalHourWidth);

  const dayMin = isHorizontal ? 100 : 60;
  const dayMax = isHorizontal ? 360 : 220;

  const hourMin = isHorizontal ? 35 : 45;
  const hourMax = isHorizontal ? 140 : 180;

  const handleResetDimensions = () => {
    if (isHorizontal) {
      onUpdateSettings((p) => ({
        ...p,
        horizontalDayWidth: undefined,
        horizontalHourHeight: undefined,
        daySize: undefined,
        hourSize: undefined,
      }));
    } else {
      onUpdateSettings((p) => ({
        ...p,
        verticalDayHeight: undefined,
        verticalHourWidth: undefined,
        daySize: undefined,
        hourSize: undefined,
      }));
    }
  };

  // Handle local background image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateSettings((prev) => ({
          ...prev,
          backgroundType: 'image',
          backgroundImageUrl: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const navTabs = [
    { id: 'layout', label: t.tabs.layout, icon: Layout },
    { id: 'background', label: t.tabs.background, icon: ImageIcon },
    { id: 'appearance', label: t.tabs.appearance, icon: Palette },
    { id: 'typography', label: t.tabs.typography, icon: Type },
    { id: 'toggles', label: t.tabs.toggles, icon: Eye },
    { id: 'title', label: t.tabs.title, icon: Sliders },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 p-1.5 gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: LAYOUT & TIMES */}
        {/* ========================================================= */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Orientation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t.settings.orientation}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings((p) => ({ ...p, orientation: 'horizontal' }))}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    settings.orientation === 'horizontal'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Layout className="w-4 h-4 rotate-90" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{t.settings.horizontal}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {settings.language === 'sk' ? 'Dni tvoria stĺpce, čas plynie zhora nadol' : 'Days form columns, time flows vertically'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSettings((p) => ({ ...p, orientation: 'vertical' }))}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    settings.orientation === 'vertical'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{t.settings.vertical}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {settings.language === 'sk' ? 'Dni tvoria riadky, čas plynie zľava doprava' : 'Days form rows, time flows horizontally'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Time Format & Weekend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t.settings.timeFormat}
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, timeFormat: '24h' }))}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                      settings.timeFormat === '24h'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.settings.time24}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, timeFormat: '12h' }))}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                      settings.timeFormat === '12h'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.settings.time12}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t.settings.includeWeekend}
                </label>
                <button
                  type="button"
                  onClick={() => onUpdateSettings((p) => ({ ...p, includeWeekend: !p.includeWeekend }))}
                  className={`w-full py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-between transition-all ${
                    settings.includeWeekend
                      ? 'bg-blue-50/60 border-blue-400 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {settings.includeWeekend
                      ? (settings.language === 'sk' ? 'Víkend zapnutý (Po - Ne)' : 'Weekend included (Mon - Sun)')
                      : (settings.language === 'sk' ? 'Iba pracovné dni (Po - Pi)' : 'Workdays only (Mon - Fri)')}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      settings.includeWeekend ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {settings.includeWeekend ? '✓' : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Start and End Times Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {/* Start Time Config */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {t.settings.startHour}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                    {formatMinutes(
                      settings.startHourMode === 'auto'
                        ? Math.floor(earliestPossibleStart / 30) * 30
                        : Math.min(settings.customStartMinutes, earliestPossibleStart),
                      settings.timeFormat
                    )}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, startHourMode: 'auto' }))}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      settings.startHourMode === 'auto'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-2xs font-semibold'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-200/50'
                    }`}
                  >
                    {t.settings.startAuto}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, startHourMode: 'custom' }))}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      settings.startHourMode === 'custom'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-2xs font-semibold'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-200/50'
                    }`}
                  >
                    {t.settings.startCustom}
                  </button>
                </div>

                {settings.startHourMode === 'custom' && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>{formatMinutes(Math.min(6 * 60, Math.floor(earliestPossibleStart / 5) * 5), settings.timeFormat)}</span>
                      <span className="font-semibold text-blue-600">
                        {formatMinutes(Math.min(settings.customStartMinutes, earliestPossibleStart), settings.timeFormat)}
                      </span>
                      <span>
                        {settings.language === 'sk'
                          ? `Max: ${formatMinutes(earliestPossibleStart, settings.timeFormat)}`
                          : `Max: ${formatMinutes(earliestPossibleStart, settings.timeFormat)}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.min(6 * 60, Math.floor(earliestPossibleStart / 5) * 5)}
                      max={earliestPossibleStart}
                      step={5}
                      value={Math.min(settings.customStartMinutes, earliestPossibleStart)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, customStartMinutes: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* End Time Config */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {t.settings.endHour}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                    {formatMinutes(
                      settings.endHourMode === 'auto'
                        ? Math.ceil(latestPossibleEnd / 30) * 30
                        : Math.max(settings.customEndMinutes, latestPossibleEnd),
                      settings.timeFormat
                    )}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, endHourMode: 'auto' }))}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      settings.endHourMode === 'auto'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-2xs font-semibold'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-200/50'
                    }`}
                  >
                    {t.settings.endAuto}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, endHourMode: 'custom' }))}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      settings.endHourMode === 'custom'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-2xs font-semibold'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-200/50'
                    }`}
                  >
                    {t.settings.endCustom}
                  </button>
                </div>

                {settings.endHourMode === 'custom' && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>{formatMinutes(latestPossibleEnd, settings.timeFormat)}</span>
                      <span className="font-semibold text-blue-600">
                        {formatMinutes(Math.max(settings.customEndMinutes, latestPossibleEnd), settings.timeFormat)}
                      </span>
                      <span>{formatMinutes(Math.max(22 * 60, Math.ceil(latestPossibleEnd / 5) * 5 + 120), settings.timeFormat)}</span>
                    </div>
                    <input
                      type="range"
                      min={latestPossibleEnd}
                      max={Math.max(22 * 60, Math.ceil(latestPossibleEnd / 5) * 5 + 120)}
                      step={5}
                      value={Math.max(settings.customEndMinutes, latestPossibleEnd)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, customEndMinutes: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Grid Lines and Time Axis Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onUpdateSettings((p) => ({ ...p, showGridLines: !p.showGridLines }))}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-between transition-all ${
                  settings.showGridLines
                    ? 'bg-blue-50/60 border-blue-400 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{t.settings.showGridLines}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    settings.showGridLines ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                  }`}
                >
                  {settings.showGridLines ? '✓' : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings((p) => ({ ...p, showTimeAxis: !p.showTimeAxis }))}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-between transition-all ${
                  settings.showTimeAxis
                    ? 'bg-blue-50/60 border-blue-400 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{t.settings.showTimeAxis}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    settings.showTimeAxis ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                  }`}
                >
                  {settings.showTimeAxis ? '✓' : ''}
                </span>
              </button>
            </div>

            {/* Timetable Dimensions Scaling (Day size & Hour size) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-blue-600" />
                    {t.settings.dimensionsScaling}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.settings.dimensionsScalingDesc}
                  </p>
                </div>
                {(isCustomDay || isCustomHour) && (
                  <button
                    type="button"
                    onClick={handleResetDimensions}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.settings.resetToCalculated}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Day Size Slider */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {t.settings.daySize}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isHorizontal ? t.settings.daySizeHorizontalDesc : t.settings.daySizeVerticalDesc}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isCustomDay && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-sm">
                          {t.settings.resetToCalculated}
                        </span>
                      )}
                      <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                        {currentDayVal} px
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={dayMin}
                    max={dayMax}
                    step={2}
                    value={currentDayVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isHorizontal) {
                        onUpdateSettings((p) => ({ ...p, horizontalDayWidth: val, daySize: val }));
                      } else {
                        onUpdateSettings((p) => ({ ...p, verticalDayHeight: val, daySize: val }));
                      }
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{dayMin} px</span>
                    <span className="text-slate-500 font-sans">
                      {isHorizontal ? `${daysCount} ${settings.language === 'sk' ? 'stĺpcov' : 'columns'}` : `${daysCount} ${settings.language === 'sk' ? 'riadkov' : 'rows'}`}
                    </span>
                    <span>{dayMax} px</span>
                  </div>
                </div>

                {/* 2. Hour Size Slider */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {t.settings.hourSize}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isHorizontal ? t.settings.hourSizeHorizontalDesc : t.settings.hourSizeVerticalDesc}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isCustomHour && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-sm">
                          {t.settings.resetToCalculated}
                        </span>
                      )}
                      <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                        {currentHourVal} px
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={hourMin}
                    max={hourMax}
                    step={1}
                    value={currentHourVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isHorizontal) {
                        onUpdateSettings((p) => ({ ...p, horizontalHourHeight: val, hourSize: val }));
                      } else {
                        onUpdateSettings((p) => ({ ...p, verticalHourWidth: val, hourSize: val }));
                      }
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{hourMin} px</span>
                    <span className="text-slate-500 font-sans">
                      {Math.round(totalHours)} {settings.language === 'sk' ? 'hodín celkovo' : 'hours total'}
                    </span>
                    <span>{hourMax} px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BACKGROUND */}
        {/* ========================================================= */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            {/* Background Type Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => onUpdateSettings((p) => ({ ...p, backgroundType: 'color' }))}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  settings.backgroundType === 'color'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.settings.bgSolidColor}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings((p) => ({ ...p, backgroundType: 'image' }))}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  settings.backgroundType === 'image'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.settings.bgPicture}
              </button>
            </div>

            {/* If Color selected */}
            {settings.backgroundType === 'color' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => onUpdateSettings((p) => ({ ...p, backgroundColor: e.target.value }))}
                    className="w-14 h-14 rounded-xl cursor-pointer border border-slate-200 p-1"
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block">
                      {t.settings.pickColor}
                    </label>
                    <span className="text-xs text-slate-500 font-mono">{settings.backgroundColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">
                    {settings.language === 'sk' ? 'Odporúčané farebné odtiene' : 'Curated Swatches'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Pure White', hex: '#ffffff' },
                      { name: 'Warm Cream', hex: '#faf7f2' },
                      { name: 'Soft Slate', hex: '#f1f5f9' },
                      { name: 'Cool Gray', hex: '#e2e8f0' },
                      { name: 'Pale Sage', hex: '#ecf4f0' },
                      { name: 'Lavender Mist', hex: '#f3e8ff' },
                      { name: 'Dark Slate', hex: '#0f172a' },
                      { name: 'Charcoal', hex: '#1e293b' },
                    ].map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, backgroundColor: swatch.hex }))}
                        title={swatch.name}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform hover:scale-110 shadow-2xs ${
                          settings.backgroundColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'ring-2 ring-blue-600 ring-offset-2'
                            : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* If Picture selected: 4 Presets + Upload custom */
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t.settings.presetImages} (4)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_BACKGROUNDS.map((preset) => {
                      const isSelected = settings.backgroundImageUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings((p) => ({
                              ...p,
                              backgroundType: 'image',
                              backgroundImageUrl: preset.url,
                            }))
                          }
                          className={`group relative rounded-xl overflow-hidden aspect-4/3 border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                              : 'border-transparent hover:border-slate-300 opacity-90 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.thumbnail}
                            alt={preset.name[settings.language]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                            <span className="text-[11px] font-medium text-white line-clamp-1">
                              {preset.name[settings.language]}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload own picture */}
                <div className="pt-3 border-t border-slate-100">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{t.settings.uploadImage}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    {t.settings.uploadHint}
                  </p>
                </div>

                {/* Picture adjustment sliders: Blur and Tint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span>{t.settings.blur}</span>
                      <span className="font-mono text-blue-600 font-bold">{settings.backgroundBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={settings.backgroundBlur}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, backgroundBlur: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span>{t.settings.overlayTint}</span>
                      <span className="font-mono text-slate-500">{settings.overlayOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={75}
                      step={5}
                      value={settings.overlayOpacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, overlayOpacity: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Timetable Card Opacity (Rectangle of the whole timetable) */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>{t.settings.timetableCardOpacity}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({settings.language === 'sk' ? 'hlavná karta' : 'main card'})
                    </span>
                  </span>
                  <span className="font-mono text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                    {settings.timetableCardOpacity ?? 40}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.timetableCardOpacity ?? 40}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdateSettings((p) => ({ ...p, timetableCardOpacity: val }));
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>0% ({settings.language === 'sk' ? 'Priesvitné' : 'Transparent'})</span>
                  <span>40% ({settings.language === 'sk' ? 'Predvolené' : 'Default'})</span>
                  <span>100% ({settings.language === 'sk' ? 'Biele' : 'Solid'})</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {settings.language === 'sk'
                    ? 'Nastavuje priehľadnosť podkladového obdĺžnika celého rozvrhu (bg-white) nad vybraným pozadím.'
                    : 'Adjusts the opacity of the main timetable background rectangle over the wallpaper or color.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: APPEARANCE (Rectangles, Corners, Colors) */}
        {/* ========================================================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Corner Radius */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t.settings.corners}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(
                  [
                    { id: 'none', label: t.settings.cornersNone },
                    { id: 'sm', label: t.settings.cornersSm },
                    { id: 'md', label: t.settings.cornersMd },
                    { id: 'lg', label: t.settings.cornersLg },
                    { id: 'xl', label: t.settings.cornersXl },
                    { id: 'full', label: t.settings.cornersFull },
                  ] as { id: RoundedCorners; label: string }[]
                ).map((corner) => (
                  <button
                    key={corner.id}
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, roundedCorners: corner.id }))}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                      settings.roundedCorners === corner.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {corner.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode Selection */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t.settings.colorMode}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'byType',
                    title: t.settings.colorModeByType,
                    desc: settings.language === 'sk' ? 'Predvolené: Biela výplň s rôznou priehľadnosťou podľa typu lekcie (P a C)' : 'Default: White fill with differing transparency by lesson type (Lecture and Practice)',
                  },
                  {
                    id: 'byCode',
                    title: t.settings.colorModeByCode,
                    desc: settings.language === 'sk' ? 'Všetky lekcie rovnakého kódu (napr. FGEG) majú svoju farbu' : 'All classes of code (e.g. FGEG) share unique color palette',
                  },
                  {
                    id: 'single',
                    title: t.settings.colorModeSingle,
                    desc: settings.language === 'sk' ? 'Všetky lekcie majú rovnakú farbu a priehľadnosť' : 'All lessons share uniform color and opacity',
                  },
                  {
                    id: 'individual',
                    title: t.settings.colorModeIndividual,
                    desc: settings.language === 'sk' ? 'Individuálne farby nastavené v detaile každej lekcie' : 'Individual colors set inside each lesson modal',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, colorMode: mode.id as ColorMode }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.colorMode === mode.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{mode.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-specific color pickers */}
            {/* If Single / Uniform */}
            {settings.colorMode === 'single' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.baseFillColor}
                    onChange={(e) => onUpdateSettings((p) => ({ ...p, baseFillColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">{t.settings.baseColor}</span>
                    <span className="text-[11px] text-slate-500">{settings.baseFillColor}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                    <span>{t.settings.transparency}</span>
                    <span className="font-mono text-slate-500">{settings.baseOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={settings.baseOpacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((p) => ({ ...p, baseOpacity: val }));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* If By Type (P, C, S, L) */}
            {settings.colorMode === 'byType' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                    {t.settings.typeColorConfig}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {settings.language === 'sk' ? 'Upravte farbu a priehľadnosť pre každý typ' : 'Adjust color and opacity per type'}
                  </span>
                </div>

                {lessonTypes.length > 0 ? (
                  lessonTypes.map((typeKey) => {
                    const currentCfg = settings.typeConfigs[typeKey] || { color: '#ffffff', opacity: 85 };
                    const typeLabel = t.lessonTypes[typeKey as keyof typeof t.lessonTypes] || typeKey;

                    return (
                      <div
                        key={typeKey}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-800 flex items-center justify-center text-xs border border-slate-200">
                            {typeKey}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{typeLabel}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {currentCfg.color} • {currentCfg.opacity}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={currentCfg.color}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              onUpdateSettings((p) => ({
                                ...p,
                                typeConfigs: {
                                  ...p.typeConfigs,
                                  [typeKey]: {
                                    ...(p.typeConfigs[typeKey] || { opacity: 85 }),
                                    color: newColor,
                                  },
                                },
                              }));
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                          />
                          <div className="w-28 flex items-center gap-2">
                            <input
                              type="range"
                              min={20}
                              max={100}
                              step={1}
                              value={currentCfg.opacity}
                              onChange={(e) => {
                                const newOp = parseInt(e.target.value, 10);
                                onUpdateSettings((p) => ({
                                  ...p,
                                  typeConfigs: {
                                    ...p.typeConfigs,
                                    [typeKey]: {
                                      ...(p.typeConfigs[typeKey] || { color: '#ffffff' }),
                                      opacity: newOp,
                                    },
                                  },
                                }));
                              }}
                              className="w-full accent-blue-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">
                    {settings.language === 'sk'
                      ? 'V rozvrhu neboli nájdené žiadne typy lekcií.'
                      : 'No lesson types detected in current schedule.'}
                  </p>
                )}
              </div>
            )}

            {/* If By Course Code (FGEG etc.) */}
            {settings.colorMode === 'byCode' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                    {t.settings.courseColorPalette}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Apply default curated palette to codes
                      const newColors: Record<string, string> = {};
                      courseCodes.forEach((code, idx) => {
                        newColors[code] = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
                      });
                      onUpdateSettings((p) => ({ ...p, codeColors: { ...p.codeColors, ...newColors } }));
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {settings.language === 'sk' ? 'Automatická paleta' : 'Auto Palette'}
                  </button>
                </div>

                <div className="space-y-2">
                  {courseCodes.map((code) => {
                    const color = settings.codeColors[code] || '#3b82f6';
                    return (
                      <div
                        key={code}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-xs text-slate-900">{code}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateSettings((p) => ({
                                ...p,
                                codeColors: {
                                  ...p.codeColors,
                                  [code]: val,
                                },
                              }));
                            }}
                            className="w-7 h-7 rounded-md cursor-pointer border border-slate-200"
                          />
                          <span className="text-xs font-mono text-slate-500 w-16">{color}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TYPOGRAPHY */}
        {/* ========================================================= */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            {/* Font Family */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t.settings.fontFamily}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'jakarta', name: 'Plus Jakarta Sans', fontClass: 'font-jakarta' },
                  { id: 'inter', name: 'Inter (Modern Sans)', fontClass: 'font-inter' },
                  { id: 'outfit', name: 'Outfit (Geometric)', fontClass: 'font-outfit' },
                  { id: 'playfair', name: 'Playfair (Academic Serif)', fontClass: 'font-playfair' },
                  { id: 'jetbrains', name: 'JetBrains Mono', fontClass: 'font-jetbrains' },
                  { id: 'cinzel', name: 'Cinzel (Classical)', fontClass: 'font-cinzel' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdateSettings((p) => ({ ...p, fontFamily: f.id as FontFamily }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.fontFamily === f.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`text-sm font-semibold text-slate-900 block ${f.fontClass}`}>
                      {f.name}
                    </span>
                    <span className="text-[11px] text-slate-500">Abc 123</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Colors */}
            {/* Font Size Slider for Lessons */}
            <div className="pt-4 border-t border-slate-100 max-w-sm">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {t.settings.fontSize}
                </label>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {(() => {
                    const currentScale =
                      settings.lessonFontScale ??
                      (settings.fontSize === 'sm' ? 90 : settings.fontSize === 'lg' ? 110 : 100);
                    if (currentScale === 100) return `100% (${t.settings.fontSizeBase})`;
                    if (currentScale === 90) return `90% (${t.settings.fontSizeSm} / -10%)`;
                    if (currentScale === 110) return `110% (${t.settings.fontSizeLg} / +10%)`;
                    const diff = currentScale - 100;
                    return `${currentScale}% (${diff > 0 ? `+${diff}%` : `${diff}%`})`;
                  })()}
                </span>
              </div>

              {/* Slider for +/- 10% adjustments */}
              <input
                type="range"
                min={80}
                max={130}
                step={5}
                value={
                  settings.lessonFontScale ??
                  (settings.fontSize === 'sm' ? 90 : settings.fontSize === 'lg' ? 110 : 100)
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdateSettings((p) => ({
                    ...p,
                    lessonFontScale: val,
                    fontSize: val <= 90 ? 'sm' : val >= 110 ? 'lg' : 'base',
                  }));
                }}
                className="w-full accent-blue-600 cursor-pointer mb-2"
              />

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {[
                  {
                    scale: 90,
                    id: 'sm' as TextSize,
                    label: `${t.settings.fontSizeSm} (-10%)`,
                  },
                  {
                    scale: 100,
                    id: 'base' as TextSize,
                    label: `${t.settings.fontSizeBase}`,
                  },
                  {
                    scale: 110,
                    id: 'lg' as TextSize,
                    label: `${t.settings.fontSizeLg} (+10%)`,
                  },
                ].map((preset) => {
                  const currentScale =
                    settings.lessonFontScale ??
                    (settings.fontSize === 'sm' ? 90 : settings.fontSize === 'lg' ? 110 : 100);
                  const isSelected = currentScale === preset.scale;
                  return (
                    <button
                      key={preset.scale}
                      type="button"
                      onClick={() =>
                        onUpdateSettings((p) => ({
                          ...p,
                          lessonFontScale: preset.scale,
                          fontSize: preset.id,
                        }))
                      }
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: DISPLAY TOGGLES */}
        {/* ========================================================= */}
        {activeTab === 'toggles' && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {settings.language === 'sk'
                ? 'Prvky zobrazené na jednotlivých kartách hodín'
                : 'Elements displayed on lesson cards'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'showCode', label: t.settings.toggleCode },
                { key: 'showTitle', label: t.settings.toggleTitle },
                { key: 'showType', label: t.settings.toggleType },
                { key: 'showRoom', label: t.settings.toggleRoom },
                { key: 'showTeacher', label: t.settings.toggleTeacher },
                { key: 'showTime', label: t.settings.toggleTime },
                { key: 'showDuration', label: t.settings.toggleDuration },
              ].map((item) => {
                const k = item.key as keyof typeof settings.display;
                const isChecked = settings.display[k];

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((p) => ({
                        ...p,
                        display: {
                          ...p.display,
                          [k]: !p.display[k],
                        },
                      }))
                    }
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isChecked
                        ? 'bg-blue-50/50 border-blue-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-medium">{item.label}</span>
                    <span
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-bold ${
                        isChecked ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SCHEDULE TITLE */}
        {/* ========================================================= */}
        {activeTab === 'title' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t.settings.showTitleToggle}
              </label>
              <input
                type="checkbox"
                checked={settings.showScheduleTitle}
                onChange={(e) => onUpdateSettings((p) => ({ ...p, showScheduleTitle: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
            </div>

            {settings.showScheduleTitle && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.settings.titleInput}
                  </label>
                  <input
                    type="text"
                    value={settings.scheduleTitle}
                    onChange={(e) => onUpdateSettings((p) => ({ ...p, scheduleTitle: e.target.value }))}
                    placeholder="Rozvrh hodín / Timetable"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.settings.subtitleInput}
                  </label>
                  <input
                    type="text"
                    value={settings.scheduleSubtitle}
                    onChange={(e) => onUpdateSettings((p) => ({ ...p, scheduleSubtitle: e.target.value }))}
                    placeholder="Zimný semester 2026/2027 • UPJŠ Košice"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Colors for Title and Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      {t.settings.textColor}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.textColor}
                        onChange={(e) => onUpdateSettings((p) => ({ ...p, textColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-600">{settings.textColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      {t.settings.accentTextColor}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentTextColor}
                        onChange={(e) => onUpdateSettings((p) => ({ ...p, accentTextColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-600">{settings.accentTextColor}</span>
                    </div>
                  </div>
                </div>

                {/* Title and Subtitle Alignment */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t.settings.titleAlignment}
                  </label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((p) => ({ ...p, titleAlignment: 'left' }))}
                      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                        (settings.titleAlignment || 'left') === 'left'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.settings.alignLeft}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings((p) => ({ ...p, titleAlignment: 'center' }))}
                      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                        settings.titleAlignment === 'center'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.settings.alignCenter}
                    </button>
                  </div>
                </div>

                {/* Font for Title */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t.settings.titleFontFamily}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'jakarta', name: 'Plus Jakarta Sans', fontClass: 'font-jakarta' },
                      { id: 'inter', name: 'Inter', fontClass: 'font-inter' },
                      { id: 'outfit', name: 'Outfit', fontClass: 'font-outfit' },
                      { id: 'playfair', name: 'Playfair (Serif)', fontClass: 'font-playfair' },
                      { id: 'jetbrains', name: 'JetBrains Mono', fontClass: 'font-jetbrains' },
                      { id: 'cinzel', name: 'Cinzel (Classical)', fontClass: 'font-cinzel' },
                      { id: 'space', name: 'Space Grotesk', fontClass: 'font-space' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, titleFontFamily: f.id as FontFamily }))}
                        className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                          (settings.titleFontFamily || settings.fontFamily) === f.id
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className={`text-xs font-semibold text-slate-900 block truncate ${f.fontClass}`}>
                          {f.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font for Subtitle */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t.settings.subtitleFontFamily}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'jakarta', name: 'Plus Jakarta Sans', fontClass: 'font-jakarta' },
                      { id: 'inter', name: 'Inter', fontClass: 'font-inter' },
                      { id: 'outfit', name: 'Outfit', fontClass: 'font-outfit' },
                      { id: 'playfair', name: 'Playfair (Serif)', fontClass: 'font-playfair' },
                      { id: 'jetbrains', name: 'JetBrains Mono', fontClass: 'font-jetbrains' },
                      { id: 'cinzel', name: 'Cinzel (Classical)', fontClass: 'font-cinzel' },
                      { id: 'space', name: 'Space Grotesk', fontClass: 'font-space' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, subtitleFontFamily: f.id as FontFamily }))}
                        className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                          (settings.subtitleFontFamily || settings.fontFamily) === f.id
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className={`text-xs font-semibold text-slate-900 block truncate ${f.fontClass}`}>
                          {f.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Sliders for Title and Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span>{t.settings.titleFontSize}</span>
                      <span className="font-mono text-blue-600 font-bold">{settings.titleFontSize || 32}px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={64}
                      step={1}
                      value={settings.titleFontSize || 32}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, titleFontSize: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span>{t.settings.subtitleFontSize}</span>
                      <span className="font-mono text-blue-600 font-bold">{settings.subtitleFontSize || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min={11}
                      max={36}
                      step={1}
                      value={settings.subtitleFontSize || 16}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((p) => ({ ...p, subtitleFontSize: val }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info & Reset */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>{t.footer.hint}</span>
        <button
          type="button"
          onClick={onResetSettings}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{settings.language === 'sk' ? 'Predvolené nastavenia' : 'Reset to default'}</span>
        </button>
      </div>
    </div>
  );
};
