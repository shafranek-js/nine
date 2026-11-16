import { describe, expect, it } from 'vitest';
import {
  getHdAnteIntroState,
  getHdBotBrokeMode,
  getHdBotCardThrowState,
  getHdBotPurseTossMode,
  getHdDealerGlanceMode,
  getHdDealingStepState,
  getHdIntroTrumpetProgress,
  HD_BOT_BROKE_SHAKE_DURATION_MS,
  HD_BOT_PURSE_COIN_RELEASE_MS,
  HD_BOT_PURSE_TOSS_TOTAL_MS,
  HD_DEAL_STEP_MS,
  HD_INTRO_DURATION_MS,
  HD_INTRO_LOWER_START_MS,
  HD_INTRO_RAISE_MS,
} from '../src/engine/hdAnimations';

describe('hdAnimations EGA-parity timelines', () => {
  it('follows EGA raise -> sustain cheek-puff -> lower choreography in IntroScene', () => {
    expect(getHdIntroTrumpetProgress(0)).toBe(0);
    expect(getHdIntroTrumpetProgress(HD_INTRO_RAISE_MS / 2)).toBeCloseTo(0.5, 4);
    expect(getHdIntroTrumpetProgress(HD_INTRO_RAISE_MS)).toBeGreaterThanOrEqual(0.72);

    // During sustain band (520..15280ms), stays in upper blowing range instead of resetting to 0
    for (let ms = HD_INTRO_RAISE_MS; ms < HD_INTRO_LOWER_START_MS; ms += 320) {
      const p = getHdIntroTrumpetProgress(ms);
      expect(p).toBeGreaterThanOrEqual(0.70);
      expect(p).toBeLessThanOrEqual(1.0);
    }

    expect(getHdIntroTrumpetProgress(HD_INTRO_DURATION_MS)).toBe(0);
  });

  it('orders HD ante sequentially (dealer opens hat, left -> right -> human)', () => {
    const start = getHdAnteIntroState(50);
    expect(start.dealerHatOpen).toBe(true);
    expect(start.leftMode).toBe('idle');
    expect(start.rightMode).toBe('idle');

    const leftReach = getHdAnteIntroState(start.leftStartMs + 50);
    expect(leftReach.leftMode).toBe('purseReach');
    expect(leftReach.rightMode).toBe('idle');

    const leftOpen = getHdAnteIntroState(start.leftStartMs + HD_BOT_PURSE_COIN_RELEASE_MS);
    expect(leftOpen.leftMode).toBe('purseOpen');

    const rightOpen = getHdAnteIntroState(start.rightStartMs + 250);
    expect(rightOpen.leftMode).toBe('idle');
    expect(rightOpen.rightMode).toBe('purseOpen');

    const closing = getHdAnteIntroState(start.endMs - 450);
    expect(closing.dealerHatOpen).toBe(false);
    expect(closing.dealerHatProgress).toBeGreaterThan(0);

    const settled = getHdAnteIntroState(start.endMs + 20);
    expect(settled.dealerHatOpen).toBe(false);
    expect(settled.leftMode).toBe('idle');
    expect(settled.rightMode).toBe('idle');
  });

  it('matches broke empty-purse shake -> shrug -> settle timeline', () => {
    expect(getHdBotBrokeMode(100)).toBe('brokeShake');
    expect(getHdBotBrokeMode(HD_BOT_BROKE_SHAKE_DURATION_MS * 0.78)).toBe('brokeShrug');
    expect(getHdBotBrokeMode(HD_BOT_BROKE_SHAKE_DURATION_MS + 10)).toBe('idle');
    expect(getHdBotPurseTossMode(HD_BOT_PURSE_TOSS_TOTAL_MS - 40)).toBe('purseClose');
  });

  it('synchronizes card pickup before flight release for bot throws', () => {
    const reach = getHdBotCardThrowState(0.15);
    expect(reach.cardPickedFromStack).toBe(false);
    expect(reach.cardReleased).toBe(false);
    expect(reach.flyProgress).toBe(0);

    const grab = getHdBotCardThrowState(0.35);
    expect(grab.cardPickedFromStack).toBe(true);
    expect(grab.cardReleased).toBe(false);

    const throwMid = getHdBotCardThrowState(0.72);
    expect(throwMid.cardPickedFromStack).toBe(true);
    expect(throwMid.cardReleased).toBe(true);
    expect(throwMid.flyProgress).toBeCloseTo((0.72 - 0.45) / 0.55, 4);
  });

  it('deals 36 and 52 cards clockwise one-by-one with matching dealer direction', () => {
    const step0 = getHdDealingStepState(0, 36, HD_DEAL_STEP_MS);
    expect(step0.dealerPose).toBe('dealLeft');
    expect(step0.dealtCounts).toEqual({ 1: 1, 2: 0, 3: 0 });
    expect(step0.finished).toBe(false);

    const step1 = getHdDealingStepState(HD_DEAL_STEP_MS, 36, HD_DEAL_STEP_MS);
    expect(step1.dealerPose).toBe('dealRight');
    expect(step1.dealtCounts).toEqual({ 1: 1, 2: 1, 3: 0 });

    const step2 = getHdDealingStepState(HD_DEAL_STEP_MS * 2, 36, HD_DEAL_STEP_MS);
    expect(step2.dealerPose).toBe('dealDown');
    expect(step2.dealtCounts).toEqual({ 1: 1, 2: 1, 3: 1 });

    const done36 = getHdDealingStepState(HD_DEAL_STEP_MS * 36, 36, HD_DEAL_STEP_MS);
    expect(done36.finished).toBe(true);
    expect(done36.dealtCounts).toEqual({ 1: 12, 2: 12, 3: 12 });

    const done52 = getHdDealingStepState(HD_DEAL_STEP_MS * 52, 52, HD_DEAL_STEP_MS);
    expect(done52.finished).toBe(true);
    expect(done52.dealtCounts).toEqual({ 1: 18, 2: 17, 3: 17 });
  });

  it('mirrors EGA 6.5s..8.5s dealer left/right glance windows', () => {
    expect(getHdDealerGlanceMode(200)).toBe('glanceLeft');
    expect(getHdDealerGlanceMode(800)).toBe('idle');
    expect(getHdDealerGlanceMode(1200)).toBe('glanceRight');
    expect(getHdDealerGlanceMode(1800)).toBe('idle');
  });
});
