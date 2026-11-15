/* eslint-disable no-restricted-properties -- EP-10: user preference for chat panel size (non-sensitive). */
const STORAGE_KEY = 'dashnode.ai-assistant.panel-size.v1';

export type ChatPanelSize = {
  width: number;
  height: number;
};

export const DEFAULT_CHAT_PANEL_SIZE: ChatPanelSize = {
  width: 352,
  height: 420,
};

const MIN_WIDTH = 280;
const MIN_HEIGHT = 320;
const MAX_WIDTH_RATIO = 0.92;
const MAX_HEIGHT_RATIO = 0.85;

function clampSize(size: ChatPanelSize): ChatPanelSize {
  if (typeof window === 'undefined') return DEFAULT_CHAT_PANEL_SIZE;
  const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_RATIO);
  const maxHeight = Math.floor(window.innerHeight * MAX_HEIGHT_RATIO);
  return {
    width: Math.min(maxWidth, Math.max(MIN_WIDTH, Math.round(size.width))),
    height: Math.min(maxHeight, Math.max(MIN_HEIGHT, Math.round(size.height))),
  };
}

export function loadChatPanelSize(): ChatPanelSize {
  if (typeof window === 'undefined') return DEFAULT_CHAT_PANEL_SIZE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHAT_PANEL_SIZE;
    const parsed = JSON.parse(raw) as Partial<ChatPanelSize>;
    if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
      return DEFAULT_CHAT_PANEL_SIZE;
    }
    return clampSize({ width: parsed.width, height: parsed.height });
  } catch {
    return DEFAULT_CHAT_PANEL_SIZE;
  }
}

export function saveChatPanelSize(size: ChatPanelSize): void {
  if (typeof window === 'undefined') return;
  const clamped = clampSize(size);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
}

export function clampChatPanelSize(size: ChatPanelSize): ChatPanelSize {
  return clampSize(size);
}
