const paths = {
  add: 'M12 6v12M6 12h12',
  close: 'm7 7 10 10M17 7 7 17',
  up: 'M12 19V5m-5 5 5-5 5 5',
  down: 'M12 5v14m-5-5 5 5 5-5',
  left: 'M19 12H5m5-5-5 5 5 5',
  right: 'M5 12h14m-5-5 5 5-5 5',
  external: 'M11 13 20 4m-7 0h7v7m-2 3v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4',
  check: 'm6 12 4 4 8-8',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19',
  moon: 'M20 15a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z',
};

export function Icon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      className="ui-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
