export type Language = 'sk' | 'en';

export type Orientation = 'horizontal' | 'vertical'; 
// 'horizontal': Days as top columns (Mon-Fri), Time down vertical axis
// 'vertical': Days as left rows (Mon-Fri), Time across horizontal axis

export type TimeFormat = '24h' | '12h';

export type BackgroundType = 'color' | 'image';

export type ColorMode = 'single' | 'byType' | 'byCode' | 'individual';

export type RoundedCorners = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type FontFamily = 
  | 'inter'
  | 'jakarta'
  | 'outfit'
  | 'playfair'
  | 'jetbrains'
  | 'space'
  | 'cinzel';

export type TextSize = 'sm' | 'base' | 'lg';

export interface Lesson {
  id: string;
  code: string;           // e.g. "APA1" or "VSM"
  fullCode: string;       // e.g. "ÚINF/APA1/21"
  title: string;          // e.g. "Aproximačné a pravdepodobnostné algoritmy"
  type: string;           // e.g. "P" (Prednáška), "C" (Cvičenie), "S" (Seminár), "L" (Lab)
  teacher: string;        // e.g. "doc. RNDr. Jozef Mrkva, PhD."
  room: string;           // e.g. "SJ2P11"
  fullLocation: string;   // e.g. "SJ2P11, poschodie 2, Jesenná 5, Košice-Sever"
  dayOfWeek: number;      // 1 = Monday, 2 = Tuesday, ..., 5 = Friday, 6 = Saturday, 7 = Sunday
  startMinutes: number;   // Minutes from 00:00 (e.g., 12:35 -> 755)
  endMinutes: number;     // Minutes from 00:00 (e.g., 14:50 -> 890)
  customColor?: string;   // Override color for this specific lesson
  customOpacity?: number; // Override opacity (0 - 100)
  notes?: string;
  rawDtStart?: string;
  rawDtEnd?: string;
}

export interface DisplayOptions {
  showTitle: boolean;
  showCode: boolean;
  showType: boolean;
  showRoom: boolean;
  showTeacher: boolean;
  showTime: boolean;
  showDuration: boolean;
}

export interface TypeColorConfig {
  color: string;
  opacity: number; // 0 to 100
}

export interface TimetableSettings {
  language: Language;
  orientation: Orientation;
  timeFormat: TimeFormat;
  
  // Days and Range
  includeWeekend: boolean;
  startHourMode: 'auto' | 'custom';
  customStartMinutes: number; // e.g. 7 * 60 = 420 (07:00)
  endHourMode: 'auto' | 'custom';
  customEndMinutes: number;   // e.g. 19 * 60 = 1140 (19:00)

  // Dimension scaling (px) - defaults calculated from timetable info
  daySize?: number;              // Current active day size in px
  hourSize?: number;             // Current active hour size in px
  horizontalDayWidth?: number;   // Day column width in horizontal view (px)
  horizontalHourHeight?: number; // 1-hour height in horizontal view (px)
  verticalDayHeight?: number;    // Day row height in vertical view (px)
  verticalHourWidth?: number;    // 1-hour width in vertical view (px)

  // Title
  showScheduleTitle: boolean;
  scheduleTitle: string;
  scheduleSubtitle: string;
  titleAlignment: 'left' | 'center';
  titleFontFamily: FontFamily;
  subtitleFontFamily: FontFamily;
  titleFontSize?: number;    // Custom font size in px (e.g. 18 to 64)
  subtitleFontSize?: number; // Custom font size in px (e.g. 11 to 32)

  // Grid and Axis options
  showGridLines: boolean;
  showTimeAxis: boolean;

  // Background
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundBlur: number;      // 0 to 20 px
  backgroundBrightness: number;// 50 to 150 %
  overlayOpacity: number;      // 0 to 80 %
  overlayColor: string;
  timetableCardOpacity?: number; // 0 to 100 % (opacity of the whole timetable rectangle)

  // Rectangles styling
  roundedCorners: RoundedCorners;
  colorMode: ColorMode;
  baseFillColor: string;
  baseOpacity: number;         // 0 to 100
  typeConfigs: Record<string, TypeColorConfig>; // e.g. P: { color: '#ffffff', opacity: 90 }, C: { color: '#ffffff', opacity: 75 }
  codeColors: Record<string, string>;           // e.g. APA1: '#3b82f6', VSM: '#ec4899'
  codeOpacities: Record<string, number>;        // e.g. APA1: 85

  // Text formatting
  fontFamily: FontFamily;
  fontSize: TextSize;
  lessonFontScale?: number; // e.g. 100 = 100% (default), 90 = -10%, 110 = +10%
  textColor: string;
  accentTextColor: string;

  // Display toggles
  display: DisplayOptions;
}

export interface PresetBackground {
  id: string;
  name: { sk: string; en: string };
  url: string;
  thumbnail: string;
}
