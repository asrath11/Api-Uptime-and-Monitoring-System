import { Card, CardContent } from '@/components/ui/card'

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone]

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export { SummaryCard }
