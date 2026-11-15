import { useI18n } from '../../i18n'

interface SimpleViewToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function SimpleViewToggle({ enabled, onToggle }: SimpleViewToggleProps) {
  const { t } = useI18n()
  return (
    <button type="button" className="secondary-btn" aria-pressed={enabled} data-testid="simple-view-toggle" onClick={onToggle}>
      {t('scene.simpleView')} · {t(enabled ? 'scene.viewOn' : 'scene.viewOff')}
    </button>
  )
}
