export function SoundButton({ on, onToggle }) {
  return (
    <button
      className="snd"
      type="button"
      aria-pressed={on}
      onClick={e => {
        e.stopPropagation()
        onToggle()
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        <path className="w" d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path className="w" d="M19 6a8.5 8.5 0 0 1 0 12" />
        <path className="x" d="M16 9.5l5 5M21 9.5l-5 5" />
      </svg>
      <span>{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}

const Svg = ({ children, className = 'i', ...rest }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

export const UserIcon = p => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></Svg>
export const LockIcon = p => <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>
export const EyeIcon = p => <Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /><path className="slash-l" d="M4 4l16 16" /></Svg>
export const HeartIcon = p => <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
export const BloodIcon = p => <Svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="currentColor" /></Svg>
export const WaterIcon = p => <Svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /><path d="M9 15a3 3 0 0 0 3 3" /></Svg>
export const FoodIcon = p => <Svg {...p}><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M6 8.5h12M6 15.5h12" /></Svg>
export const TempIcon = p => <Svg {...p}><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z" /><path d="M12 10v6" /></Svg>
