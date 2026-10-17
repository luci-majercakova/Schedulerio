import { PresetBackground, TimetableSettings } from '../types/timetable';

export const SAMPLE_ICS_DATA = `BEGIN:VCALENDAR
PRODID:-//AiS2.sk
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:11111111E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260914T081500
DTEND:20260914T093000
SUMMARY:PRAG/PRAV/01 Úvod do práva P (Rozvrhová akcia)
DESCRIPTION:Vyučujúci:JUDr. Jozef Gruľa, MBA
LOCATION:PR101\, Moyzesova 9\, Košice-Staré Mesto
RRULE:FREQ=WEEKLY;WKST=MO;UNTIL=20261214T093000;INTERVAL=1;BYDAY=MO
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:22222222E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260914T100000
DTEND:20260914T113000
SUMMARY:PRAG/PRAV/01 Úvod do práva C (Rozvrhová akcia)
LOCATION:PR102\, Moyzesova 9\, Košice-Staré Mesto
RRULE:FREQ=WEEKLY;WKST=MO;UNTIL=20261214T113000;INTERVAL=1;BYDAY=MO
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:33333333E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260915T091500
DTEND:20260915T100000
SUMMARY:CHEM/ANAC/02 Analytická chémia P (Rozvrhová akcia)
LOCATION:CH101\, Moyzesova 11\, Košice-Staré Mesto
RRULE:FREQ=WEEKLY;WKST=TU;UNTIL=20261215T100000;INTERVAL=1;BYDAY=TU
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:44444444E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260915T101500
DTEND:20260915T124500
SUMMARY:CHEM/ANAC/02 Analytická chémia C (Rozvrhová akcia)
DESCRIPTION:Vyučujúci:Múdra, PhD.
LOCATION:CHLAB\, Moyzesova 11\, Košice-Staré Mesto
RRULE:FREQ=WEEKLY;WKST=TU;UNTIL=20261215T114500;INTERVAL=1;BYDAY=TU
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:55555555E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260916T150000
DTEND:20260916T170000
SUMMARY:GEOG/FGEG/03 Fyzická geografia P (Rozvrhová akcia)
LOCATION:SCI01\, Park Angelinum 9\, Košice-Sever
RRULE:FREQ=WEEKLY;WKST=WE;UNTIL=20261216T103000;INTERVAL=1;BYDAY=WE
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:66666666E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260917T110000
DTEND:20260917T123000
SUMMARY:HIST/SVET/04 Všeobecné dejiny P (Rozvrhová akcia)
LOCATION:SJSP18\, Jesenná 5\, Košice-Sever
RRULE:FREQ=WEEKLY;WKST=TH;UNTIL=20261217T123000;INTERVAL=1;BYDAY=TH
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:77777777E7C95ED0E9B9660F6E1D3FFEC6765EA7@ais2.sk
TZID:Europe/Prague
DTSTART:20260918T090000
DTEND:20260918T103000
SUMMARY:ECON/MIKE/05 Mikroekonómia P (Rozvrhová akcia)
DESCRIPTION:Vyučujúci:prof. Veselý, Ing. Haluška
LOCATION:EC101\, Němcovej 32\, Košice-Sever
RRULE:FREQ=WEEKLY;WKST=FR;UNTIL=20261218T103000;INTERVAL=1;BYDAY=FR
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261014T143915Z
UID:88888888E7C95ED0E9B9660F6E1D3FFEC6765ED0E9B9660F6E1D3F@ais2.sk
TZID:Europe/Prague
DTSTART:20260918T110000
DTEND:20260918T123000
SUMMARY:ECON/MIKE/05 Mikroekonómia C (Rozvrhová akcia)
LOCATION:EC102\, Němcovej 32\, Košice-Sever
RRULE:FREQ=WEEKLY;WKST=FR;UNTIL=20261218T123000;INTERVAL=1;BYDAY=FR
END:VEVENT
END:VCALENDAR`;

import forestImage from './images/mila-del-monte-forest-8355748_1920.jpg';
import forestImageSmall from './images/mila-del-monte-forest-8355748_640.jpg'
import cherryBlossomImage from './images/hans-cherry-blossom-1260641_1920.jpg'
import cherryBlossomImageSmall from './images/hans-cherry-blossom-1260641_640.jpg'
import glassCeilingImage from './images/swidaalba-ceiling-8802142_1920.jpg'
import glassCeilingImageSmall from './images/swidaalba-ceiling-8802142_640.jpg'
import rustImage from './images/couleur-stole-3419985_1920.jpg'
import rustImageSmall from './images/couleur-stole-3419985_640.jpg'

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    id: 'blossom',
    name: {
      sk: 'Čerešňové kvety',
      en: 'Cherry Blossom',
    },
    url: cherryBlossomImage,
    thumbnail: cherryBlossomImageSmall,
  },
  {
    id: 'forest',
    name: {
      sk: 'Les',
      en: 'Forest',
    },
    url: forestImage,
    thumbnail: forestImageSmall,
  },
  {
    id: 'architecture',
    name: {
      sk: 'Moderná architektúra',
      en: 'Modern Architecture',
    },
    url: glassCeilingImage,
    thumbnail: glassCeilingImageSmall,
  },
  {
    id: 'rust',
    name: {
      sk: 'Hrdza',
      en: 'Rust',
    },
    url: rustImage,
    thumbnail: rustImageSmall,
  },
];

// Curated aesthetic palette for course codes
export const DEFAULT_PALETTE = [
  '#3b82f6', // Sapphire blue
  '#10b981', // Emerald green
  '#f59e0b', // Amber gold
  '#8b5cf6', // Violet
  '#ec4899', // Pink rose
  '#06b6d4', // Cyan teal
  '#f97316', // Warm orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#64748b', // Slate
];

export const INITIAL_SETTINGS: TimetableSettings = {
  language: 'sk',
  orientation: 'horizontal', // Horizontal: days as columns, times as vertical axis
  timeFormat: '24h',
  
  includeWeekend: false,
  startHourMode: 'auto',
  customStartMinutes: 7 * 60,  // 07:00
  endHourMode: 'auto',
  customEndMinutes: 19 * 60,   // 19:00

  showScheduleTitle: true,
  scheduleTitle: 'Rozvrh hodín',
  scheduleSubtitle: 'Zimný semester 2026/2027',
  titleAlignment: 'left',
  titleFontFamily: 'jakarta',
  subtitleFontFamily: 'jakarta',
  titleFontSize: 32,
  subtitleFontSize: 16,

  showGridLines: true,
  showTimeAxis: true,

  backgroundType: 'image',
  backgroundColor: '#f8fafc',
  backgroundImageUrl: PRESET_BACKGROUNDS[0].url,
  backgroundBlur: 0,
  backgroundBrightness: 100,
  overlayOpacity: 10,
  overlayColor: '#000000',
  timetableCardOpacity: 40,

  roundedCorners: 'lg',
  // Prompt requirement: "The default will be: all the same white color, different transparency on types of lessons."
  colorMode: 'byType', 
  baseFillColor: '#ffffff',
  baseOpacity: 88,
  
  // Default type config: white color with differing transparency for types (P vs C vs S vs L)
  typeConfigs: {
    P: { color: '#ffffff', opacity: 92 }, // Prednáška
    C: { color: '#ffffff', opacity: 78 }, // Cvičenie
    S: { color: '#ffffff', opacity: 85 }, // Seminár
    L: { color: '#ffffff', opacity: 82 }, // Laboratórium
  },

  codeColors: {
    MIKE: '#ec4899',
    FGEG: '#3b82f6',
    PRAV: '#10b981',
  },
  codeOpacities: {
    MIKE: 88,
    FGEG: 88,
    PRAV: 88,
  },

  fontFamily: 'jakarta',
  fontSize: 'base',
  lessonFontScale: 100,
  textColor: '#0f172a',
  accentTextColor: '#475569',

  display: {
    showTitle: true,
    showCode: true,
    showType: true,
    showRoom: true,
    showTeacher: true,
    showTime: true,
    showDuration: true,
  },
};
