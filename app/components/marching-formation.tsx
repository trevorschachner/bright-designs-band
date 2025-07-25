"use client"

import { useEffect, useState } from "react"

interface Dot {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  originalX: number
  originalY: number
}

const formations = {
  block: (index: number, cols: number) => ({
    x: (index % cols) * 60 + 100,
    y: Math.floor(index / cols) * 60 + 100,
  }),
  circle: (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI
    const radius = 150
    return {
      x: Math.cos(angle) * radius + 400,
      y: Math.sin(angle) * radius + 300,
    }
  },
  wave: (index: number, cols: number) => ({
    x: (index % cols) * 60 + 100,
    y: Math.sin((index % cols) * 0.5) * 80 + Math.floor(index / cols) * 60 + 200,
  }),
  arrow: (index: number, cols: number) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const centerCol = Math.floor(cols / 2)
    const offset = Math.abs(col - centerCol) * 20
    return {
      x: col * 60 + 100,
      y: row * 60 + 100 + offset,
    }
  },
}

export default function MarchingFormation() {
  const [dots, setDots] = useState<Dot[]>([])
  const [currentFormation, setCurrentFormation] = useState<keyof typeof formations>("block")

  useEffect(() => {
    const cols = 12
    const rows = 6
    const totalDots = cols * rows

    const initialDots: Dot[] = Array.from({ length: totalDots }, (_, index) => {
      const pos = formations.block(index, cols)
      return {
        id: index,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        originalX: pos.x,
        originalY: pos.y,
      }
    })

    setDots(initialDots)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const formationKeys = Object.keys(formations) as (keyof typeof formations)[]
      const currentIndex = formationKeys.indexOf(currentFormation)
      const nextIndex = (currentIndex + 1) % formationKeys.length
      setCurrentFormation(formationKeys[nextIndex])
    }, 4000)

    return () => clearInterval(interval)
  }, [currentFormation])

  useEffect(() => {
    if (dots.length === 0) return

    const cols = 12
    setDots((prevDots) =>
      prevDots.map((dot, index) => {
        const newPos = formations[currentFormation](index, cols)
        return {
          ...dot,
          targetX: newPos.x,
          targetY: newPos.y,
        }
      }),
    )
  }, [currentFormation, dots.length])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
      <svg width="100%" height="100%" className="absolute inset-0">
        {dots.map((dot) => (
          <circle
            key={dot.id}
            r="3"
            fill="#F5DF4D"
            className="transition-all duration-2000 ease-in-out"
            style={{
              transform: `translate(${dot.targetX}px, ${dot.targetY}px)`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}
