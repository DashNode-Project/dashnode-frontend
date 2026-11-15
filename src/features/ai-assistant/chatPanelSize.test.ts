/* eslint-disable no-restricted-properties -- tests for chat panel size persistence. */
import { describe, expect, it } from 'vitest';
import {
  clampChatPanelSize,
  DEFAULT_CHAT_PANEL_SIZE,
  loadChatPanelSize,
  saveChatPanelSize,
} from './chatPanelSize';

describe('chatPanelSize', () => {
  it('loads defaults when storage is empty', () => {
    window.localStorage.removeItem('dashnode.ai-assistant.panel-size.v1');
    expect(loadChatPanelSize()).toEqual(DEFAULT_CHAT_PANEL_SIZE);
  });

  it('persists and clamps invalid sizes', () => {
    saveChatPanelSize({ width: 40, height: 40 });
    const loaded = loadChatPanelSize();
    expect(loaded.width).toBeGreaterThanOrEqual(280);
    expect(loaded.height).toBeGreaterThanOrEqual(320);
    expect(clampChatPanelSize({ width: 9999, height: 9999 }).width).toBeLessThanOrEqual(
      Math.floor(window.innerWidth * 0.92),
    );
  });
});
