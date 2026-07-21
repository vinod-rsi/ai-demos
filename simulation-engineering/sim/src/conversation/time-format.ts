/**
 * Port of Conversation.GetFormattedString: formats a duration in seconds
 * using Konverse template characters —
 *   'c'      clock format (hh:)mm:ss
 *   'H/M/S'  sentence format ("2 hours 5 minutes")
 *   'h/m/s'  single number with precision = template length ("12.5 minutes")
 */
export function formatTimeSpan(template: string, totalSeconds: number): string {
  template = template.trim();
  if (!template) return '';

  const wholeHours = Math.floor(totalSeconds / 3600);
  const wholeMinutes = Math.floor((totalSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(totalSeconds % 60);

  let mode: 'none' | 'clock' | 'sentence' | 'number' = 'none';
  let includeHours = false;
  let includeMinutes = false;
  let includeSeconds = false;
  let precision = 0;

  for (const ch of template) {
    switch (ch) {
      case 'c':
        mode = 'clock';
        break;
      case 'H':
        mode = 'sentence';
        includeHours = true;
        break;
      case 'M':
        mode = 'sentence';
        includeMinutes = true;
        break;
      case 'S':
        mode = 'sentence';
        includeSeconds = true;
        break;
      case 'h':
        mode = 'number';
        includeHours = true;
        precision = template.length;
        break;
      case 'm':
        mode = 'number';
        includeMinutes = true;
        precision = template.length;
        break;
      case 's':
        mode = 'number';
        includeSeconds = true;
        precision = template.length;
        break;
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const unit = (n: number, singular: string) => `${n} ${singular}${n === 1 ? '' : 's'}`;

  switch (mode) {
    case 'clock': {
      let out = '';
      if (wholeHours > 0) out += pad(wholeHours) + ':';
      return out + pad(wholeMinutes) + ':' + pad(wholeSeconds);
    }
    case 'sentence': {
      const parts: string[] = [];
      const hasMinutes = includeMinutes && wholeMinutes > 0;
      const hasSeconds = includeSeconds && wholeSeconds > 0;
      if (includeHours && (wholeHours > 0 || !(hasMinutes || hasSeconds))) {
        parts.push(unit(wholeHours, 'hour'));
      }
      if (includeMinutes && (wholeMinutes > 0 || parts.length === 0 || !hasSeconds)) {
        parts.push(unit(wholeMinutes, 'minute'));
      }
      if (includeSeconds && (wholeSeconds > 0 || parts.length === 0)) {
        parts.push(unit(wholeSeconds, 'second'));
      }
      return parts.join(' ');
    }
    case 'number': {
      if (includeHours) return `${(totalSeconds / 3600).toFixed(precision)} hours`;
      if (includeMinutes) return `${(totalSeconds / 60).toFixed(precision)} minutes`;
      if (includeSeconds) return `${totalSeconds.toFixed(precision)} seconds`;
      return '';
    }
    default:
      return '';
  }
}
