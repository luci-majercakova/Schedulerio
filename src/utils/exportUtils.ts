import { toPng } from 'html-to-image';
import { Lesson, TimetableSettings } from '../types/timetable';
import { exportLessonsToIcs } from './icsParser';

export interface TimetableProjectData {
  version: number;
  type: 'timetable_project_backup';
  exportedAt: string;
  lessons: Lesson[];
  settings: TimetableSettings;
}

/**
 * Downloads an HTMLElement as a crisp PNG file
 */
export async function downloadTimetableImage(
  element: HTMLElement,
  filename = 'moj-rozvrh.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5, // Crisp 2.5x retina resolution for wallpapers and print
      cacheBust: true,
      skipAutoScale: false,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export timetable image:', error);
    throw error;
  }
}

/**
 * Downloads current lessons as a valid .ics calendar file
 */
export function downloadTimetableIcs(
  lessons: Lesson[],
  filename = 'rozvrh.ics',
  calendarName = 'Rozvrh'
): void {
  const icsContent = exportLessonsToIcs(lessons, calendarName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Exports all timetable information (all lessons, user-added lessons, all settings) to a JSON file.
 * As requested: "All the settings, just not the picture if user uploaded that."
 */
export function downloadTimetableProjectJson(
  lessons: Lesson[],
  settings: TimetableSettings,
  filename = 'rozvrh-projekt.json'
): void {
  const cleanSettings: TimetableSettings = { ...settings };

  // If user uploaded a custom picture (data URL or blob), omit it per requirement
  const isCustomUploaded =
    cleanSettings.backgroundImageUrl?.startsWith('data:') ||
    cleanSettings.backgroundImageUrl?.startsWith('blob:');

  if (isCustomUploaded) {
    cleanSettings.backgroundImageUrl = '';
    cleanSettings.backgroundType = 'color';
  }

  const projectData: TimetableProjectData = {
    version: 1,
    type: 'timetable_project_backup',
    exportedAt: new Date().toISOString(),
    lessons,
    settings: cleanSettings,
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
