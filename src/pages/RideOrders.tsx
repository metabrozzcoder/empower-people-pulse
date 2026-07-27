import RideOrdersPanel from '@/components/RideOrdersPanel'
import { useTranslation } from 'react-i18next'

export default function RideOrders() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('pages.rideOrders.title')}</h1>
        <p className="text-muted-foreground">{t('pages.rideOrders.subtitle')}</p>
      </div>
      <RideOrdersPanel />
    </div>
  )
}
