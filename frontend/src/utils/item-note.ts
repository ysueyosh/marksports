/**
 * 商品備考（カートに入れるときにお客様が自由に記入する欄）の共通設定
 */

export type ItemNoteSetting = 'optional' | 'required' | null;

/** 文字数上限の初期値（商品で未設定の場合） */
export const ITEM_NOTE_DEFAULT_MAX_LENGTH = 200;

/** 見出しの初期値（商品で未設定の場合） */
export const ITEM_NOTE_DEFAULT_LABEL = '商品備考';

export const isItemNoteEnabled = (
  setting: string | null | undefined,
): setting is 'optional' | 'required' =>
  setting === 'optional' || setting === 'required';

export const getItemNoteLabel = (label?: string | null) =>
  label?.trim() || ITEM_NOTE_DEFAULT_LABEL;

export const getItemNoteMaxLength = (maxLength?: number | null) =>
  maxLength && maxLength > 0 ? maxLength : ITEM_NOTE_DEFAULT_MAX_LENGTH;

/**
 * 商品備考の入力エラーを返す（問題なければ null）
 */
export const getItemNoteError = (
  note: string,
  setting: string | null | undefined,
  label?: string | null,
  maxLength?: number | null,
): string | null => {
  if (!isItemNoteEnabled(setting)) return null;
  const trimmed = note.trim();
  if (setting === 'required' && !trimmed) {
    return `${getItemNoteLabel(label)}を入力してください`;
  }
  const max = getItemNoteMaxLength(maxLength);
  if (trimmed.length > max) {
    return `${getItemNoteLabel(label)}は${max}文字以内で入力してください`;
  }
  return null;
};
