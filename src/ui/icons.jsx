const Svg = ({ children, size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

export const MailIcon = p => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Svg>
export const LockIcon = p => <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>
export const EyeIcon = ({ off, ...p }) => (
  <Svg {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </Svg>
)
export const BoxIcon = p => <Svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></Svg>
export const ForkliftIcon = p => (
  <Svg {...p}>
    <path d="M3 17V9h6l3 5v3" /><path d="M9 9V5H5v4" /><path d="M16 4v13h5" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" />
  </Svg>
)
export const TruckIcon = p => (
  <Svg {...p}>
    <path d="M2 6h11v10H2zM13 10h4l4 4v2h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
  </Svg>
)
export const ArrowIcon = p => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>

export function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="#2563eb" />
      <path d="M17 7.5 9 11.8v9.4l8 4.3 8-4.3v-9.4z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 11.8 8 4.3 8-4.3M17 16.1v9.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
