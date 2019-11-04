import ms from 'ms';

export function seconds(val: string | number): number {
  if (typeof val === 'string') {
    return Math.floor(ms(val) / 1000);
  }
  return val;
}

export function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
