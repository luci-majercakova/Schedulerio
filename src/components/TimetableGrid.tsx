import React from 'react';
import { Lesson, TimetableSettings, FontFamily } from '../types/timetable';
import { translations } from '../utils/translations';
import { formatMinutes } from '../utils/icsParser';
import { calculateTimetableDimensions } from '../utils/timetableDimensions';
import { Clock, MapPin, User, Edit3, Plus } from 'lucide-react';

interface TimetableGridProps {
  lessons: Lesson[];
  settings: TimetableSettings;
  onEditLesson: (lesson: Lesson) => void;
  onAddLessonAt?: (day: number, startMinutes: number) => void;
  gridRef?: React.RefObject<HTMLDivElement | null>;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  lessons,
  settings,
  onEditLesson,
  onAddLessonAt,
  gridRef,
}) => {
  const t = translations[settings.language];

  // Derive timetable bounds, day lists, and active scalable dimensions
  const {
    gridStartMinutes,
    gridEndMinutes,
    totalMinutes,
    totalHours,
    daysCount,
    daysToShow,
    activeDaySize,
    activeHourSize,
  } = calculateTimetableDimensions(lessons, settings);

  // Generate hourly markers only (exact hours)
  const timeMarkers: number[] = [];
  const firstHour = Math.floor(gridStartMinutes / 60) * 60;
  for (let m = firstHour; m <= gridEndMinutes; m += 60) {
    if (m >= gridStartMinutes && m <= gridEndMinutes) {
      timeMarkers.push(m);
    }
  }

  // Format time markers on the time axis (e.g. "5 PM" instead of "5:00 PM" in 12-hour format)
  const formatAxisTime = (minutes: number) => {
    if (settings.timeFormat === '12h') {
      const h24 = Math.floor(minutes / 60);
      const m = minutes % 60;
      const period = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      if (m === 0) {
        return `${h12} ${period}`;
      }
      return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    }
    return formatMinutes(minutes, settings.timeFormat);
  };

  // Helper for font family class
  const getFontClass = (fontKey?: FontFamily) => {
    const key = fontKey || settings.fontFamily;
    switch (key) {
      case 'jakarta': return 'font-jakarta';
      case 'outfit': return 'font-outfit';
      case 'playfair': return 'font-playfair';
      case 'jetbrains': return 'font-jetbrains';
      case 'cinzel': return 'font-cinzel';
      case 'space': return 'font-space';
      case 'inter':
      default:
        return 'font-inter';
    }
  };

  // Helper for rounded corners class
  const getCornerClass = () => {
    switch (settings.roundedCorners) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-xs';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-xl';
      case 'xl': return 'rounded-2xl';
      case 'full': return 'rounded-3xl';
      default: return 'rounded-xl';
    }
  };

  // Helper to determine background style of a lesson rectangle
  const getLessonStyle = (lesson: Lesson) => {
    let hexColor = settings.baseFillColor || '#ffffff';
    let opacity = settings.baseOpacity ?? 88;

    // Check individual override first
    if (lesson.customColor) {
      hexColor = lesson.customColor;
      opacity = lesson.customOpacity ?? 90;
    } else if (settings.colorMode === 'byType') {
      const typeCfg = settings.typeConfigs[lesson.type];
      if (typeCfg) {
        hexColor = typeCfg.color;
        opacity = typeCfg.opacity;
      }
    } else if (settings.colorMode === 'byCode') {
      if (settings.codeColors[lesson.code]) {
        hexColor = settings.codeColors[lesson.code];
        opacity = settings.codeOpacities[lesson.code] ?? 88;
      }
    }

    // Convert hex to rgba
    const r = parseInt(hexColor.slice(1, 3), 16) || 255;
    const g = parseInt(hexColor.slice(3, 5), 16) || 255;
    const b = parseInt(hexColor.slice(5, 7), 16) || 255;
    const alpha = (opacity / 100).toFixed(2);

    const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 150;

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      borderColor: isLight ? `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, 0.35)` : `rgba(255, 255, 255, 0.25)`,
      textColor: isLight ? '#0f172a' : '#ffffff',
      subTextColor: isLight ? '#334155' : '#e2e8f0',
      badgeBg: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.2)',
    };
  };

  // Calculate total minutes across all lessons
  const totalLessonMinutes = lessons.reduce(
    (acc, l) => acc + Math.max(0, l.endMinutes - l.startMinutes),
    0
  );

  const getLessonsCountText = (count: number, lang: 'sk' | 'en') => {
    if (lang === 'sk') {
      if (count === 1) return '1 lekcia týždenne';
      if (count >= 2 && count <= 4) return `${count} lekcie týždenne`;
      return `${count} lekcií týždenne`;
    }
    return `${count} ${count === 1 ? 'lesson' : 'lessons'} weekly`;
  };

  const getTotalMinutesText = (mins: number, lang: 'sk' | 'en') => {
    if (lang === 'sk') {
      return `${mins} minút celkovo`;
    }
    return `${mins} minutes total`;
  };

  const isHorizontal = settings.orientation === 'horizontal';
  const showTimeAxis = settings.showTimeAxis !== false;
  const showGridLines = settings.showGridLines !== false;

  // Lesson font scaling (approximately +/- 10% per step from standard base size)
  const lessonFontScale =
    settings.lessonFontScale ??
    (settings.fontSize === 'sm' ? 90 : settings.fontSize === 'lg' ? 110 : 100);
  const fontScale = lessonFontScale / 100;
  const getScaledSize = (basePx: number) => `${(basePx * fontScale).toFixed(1)}px`;

  // Dynamic opacity of the whole timetable card / rectangle (default 40%)
  const timetableCardOpacity = (settings.timetableCardOpacity ?? 40) / 100;
  const timetableCardBgStyle: React.CSSProperties = {
    backgroundColor: `rgba(255, 255, 255, ${timetableCardOpacity})`,
  };

  // Scaled dimensions calculations
  const horizontalGridWidth = (showTimeAxis ? 70 : 0) + daysCount * activeDaySize;
  const horizontalBodyHeight = Math.round(totalHours * activeHourSize);

  const verticalTimelineWidth = Math.round(totalHours * activeHourSize);
  const verticalDayLabelWidth = 144;
  const totalVerticalGridWidth = verticalDayLabelWidth + verticalTimelineWidth;

  const isCustomHorizontalDay = settings.horizontalDayWidth !== undefined;
  const isCustomVerticalHour = settings.verticalHourWidth !== undefined;
  const isCustomWidth = isHorizontal ? isCustomHorizontalDay : isCustomVerticalHour;
  const activeCustomWidth = isHorizontal ? horizontalGridWidth : totalVerticalGridWidth;

  return (
    <div
      ref={gridRef}
      id="timetable-canvas"
      style={{
        backgroundColor: settings.backgroundColor,
        width: isCustomWidth ? 'max-content' : '100%',
        minWidth: '100%',
      }}
      className={`relative rounded-2xl shadow-xl overflow-hidden border border-slate-200/50 transition-all ${getFontClass()}`}
    >
      {/* Background Layer: Image with direct CSS filter blur and scaling to eliminate edge softness */}
      {settings.backgroundType === 'image' && settings.backgroundImageUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="w-full h-full transition-all duration-200"
            style={{
              backgroundImage: `url("${settings.backgroundImageUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              filter: settings.backgroundBlur > 0 ? `blur(${settings.backgroundBlur}px)` : 'none',
              transform: settings.backgroundBlur > 0 ? 'scale(1.08)' : 'none',
              transformOrigin: 'center center',
            }}
          />
          {/* Overlay darkness & color tint */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: settings.overlayColor || '#000000',
              opacity: settings.overlayOpacity / 100,
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          width: isCustomWidth ? 'max-content' : '100%',
          minWidth: '100%',
        }}
        className="relative z-10 pt-10 sm:pt-14 md:pt-16 pb-5 sm:pb-7 md:pb-8 px-4 sm:px-6 md:px-8 flex flex-col min-w-[700px] select-none"
      >
        {/* Timetable Header / Title Banner */}
        {settings.showScheduleTitle && (
          <div
            style={{ width: isCustomWidth ? `${activeCustomWidth}px` : '100%' }}
            className={`mb-6 flex flex-col ${
              settings.titleAlignment === 'center'
                ? 'items-center text-center gap-3'
                : 'sm:flex-row sm:items-end justify-between gap-3 text-left'
            } pb-4 border-b border-black/10 dark:border-white/15`}
          >
            <div>
              <h1
                style={{
                  color: settings.textColor,
                  fontSize: settings.titleFontSize ? `${settings.titleFontSize}px` : undefined,
                  lineHeight: 1.15,
                }}
                className={`font-bold tracking-tight drop-shadow-2xs ${getFontClass(settings.titleFontFamily)} ${
                  !settings.titleFontSize ? 'text-2xl sm:text-3xl md:text-4xl' : ''
                }`}
              >
                {settings.scheduleTitle || (settings.language === 'sk' ? 'Rozvrh hodín' : 'Weekly Timetable')}
              </h1>
              {settings.scheduleSubtitle && (
                <p
                  style={{
                    color: settings.accentTextColor,
                    fontSize: settings.subtitleFontSize ? `${settings.subtitleFontSize}px` : undefined,
                  }}
                  className={`font-medium mt-1 tracking-wide opacity-90 ${getFontClass(settings.subtitleFontFamily)} ${
                    !settings.subtitleFontSize ? 'text-sm sm:text-base' : ''
                  }`}
                >
                  {settings.scheduleSubtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 backdrop-blur-md shadow-2xs border border-white/40 text-slate-700">
              <span>{getLessonsCountText(lessons.length, settings.language)}</span>
              <span className="opacity-40">|</span>
              <span>{getTotalMinutesText(totalLessonMinutes, settings.language)}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ORIENTATION: HORIZONTAL (Days as columns, Times as vertical) */}
        {/* ------------------------------------------------------------- */}
        {isHorizontal ? (
          <div
            style={{
              ...timetableCardBgStyle,
              width: isCustomHorizontalDay ? `${horizontalGridWidth}px` : '100%',
              minWidth: isCustomHorizontalDay ? `${horizontalGridWidth}px` : undefined,
            }}
            className="flex flex-col backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden transition-colors"
          >
            {/* Days Header Row */}
            <div
              className="bg-white/70 border-b border-black/10 backdrop-blur-sm select-none"
              style={{
                display: 'grid',
                gridTemplateColumns: isCustomHorizontalDay
                  ? (showTimeAxis
                      ? `70px repeat(${daysCount}, ${activeDaySize}px)`
                      : `repeat(${daysCount}, ${activeDaySize}px)`)
                  : (showTimeAxis
                      ? '70px repeat(var(--days-count), 1fr)'
                      : 'repeat(var(--days-count), 1fr)'),
                width: '100%',
                '--days-count': daysCount,
              } as React.CSSProperties}
            >
              {/* Corner header - only if showTimeAxis is enabled */}
              {showTimeAxis && (
                <div className="p-3 text-center text-xs font-bold text-slate-500 border-r border-black/5 flex items-center justify-center">
                  <Clock className="w-4 h-4 opacity-70" />
                </div>
              )}

              {/* Day column headers */}
              {daysToShow.map((dayNum) => {
                const dayLessonsCount = lessons.filter((l) => l.dayOfWeek === dayNum).length;
                return (
                  <div
                    key={dayNum}
                    className="p-3 text-center border-r border-black/5 last:border-r-0"
                  >
                    <div className="font-bold text-sm sm:text-base text-slate-700">
                      {t.days[dayNum as keyof typeof t.days]}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {dayLessonsCount} {settings.language === 'sk' ? 'lek.' : 'classes'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timetable Body Grid */}
            <div
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: isCustomHorizontalDay
                  ? (showTimeAxis
                      ? `70px repeat(${daysCount}, ${activeDaySize}px)`
                      : `repeat(${daysCount}, ${activeDaySize}px)`)
                  : (showTimeAxis
                      ? '70px repeat(var(--days-count), 1fr)'
                      : 'repeat(var(--days-count), 1fr)'),
                width: '100%',
                height: `${horizontalBodyHeight}px`,
                minHeight: `${horizontalBodyHeight}px`,
                '--days-count': daysCount,
              } as React.CSSProperties}
            >
              {/* Left Time Axis - only if showTimeAxis is enabled */}
              {showTimeAxis && (
                <div className="relative border-r border-black/10 bg-white/40 select-none">
                  {timeMarkers.map((timeM) => {
                    const topPercent = ((timeM - gridStartMinutes) / totalMinutes) * 100;
                    return (
                      <div
                        key={timeM}
                        className="absolute w-full text-right pr-2 transform -translate-y-1/2"
                        style={{ top: `${topPercent}%` }}
                      >
                        <span className="text-xs font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded-sm shadow-2xs">
                          {formatAxisTime(timeM)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Day Columns */}
              {daysToShow.map((dayNum) => {
                const dayLessons = lessons.filter((l) => l.dayOfWeek === dayNum);

                return (
                  <div
                    key={dayNum}
                    className="relative border-r border-black/5 last:border-r-0 hover:bg-black/[0.015] transition-colors"
                    onDoubleClick={(e) => {
                      if (!onAddLessonAt) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const fraction = clickY / rect.height;
                      const clickedMinutes = Math.round(gridStartMinutes + fraction * totalMinutes);
                      // Round to nearest 15 mins
                      const roundedMinutes = Math.floor(clickedMinutes / 15) * 15;
                      onAddLessonAt(dayNum, roundedMinutes);
                    }}
                  >
                    {/* Hourly Horizontal Grid Guidelines */}
                    {showGridLines && timeMarkers.map((timeM) => {
                      const topPercent = ((timeM - gridStartMinutes) / totalMinutes) * 100;
                      return (
                        <div
                          key={timeM}
                          className="absolute w-full border-t border-black/10 pointer-events-none"
                          style={{ top: `${topPercent}%` }}
                        />
                      );
                    })}

                    {/* Half-hour subtle guidelines */}
                    {showGridLines && timeMarkers.map((timeM) => {
                      const halfM = timeM + 30;
                      if (halfM > gridEndMinutes) return null;
                      const topPercent = ((halfM - gridStartMinutes) / totalMinutes) * 100;
                      return (
                        <div
                          key={`half-${halfM}`}
                          className="absolute w-full border-t border-dashed border-black/5 pointer-events-none"
                          style={{ top: `${topPercent}%` }}
                        />
                      );
                    })}

                    {/* Lesson Rectangles */}
                    {dayLessons.map((lesson) => {
                      // Proportional positioning
                      const topPercent = Math.max(0, ((lesson.startMinutes - gridStartMinutes) / totalMinutes) * 100);
                      const heightPercent = Math.min(
                        100 - topPercent,
                        ((lesson.endMinutes - lesson.startMinutes) / totalMinutes) * 100
                      );

                      const style = getLessonStyle(lesson);
                      const durationMinutes = lesson.endMinutes - lesson.startMinutes;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => onEditLesson(lesson)}
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            backgroundColor: style.backgroundColor,
                            borderColor: style.borderColor,
                            color: style.textColor,
                          }}
                          className={`absolute left-1 right-1 p-2 sm:p-2.5 border shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.015] transition-all overflow-hidden flex flex-col justify-between group z-20 ${getCornerClass()}`}
                          title={`${lesson.code}: ${lesson.title} (${formatMinutes(lesson.startMinutes, settings.timeFormat)} - ${formatMinutes(lesson.endMinutes, settings.timeFormat)})`}
                        >
                          {/* Top Row: Code, Type badge on left, and Time range in top right corner */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              {settings.display.showCode && (
                                <span
                                  style={{ fontSize: getScaledSize(13) }}
                                  className="font-extrabold tracking-wide"
                                >
                                  {lesson.code}
                                </span>
                              )}
                              {settings.display.showType && (
                                <span
                                  style={{
                                    backgroundColor: style.badgeBg,
                                    fontSize: getScaledSize(10),
                                  }}
                                  className="font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                                >
                                  {lesson.type}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              {settings.display.showTime && (
                                <span
                                  style={{
                                    backgroundColor: style.badgeBg,
                                    fontSize: getScaledSize(10.5),
                                  }}
                                  className="font-bold px-1.5 py-0.5 rounded-sm tracking-tight whitespace-nowrap"
                                >
                                  {formatMinutes(lesson.startMinutes, settings.timeFormat)} – {formatMinutes(lesson.endMinutes, settings.timeFormat)}
                                </span>
                              )}
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10">
                                <Edit3 style={{ width: getScaledSize(12), height: getScaledSize(12) }} />
                              </span>
                            </div>
                          </div>

                          {/* Middle: Course Title */}
                          {settings.display.showTitle && (
                            <div className="my-auto py-0.5">
                              <p
                                style={{ fontSize: getScaledSize(12), lineHeight: 1.25 }}
                                className="font-semibold line-clamp-2"
                              >
                                {lesson.title}
                              </p>
                            </div>
                          )}

                          {/* Bottom Row: Room, Teacher, Duration */}
                          <div
                            style={{
                              color: style.subTextColor,
                              fontSize: getScaledSize(10.5),
                            }}
                            className="mt-auto pt-1 flex flex-col gap-0.5 font-medium"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              {settings.display.showRoom && lesson.room && (
                                <span className="flex items-center gap-1 font-bold">
                                  <MapPin
                                    style={{ width: getScaledSize(12), height: getScaledSize(12) }}
                                    className="opacity-75 shrink-0"
                                  />
                                  <span className="truncate max-w-[90px]">{lesson.room}</span>
                                </span>
                              )}

                              {settings.display.showDuration && (
                                <span
                                  style={{ fontSize: getScaledSize(10.5) }}
                                  className="opacity-75 font-semibold"
                                >
                                  {durationMinutes} min
                                </span>
                              )}
                            </div>

                            {settings.display.showTeacher && lesson.teacher && (
                              <div className="flex items-center gap-1 truncate opacity-90">
                                <User
                                  style={{ width: getScaledSize(12), height: getScaledSize(12) }}
                                  className="opacity-75 shrink-0"
                                />
                                <span className="truncate">{lesson.teacher}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* ORIENTATION: VERTICAL (Days as rows, Times as horizontal)     */
          /* ------------------------------------------------------------- */
          <div
            style={{
              ...timetableCardBgStyle,
              width: isCustomVerticalHour ? `${totalVerticalGridWidth}px` : '100%',
              minWidth: isCustomVerticalHour ? `${totalVerticalGridWidth}px` : undefined,
            }}
            className="flex flex-col backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden transition-colors"
          >
            {/* Top Time Ruler Header - only if showTimeAxis is enabled */}
            {showTimeAxis && (
              <div
                className="flex border-b border-black/10 bg-white/70 backdrop-blur-sm"
                style={{
                  width: isCustomVerticalHour ? `${totalVerticalGridWidth}px` : '100%',
                }}
              >
                <div className="w-36 p-3 text-xs font-bold text-slate-500 border-r border-black/5 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                  <span>{settings.language === 'sk' ? 'Deň / Čas' : 'Day / Time'}</span>
                </div>

                {/* Time Ruler across width */}
                <div
                  className="relative h-11 select-none flex-1"
                  style={
                    isCustomVerticalHour
                      ? {
                          width: `${verticalTimelineWidth}px`,
                          minWidth: `${verticalTimelineWidth}px`,
                        }
                      : { width: '100%' }
                  }
                >
                  {timeMarkers.map((timeM) => {
                    const leftPercent = ((timeM - gridStartMinutes) / totalMinutes) * 100;
                    return (
                      <div
                        key={timeM}
                        className="absolute top-2 transform -translate-x-1/2"
                        style={{ left: `${leftPercent}%` }}
                      >
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded-sm shadow-2xs">
                          {formatAxisTime(timeM)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Days as Rows */}
            <div className="divide-y divide-black/5">
              {daysToShow.map((dayNum) => {
                const dayLessons = lessons.filter((l) => l.dayOfWeek === dayNum);

                return (
                  <div
                    key={dayNum}
                    style={{
                      width: isCustomVerticalHour ? `${totalVerticalGridWidth}px` : '100%',
                      height: `${activeDaySize}px`,
                      minHeight: `${activeDaySize}px`,
                    }}
                    className="flex relative group/row hover:bg-black/[0.015] transition-colors"
                  >
                    {/* Day label on the left */}
                    <div className="w-36 p-3 sm:p-4 border-r border-black/10 bg-white/40 shrink-0 flex flex-col justify-center">
                      <span className="font-bold text-sm sm:text-base text-slate-700">
                        {t.days[dayNum as keyof typeof t.days]}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {dayLessons.length} {settings.language === 'sk' ? 'lek.' : 'classes'}
                      </span>
                    </div>

                    {/* Timeline Canvas for the Day */}
                    <div
                      className="relative h-full flex-1"
                      style={
                        isCustomVerticalHour
                          ? {
                              width: `${verticalTimelineWidth}px`,
                              minWidth: `${verticalTimelineWidth}px`,
                              height: `${activeDaySize}px`,
                            }
                          : {
                              width: '100%',
                              height: `${activeDaySize}px`,
                            }
                      }
                      onDoubleClick={(e) => {
                        if (!onAddLessonAt) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const fraction = clickX / rect.width;
                        const clickedMinutes = Math.round(gridStartMinutes + fraction * totalMinutes);
                        const roundedMinutes = Math.floor(clickedMinutes / 15) * 15;
                        onAddLessonAt(dayNum, roundedMinutes);
                      }}
                    >
                      {/* Vertical Hour Guidelines */}
                      {showGridLines && timeMarkers.map((timeM) => {
                        const leftPercent = ((timeM - gridStartMinutes) / totalMinutes) * 100;
                        return (
                          <div
                            key={timeM}
                            className="absolute h-full border-r border-black/10 pointer-events-none"
                            style={{ left: `${leftPercent}%` }}
                          />
                        );
                      })}

                      {/* Half hour tick marks */}
                      {showGridLines && timeMarkers.map((timeM) => {
                        const halfM = timeM + 30;
                        if (halfM > gridEndMinutes) return null;
                        const leftPercent = ((halfM - gridStartMinutes) / totalMinutes) * 100;
                        return (
                          <div
                            key={`vhalf-${halfM}`}
                            className="absolute h-full border-r border-dashed border-black/5 pointer-events-none"
                            style={{ left: `${leftPercent}%` }}
                          />
                        );
                      })}

                      {/* Lesson Rectangles along horizontal axis */}
                      {dayLessons.map((lesson) => {
                        const leftPercent = Math.max(0, ((lesson.startMinutes - gridStartMinutes) / totalMinutes) * 100);
                        const widthPercent = Math.min(
                          100 - leftPercent,
                          ((lesson.endMinutes - lesson.startMinutes) / totalMinutes) * 100
                        );

                        const style = getLessonStyle(lesson);
                        const durationMinutes = lesson.endMinutes - lesson.startMinutes;

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => onEditLesson(lesson)}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: style.backgroundColor,
                              borderColor: style.borderColor,
                              color: style.textColor,
                            }}
                            className={`absolute top-1.5 bottom-1.5 p-2 sm:p-2.5 border shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all overflow-hidden flex flex-col justify-between group z-20 ${getCornerClass()}`}
                            title={`${lesson.code}: ${lesson.title} (${formatMinutes(lesson.startMinutes, settings.timeFormat)} - ${formatMinutes(lesson.endMinutes, settings.timeFormat)})`}
                          >
                            {/* Top Row: Code, Type & Time range in top right corner */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 truncate min-w-0">
                                {settings.display.showCode && (
                                  <span
                                    style={{ fontSize: getScaledSize(13) }}
                                    className="font-extrabold tracking-wide"
                                  >
                                    {lesson.code}
                                  </span>
                                )}
                                {settings.display.showType && (
                                  <span
                                    style={{
                                      backgroundColor: style.badgeBg,
                                      fontSize: getScaledSize(10),
                                    }}
                                    className="font-bold px-1.5 py-0.5 rounded-sm uppercase"
                                  >
                                    {lesson.type}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-auto">
                                {settings.display.showTime && (
                                  <span
                                    style={{
                                      backgroundColor: style.badgeBg,
                                      fontSize: getScaledSize(10.5),
                                    }}
                                    className="font-bold px-1.5 py-0.5 rounded-sm tracking-tight whitespace-nowrap"
                                  >
                                    {formatMinutes(lesson.startMinutes, settings.timeFormat)} – {formatMinutes(lesson.endMinutes, settings.timeFormat)}
                                  </span>
                                )}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit3 style={{ width: getScaledSize(12), height: getScaledSize(12) }} />
                                </span>
                              </div>
                            </div>

                            {/* Title */}
                            {settings.display.showTitle && (
                              <p
                                style={{ fontSize: getScaledSize(12), lineHeight: 1.25 }}
                                className="font-semibold truncate my-0.5"
                              >
                                {lesson.title}
                              </p>
                            )}

                            {/* Details */}
                            <div
                              style={{
                                color: style.subTextColor,
                                fontSize: getScaledSize(10.5),
                              }}
                              className="flex items-center justify-between gap-1 font-medium truncate"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {settings.display.showRoom && lesson.room && (
                                  <span className="flex items-center gap-0.5 font-bold">
                                    <MapPin
                                      style={{ width: getScaledSize(12), height: getScaledSize(12) }}
                                      className="opacity-75 shrink-0"
                                    />
                                    <span>{lesson.room}</span>
                                  </span>
                                )}
                                {settings.display.showTeacher && lesson.teacher && (
                                  <span className="flex items-center gap-0.5 truncate opacity-90">
                                    <User
                                      style={{ width: getScaledSize(12), height: getScaledSize(12) }}
                                      className="opacity-75 shrink-0"
                                    />
                                    <span className="truncate">{lesson.teacher}</span>
                                  </span>
                                )}
                              </div>

                              {settings.display.showDuration && (
                                <span
                                  style={{ fontSize: getScaledSize(10.5) }}
                                  className="opacity-75 font-semibold shrink-0"
                                >
                                  {durationMinutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
