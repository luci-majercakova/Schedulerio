import { Lesson } from '../types/timetable';

/**
 * Unfolds RFC 5545 iCalendar lines where lines are wrapped with CRLF + space/tab.
 */
export function unfoldIcs(rawText: string): string {
  // Normalize line endings to \n
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Unfold lines that start with space or tab
  text = text.replace(/\n[ \t]/g, '');
  return text;
}

/**
 * Parses time string like "20260918T123500" or "20260918T123500Z"
 */
function parseIcsDateTime(dtStr: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  minutesFromMidnight: number;
  dayOfWeek: number;
} | null {
  // Matches YYYYMMDDTHHMMSS
  const match = dtStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);

  // JavaScript Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dateObj = new Date(year, month - 1, day);
  let dow = dateObj.getDay();
  // Map to 1 = Mon ... 7 = Sun
  const mappedDow = dow === 0 ? 7 : dow;

  return {
    year,
    month,
    day,
    hour,
    minute,
    minutesFromMidnight: hour * 60 + minute,
    dayOfWeek: mappedDow,
  };
}

const BYDAY_MAP: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};


/**
 * Maps a lesson type name or string to a single letter code.
 * Specific requirement: "Cvičenie laboratórne" should be mapped to "C".
 * "Prednáška" -> "P", "Cvičenie" -> "C", "Seminár" -> "S", "Laboratórium" -> "L", etc.
 */
export function mapLessonType(typeStr: string): string {
  if (!typeStr) return 'P';
  const clean = typeStr.trim().toLowerCase();

  // "Cvičenie laboratórne" or "Laboratórne cvičenie" -> explicitly mapped to 'C'
  if (
    (clean.includes('cvičen') && clean.includes('laborat')) ||
    (clean.includes('cvicen') && clean.includes('laborat')) ||
    clean === 'cl' ||
    clean === 'c-l' ||
    clean === 'lc'
  ) {
    return 'C';
  }

  // Prednáška / Lecture
  if (
    clean.startsWith('predn') ||
    clean.startsWith('lect') ||
    clean === 'p' ||
    clean === 'pr'
  ) {
    return 'P';
  }

  // Cvičenie / Practice / Exercise
  if (
    clean.startsWith('cvič') ||
    clean.startsWith('cvic') ||
    clean.startsWith('pract') ||
    clean.startsWith('exer') ||
    clean === 'c' ||
    clean === 'cv'
  ) {
    return 'C';
  }

  // Seminár / Seminar
  if (
    clean.startsWith('semin') ||
    clean.startsWith('sem') ||
    clean === 's'
  ) {
    return 'S';
  }

  // Laboratórium / Lab (pure laboratory)
  if (
    clean.startsWith('laborat') ||
    clean.startsWith('lab') ||
    clean === 'l'
  ) {
    return 'L';
  }

  // Konzultácia / Consultation
  if (clean.startsWith('konz') || clean.startsWith('cons') || clean === 'k') {
    return 'K';
  }

  // Skúška / Zápočet
  if (clean.startsWith('skúš') || clean.startsWith('skus') || clean.startsWith('exam')) {
    return 'SK';
  }
  if (clean.startsWith('záp') || clean.startsWith('zap')) {
    return 'Z';
  }

  // Short 1-2 char code (e.g. "P", "C", "S", "L")
  if (clean.length <= 2) {
    return clean.toUpperCase();
  }

  // Fallback: use first letter in uppercase
  return typeStr.trim().charAt(0).toUpperCase();
}

/**
 * Parses a full .ics or .txt schedule into an array of Lesson objects
 */
export function parseIcsContent(content: string): Lesson[] {
  const unfolded = unfoldIcs(content);
  const events: Lesson[] = [];

  // Match all VEVENT blocks
  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
  let match: RegExpExecArray | null;

  let eventCounter = 1;

  while ((match = veventRegex.exec(unfolded)) !== null) {
    const block = match[1];

    // Extract raw fields
    const getField = (fieldName: string): string => {
      // Handles both FIELD:VALUE and FIELD;PARAM=VAL:VALUE
      const reg = new RegExp(`(?:^|\\n)${fieldName}(?:;[^:]*)?:(.*)(?:\\r?\\n|$)`, 'i');
      const res = reg.exec(block);
      return res ? res[1].trim() : '';
    };

    const uid = getField('UID') || `lesson-${eventCounter++}-${Date.now()}`;
    const dtStartRaw = getField('DTSTART');
    const dtEndRaw = getField('DTEND');
    const summaryRaw = getField('SUMMARY');
    const locationRaw = getField('LOCATION');
    const rruleRaw = getField('RRULE');
    const descriptionRaw = getField('DESCRIPTION');
    const categoriesRaw = getField('CATEGORIES');

    const dtStartParsed = parseIcsDateTime(dtStartRaw);
    const dtEndParsed = parseIcsDateTime(dtEndRaw);

    if (!dtStartParsed || !dtEndParsed) {
      // Skip invalid events without start or end times
      continue;
    }

    // Determine Day of Week:
    let dayOfWeek = dtStartParsed.dayOfWeek;
    const byDayMatch = rruleRaw.match(/BYDAY=([A-Z]{2})/i);
    if (byDayMatch && BYDAY_MAP[byDayMatch[1].toUpperCase()]) {
      dayOfWeek = BYDAY_MAP[byDayMatch[1].toUpperCase()];
    }

    // Clean location (unescape \,)
    const cleanLocation = locationRaw.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

    // Extract room:
    // If room code is in brackets at the end (e.g. "Letná 9, poslucháreň B520 (L9-B_519)" -> "L9-B_519", "Němcovej 32, laboratórium PC 208 (BN32_208)" -> "BN32_208")
    // Otherwise fallback to first comma-separated segment (e.g. "SA1C05, Park Angelinum 9" -> "SA1C05")
    let room = '';
    const endBracketRoomMatch = cleanLocation.match(/\(([^)]+)\)[\s.]*$/);
    if (endBracketRoomMatch) {
      room = endBracketRoomMatch[1].trim();
    } else {
      const anyBracket = cleanLocation.match(/\(([^)]+)\)/);
      if (anyBracket && !/online|dištančne|teams|zoom/i.test(anyBracket[1])) {
        room = anyBracket[1].trim();
      } else {
        const locationParts = cleanLocation.split(',').map((s) => s.trim()).filter(Boolean);
        room = locationParts[0] || '';
      }
    }

    // Parse SUMMARY into: code, title, type
    // Handles formats:
    // 1. TUKE / MAIS format:
    //    "Ekonomické informačné systémy (35000077) - Prednáška"
    //    "Ekonomické informačné systémy (35000077) - Cvičenie laboratórne"
    //    "Ekonomické informačné systémy (35000077)"
    // 2. AiS2 format:
    //    "ÚINF/APA1/21 Aproximačné a pravdepodobnostné algoritmy P (Rozvrhová akcia)"
    //    "ÚMV/VSM/10 Výpočtové  a simulačné metódy C (Rozvrhová akcia)"
    // 3. Simple / generic format:
    //    "MST/01 Matematické štruktúry P"
    //    "MAT1 Matematická analýza 1 P"
    //    "Fyzika I - Prednáška"
    let fullCode = '';
    let code = '';
    let title = summaryRaw;
    let type = 'P'; // default lecture

    // Clean "(Rozvrhová akcia)" or "(Timetable action)"
    let workingSummary = summaryRaw
      .replace(/\s*\((?:Rozvrhová akcia|Rozvrhová udalosť|Timetable event|Schedule event|Action)\)\s*$/i, '')
      .trim();

    // Check for slash-code prefix: e.g. "ÚINF/APA1/21 Aproximačné a pravdepodobnostné algoritmy P"
    const slashCodeMatch = workingSummary.match(/^([A-ZÁ-Ž0-9_-]+(?:\/[A-ZÁ-Ž0-9_-]+){1,2})\s+(.*)$/i);

    // Check for course code in parentheses:
    // e.g. "Ekonomické informačné systémy (35000077) - Prednáška"
    // or "Ekonomické informačné systémy (35000077) - Cvičenie laboratórne"
    const bracketCodeWithDashMatch = workingSummary.match(
      /^(.+?)\s*\(([\w\d_-]+)\)\s*[-–—:]\s*(.+)$/i
    );
    const bracketCodeWithoutDashMatch = workingSummary.match(
      /^(.+?)\s*\(([\w\d_-]+)\)(?:\s+(.+))?$/i
    );

    if (slashCodeMatch) {
      fullCode = slashCodeMatch[1];
      const segments = fullCode.split('/');
      if (segments.length === 3) {
        code = segments[1];
      } else if (segments.length === 2) {
        code = segments[1];
      } else {
        code = segments[0];
      }
      workingSummary = slashCodeMatch[2].trim();

      // Extract type from end of remaining summary
      const typeMatch = workingSummary.match(
        /(?:[-–—:]\s*|\s+)(Cvičenie\s+laboratórne|Cvicenie\s+laboratorne|Laboratórne\s+cvičenie|Laboratorne\s+cvicenie|Prednáška|Prednaska|Cvičenie|Cvicenie|Seminár|Seminar|Laboratórium|Laboratorium|Konzultácia|Konzultacia|Lecture|Practice|Lab|Sem|[PCSLK])\s*$/i
      );
      if (typeMatch) {
        type = mapLessonType(typeMatch[1]);
        title = workingSummary.substring(0, workingSummary.length - typeMatch[0].length).trim();
      } else {
        title = workingSummary;
        if (categoriesRaw) {
          type = mapLessonType(categoriesRaw);
        }
      }
    } else if (bracketCodeWithDashMatch) {
      title = bracketCodeWithDashMatch[1].trim();
      code = bracketCodeWithDashMatch[2].trim();
      fullCode = code;
      const rawType = bracketCodeWithDashMatch[3].trim();
      type = mapLessonType(rawType);
    } else if (bracketCodeWithoutDashMatch) {
      title = bracketCodeWithoutDashMatch[1].trim();
      code = bracketCodeWithoutDashMatch[2].trim();
      fullCode = code;
      if (bracketCodeWithoutDashMatch[3]) {
        type = mapLessonType(bracketCodeWithoutDashMatch[3].trim());
      } else if (categoriesRaw) {
        type = mapLessonType(categoriesRaw);
      }
    } else {
      // Standalone code prefix: e.g. "MAT1 " or "35000077 - " or "MST "
      const codePrefixMatch = workingSummary.match(/^([A-Z0-9_-]{2,12})\s*[-–—:]?\s+(.*)$/);
      if (codePrefixMatch) {
        code = codePrefixMatch[1];
        fullCode = code;
        workingSummary = codePrefixMatch[2].trim();
      }

      // Check for type at end: e.g. " - Prednáška", " - Cvičenie laboratórne", " P", " C"
      const typeMatch = workingSummary.match(
        /(?:[-–—:]\s*|\s+)(Cvičenie\s+laboratórne|Cvicenie\s+laboratorne|Laboratórne\s+cvičenie|Laboratorne\s+cvicenie|Prednáška|Prednaska|Cvičenie|Cvicenie|Seminár|Seminar|Laboratórium|Laboratorium|Konzultácia|Konzultacia|Lecture|Practice|Lab|Sem|[PCSLK])\s*$/i
      );
      if (typeMatch) {
        type = mapLessonType(typeMatch[1]);
        title = workingSummary.substring(0, workingSummary.length - typeMatch[0].length).trim();
      } else {
        title = workingSummary;
        if (categoriesRaw) {
          type = mapLessonType(categoriesRaw);
        }
      }
    }

    // Clean multiple whitespace from title
    title = title.replace(/\s+/g, ' ').trim();

    // If no explicit code extracted, fallback to first letters of title words
    if (!code) {
      code =
        title
          .split(' ')
          .filter(Boolean)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 5) || 'SUBJ';
      fullCode = code;
    }

    // Teacher extraction from description or location
    let teacher = '';
    const cleanDesc = descriptionRaw.replace(/\\n/g, '\n').replace(/\\,/g, ',');
    const teacherMatch = cleanDesc.match(/(?:Vyučujúci|Teacher|Lecturer|Instructor|Profesor|Docent):\s*([^\n;]+)/i);
    if (teacherMatch) {
      teacher = teacherMatch[1].trim();
    } else if (cleanDesc) {
      // Check for academic titles (e.g. Ing., doc., prof., Mgr.)
      const titleTeacherMatch = cleanDesc.match(/((?:prof\.|doc\.|Ing\.|Mgr\.|RNDr\.|JUDr\.|MUDr\.|PaedDr\.|PhDr\.)[^\n;]+)/i);
      if (titleTeacherMatch) {
        teacher = titleTeacherMatch[1].trim();
      }
    }

    events.push({
      id: uid,
      code,
      fullCode: fullCode || code,
      title,
      type,
      teacher,
      room,
      fullLocation: cleanLocation,
      dayOfWeek,
      startMinutes: dtStartParsed.minutesFromMidnight,
      endMinutes: dtEndParsed.minutesFromMidnight,
      rawDtStart: dtStartRaw,
      rawDtEnd: dtEndRaw,
      notes: cleanDesc || undefined,
    });
  }

  // Sort by dayOfWeek then by startMinutes
  events.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startMinutes - b.startMinutes;
  });

  return events;
}

/**
 * Converts minutes from midnight (e.g. 755) to "12:35" or "12:35 PM"
 */
export function formatMinutes(minutes: number, format: '24h' | '12h' = '24h'): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;

  if (format === '24h') {
    const hh = h < 10 ? `0${h}` : `${h}`;
    return `${hh}:${mm}`;
  }

  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${period}`;
}

/**
 * Parses "12:35" into minutes from midnight (755)
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Exports modified lessons back to a valid .ics calendar file
 */
export function exportLessonsToIcs(lessons: Lesson[], calendarName = 'Rozvrh'): string {
  const now = new Date();
  const formatUtc = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  const stamp = formatUtc(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rozvrhovac//Aesthetic Timetable Designer//SK',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarName}`,
  ];

  // Base date for recurring weekly events: calculate upcoming Monday
  const baseMonday = new Date();
  const dayOffset = (baseMonday.getDay() + 6) % 7; // days since last Monday
  baseMonday.setDate(baseMonday.getDate() - dayOffset);

  const DOW_TO_BYDAY: Record<number, string> = {
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
    7: 'SU',
  };

  for (const lesson of lessons) {
    const evDate = new Date(baseMonday);
    evDate.setDate(baseMonday.getDate() + (lesson.dayOfWeek - 1));

    const startH = Math.floor(lesson.startMinutes / 60);
    const startM = lesson.startMinutes % 60;
    const endH = Math.floor(lesson.endMinutes / 60);
    const endM = lesson.endMinutes % 60;

    const y = evDate.getFullYear();
    const mo = String(evDate.getMonth() + 1).padStart(2, '0');
    const da = String(evDate.getDate()).padStart(2, '0');

    const dtStart = `${y}${mo}${da}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const dtEnd = `${y}${mo}${da}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;
    const byday = DOW_TO_BYDAY[lesson.dayOfWeek] || 'MO';

    const summary = `${lesson.fullCode || lesson.code} ${lesson.title} ${lesson.type} (Rozvrhová akcia)`;
    const location = lesson.fullLocation || lesson.room;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${lesson.id}@rozvrhovac.local`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${summary}`);
    if (location) lines.push(`LOCATION:${location}`);
    if (lesson.teacher) lines.push(`DESCRIPTION:Vyučujúci: ${lesson.teacher}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byday}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
