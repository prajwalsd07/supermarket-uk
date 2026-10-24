const WAVES = [
  ['fill-blue-100/70', 'M0,70 C220,20 420,20 660,70 S1160,110 1440,40 V320 H0Z'],
  ['fill-sky-100', 'M0,120 C260,60 520,150 780,120 S1240,70 1440,100 V320 H0Z'],
  ['fill-blue-200/80', 'M0,160 C240,120 480,200 760,170 S1240,130 1440,160 V320 H0Z'],
]

/** Wave background shared by the login and store selection pages. */
export function LoginWaveBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] min-h-56 w-full"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {WAVES.map(([fill, d]) => <path key={fill} className={fill} d={d} />)}
    </svg>
  )
}
