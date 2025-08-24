"use client"

import { Button } from "@/components/ui/button"
import { useShowPlan } from "@/lib/hooks/use-show-plan"

type AddToPlanButtonProps = {
  id: number
  title: string
  type: 'show' | 'arrangement'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function AddToPlanButton({ id, title, type, size = 'default', className }: AddToPlanButtonProps) {
  const { addToPlan } = useShowPlan()

  return (
    <Button
      size={size}
      className={className}
      onClick={() => addToPlan({ id, title, type })}
    >
      Add to Show Plan
    </Button>
  )
}


