import { useState, type InputHTMLAttributes } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.042 5.284 7 9.066 7 1.573 0 3.066-.39 4.396-1.08M6.228 6.228A10.45 10.45 0 0 1 12 5c4.638 0 8.573 3.007 9.963 7.178.384 1.153.384 2.38 0 3.357M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PasswordInput({ className = '', value, onChange, ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  const { messages } = useLocaleContext()
  const m = messages.form

  return (
    <div className="relative" dir="ltr">
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        dir="ltr"
        className={`password-input-field ${className} !pr-10`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-urgen-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-urgen-purple/30"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? m.hidePassword : m.showPassword}
        aria-pressed={visible}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </div>
  )
}
