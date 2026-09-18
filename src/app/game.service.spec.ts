import { classifyCapture } from './game.service';
describe('classifyCapture', () => {
  it('accepts the next number', () => expect(classifyCapture(37, 38).kind).toBe('next'));
  it('stores later numbers as hints', () => expect(classifyCapture(37, 52).kind).toBe('hint'));
  it('does not change progress for completed numbers', () =>
    expect(classifyCapture(37, 20).kind).toBe('done'));
});
