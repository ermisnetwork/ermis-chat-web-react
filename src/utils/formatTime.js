import { format, getTime, formatDistanceToNow } from 'date-fns';
import dayjs from 'dayjs';

// ----------------------------------------------------------------------

export function fDate(date) {
  return format(new Date(date), 'dd MMMM yyyy');
}

export function fDateTime(date) {
  return format(new Date(date), 'dd/MM/yyyy, HH:mm');
}

export function fTimestamp(date) {
  return getTime(new Date(date));
}

export function fDateTimeSuffix(date) {
  return format(new Date(date), 'dd/MM/yyyy hh:mm p');
}

export function fToNow(date) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}

export function fTime(date) {
  return format(new Date(date), 'HH:mm');
}

export const getDisplayDate = timestamp => {
  if (!timestamp) return '';

  const now = dayjs();
  const date = dayjs(timestamp);

  // Check if it's today
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm');
  }

  // Check if it's yesterday
  if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }

  // Check if it's within the last 7 days (but not today or yesterday)
  const dayDiff = now.diff(date, 'day');
  if (dayDiff < 7) {
    return date.format('dddd'); // Returns the full day name
  }

  // Otherwise return the date in DD/MM/YYYY format
  return date.format('DD/MM/YYYY');
};
