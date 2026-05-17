import { useMemo } from 'react'
import {
  COUNTRIES,
  GOVERNORATES_BY_COUNTRY,
  REGIONS_BY_GOVERNORATE,
  type LocationOption,
} from '../../data/iraqLocations'
import { useLocaleContext } from '../../i18n/useLocaleContext'

const selectClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20 disabled:bg-slate-50 disabled:text-slate-400'

type Props = {
  countryCode: string
  governorateId: string
  regionId: string
  onCountryChange: (code: string) => void
  onGovernorateChange: (id: string) => void
  onRegionChange: (id: string) => void
  labels: {
    country: string
    governorate: string
    region: string
    selectCountry: string
    selectGovernorate: string
    selectRegion: string
  }
  disabled?: boolean
}

function labelFor(opt: LocationOption, locale: 'ar' | 'en') {
  return locale === 'ar' ? opt.label_ar : opt.label_en
}

export function CascadingLocationFields({
  countryCode,
  governorateId,
  regionId,
  onCountryChange,
  onGovernorateChange,
  onRegionChange,
  labels,
  disabled,
}: Props) {
  const { locale } = useLocaleContext()

  const governorates = useMemo(
    () => (countryCode ? (GOVERNORATES_BY_COUNTRY[countryCode] ?? []) : []),
    [countryCode],
  )
  const regions = useMemo(() => {
    const list = governorateId ? (REGIONS_BY_GOVERNORATE[governorateId] ?? []) : []
    const other = list.filter((r) => r.id === 'other')
    const rest = list
      .filter((r) => r.id !== 'other')
      .sort((a, b) =>
        labelFor(a, locale).localeCompare(labelFor(b, locale), locale === 'ar' ? 'ar' : 'en'),
      )
    return [...rest, ...other]
  }, [governorateId, locale])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{labels.country}</span>
        <select
          value={countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className={selectClass}
          disabled={disabled}
        >
          <option value="">{labels.selectCountry}</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {labelFor(c, locale)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">{labels.governorate}</span>
        <select
          value={governorateId}
          onChange={(e) => onGovernorateChange(e.target.value)}
          className={selectClass}
          disabled={disabled || !countryCode}
        >
          <option value="">{labels.selectGovernorate}</option>
          {governorates.map((g) => (
            <option key={g.id} value={g.id}>
              {labelFor(g, locale)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">{labels.region}</span>
        <select
          value={regionId}
          onChange={(e) => onRegionChange(e.target.value)}
          className={selectClass}
          disabled={disabled || !governorateId}
        >
          <option value="">{labels.selectRegion}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {labelFor(r, locale)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
