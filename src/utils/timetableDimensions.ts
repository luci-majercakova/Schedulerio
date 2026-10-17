import { Lesson, TimetableSettings } from '../types/timetable';

export interface CalculatedDimensions {
  gridStartMinutes: number;
  gridEndMinutes: number;
  totalMinutes: number;
  totalHours: number;
  daysCount: number;
  daysToShow: number[];

  // Default calculated sizes based on timetable information
  defaultHorizontalDayWidth: number;   // column width in px
  defaultHorizontalHourHeight: number; // 1-hour height in px
  defaultVerticalDayHeight: number;    // row height in px
  defaultVerticalHourWidth: number;    // 1-hour width in px

  // Active resolved dimensions for current orientation
  activeDaySize: number;
  activeHourSize: number;
}

/**
 * Calculates timetable grid bounds and default sizes derived from timetable lessons and settings.
 */
export function calculateTimetableDimensions(
  lessons: Lesson[],
  settings: TimetableSettings
): CalculatedDimensions {
  // 1. Determine active days (Mon-Fri or include weekend)
  const hasWeekend = lessons.some((l) => l.dayOfWeek === 6 || l.dayOfWeek === 7);
  const showWeekend = settings.includeWeekend || hasWeekend;
  const daysToShow = showWeekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
  const daysCount = daysToShow.length;

  // 2. Determine Time bounds across current lessons
  let earliestLecture = 8 * 60; // 08:00 default
  let latestLecture = 18 * 60;  // 18:00 default
  if (lessons.length > 0) {
    earliestLecture = Math.min(...lessons.map((l) => l.startMinutes));
    latestLecture = Math.max(...lessons.map((l) => l.endMinutes));
  }

  // 3. Grid start time
  let gridStartMinutes = earliestLecture;
  if (settings.startHourMode === 'custom') {
    gridStartMinutes = Math.min(settings.customStartMinutes, earliestLecture);
  } else {
    gridStartMinutes = Math.floor(earliestLecture / 30) * 30;
  }

  // 4. Grid end time
  let gridEndMinutes = latestLecture;
  if (settings.endHourMode === 'custom') {
    gridEndMinutes = Math.max(settings.customEndMinutes, latestLecture);
  } else {
    gridEndMinutes = Math.ceil(latestLecture / 30) * 30;
  }

  // Ensure minimum range of 3 hours
  if (gridEndMinutes - gridStartMinutes < 180) {
    gridEndMinutes = gridStartMinutes + 180;
  }

  const totalMinutes = gridEndMinutes - gridStartMinutes;
  const totalHours = Math.max(1, totalMinutes / 60);

  // 5. Default calculated sizes based on timetable information
  // Standard timetable width inside the main container (max-w-7xl [1280px] minus paddings [48px + 64px] = ~1170px)
  const STANDARD_TIMETABLE_WIDTH = 1170;

  // Horizontal view:
  // Height per hour: derived from the standard 620px grid body height
  const defaultHorizontalHourHeight = Math.max(40, Math.round(620 / totalHours));
  // Day column width: derived from full timetable width minus time axis (70px) divided by daysCount
  const defaultAvailableDaysWidth = STANDARD_TIMETABLE_WIDTH - (settings.showTimeAxis !== false ? 70 : 0);
  const defaultHorizontalDayWidth = Math.max(120, Math.round(defaultAvailableDaysWidth / daysCount));

  // Vertical view:
  // Day row height: default 96px
  const defaultVerticalDayHeight = 96;
  // Hour width: derived from full timetable width minus day label column (144px) divided by totalHours
  const defaultAvailableTimelineWidth = STANDARD_TIMETABLE_WIDTH - 144;
  const defaultVerticalHourWidth = Math.max(55, Math.round(defaultAvailableTimelineWidth / totalHours));

  // 6. Active resolved dimensions based on orientation
  const isHorizontal = settings.orientation === 'horizontal';

  const activeDaySize = isHorizontal
    ? (settings.horizontalDayWidth ?? settings.daySize ?? defaultHorizontalDayWidth)
    : (settings.verticalDayHeight ?? settings.daySize ?? defaultVerticalDayHeight);

  const activeHourSize = isHorizontal
    ? (settings.horizontalHourHeight ?? settings.hourSize ?? defaultHorizontalHourHeight)
    : (settings.verticalHourWidth ?? settings.hourSize ?? defaultVerticalHourWidth);

  return {
    gridStartMinutes,
    gridEndMinutes,
    totalMinutes,
    totalHours,
    daysCount,
    daysToShow,
    defaultHorizontalDayWidth,
    defaultHorizontalHourHeight,
    defaultVerticalDayHeight,
    defaultVerticalHourWidth,
    activeDaySize,
    activeHourSize,
  };
}
