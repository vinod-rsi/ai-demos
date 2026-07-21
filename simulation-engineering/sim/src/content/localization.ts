import type { LocalizationSource } from './types';

/**
 * Mirrors ADataElement.GetLocalizedString: text fields resolve
 * "<localization_guid>_<field>" in the localization source, falling back to
 * the inline JSON value.
 */
export class Localization {
  constructor(private source: LocalizationSource = {}) {}

  resolve(guid: string | undefined, field: string, inlineValue: string | undefined): string {
    if (guid) {
      const key = `${guid}_${field}`;
      const localized = this.source[key];
      if (localized !== undefined) return localized;
    }
    return inlineValue ?? '';
  }

  has(guid: string | undefined, field: string): boolean {
    return guid !== undefined && `${guid}_${field}` in this.source;
  }
}
