import { Card, CardContent } from '@/components/ui/card'

function SummaryCard({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export { SummaryCard }
