import { cn } from '@/lib/utils'
import { formatPiece, piecesToCredit, type PublicPiece } from '@/lib/pieces/credits'

/** "Features music from…" line under a part. Renders nothing when there's nothing new to say. */
export function SourcePieces({
  part,
  pieces,
  className,
}: {
  part: { title: string | null; composer: string | null }
  pieces: readonly PublicPiece[] | undefined
  className?: string
}) {
  const credited = piecesToCredit(part, pieces ?? [])
  if (credited.length === 0) return null

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      <span className="font-medium text-foreground">Features music from:</span>{' '}
      {credited.map(formatPiece).join(', ')}
    </p>
  )
}
