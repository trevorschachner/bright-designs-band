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
  pathProgress: number
}

interface PathPoint {
  x: number
  y: number
}

// Generate curved path between two points
const generateCurvedPath = (start: PathPoint, end: PathPoint, curvature: number = 0.3): string => {
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  
  // Calculate perpendicular offset for curve
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Create curve control points
  const offsetX = -dy * curvature * (distance / 200)
  const offsetY = dx * curvature * (distance / 200)
  
  const controlX = midX + offsetX
  const controlY = midY + offsetY
  
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
}

// Get point along curved path at given progress (0-1)
const getPointOnCurve = (start: PathPoint, end: PathPoint, progress: number, curvature: number = 0.3): PathPoint => {
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  const offsetX = -dy * curvature * (distance / 200)
  const offsetY = dx * curvature * (distance / 200)
  
  const controlX = midX + offsetX
  const controlY = midY + offsetY
  
  // Quadratic bezier curve calculation
  const t = progress
  const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x
  const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y
  
  return { x, y }
}

// Responsive formation generator that scales based on viewport dimensions
const getFormations = (viewportWidth: number, viewportHeight: number) => {
  const isMobile = viewportWidth < 768
  const containerWidth = viewportWidth
  const containerHeight = viewportHeight
  
  // Scale factors for different screen sizes
  const baseSpacing = isMobile ? 35 : 60
  const verticalSpacing = isMobile ? 25 : 40
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  
  return {
    // Traditional block formation - starting position
    block: (index: number, cols: number) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const totalWidth = (cols - 1) * baseSpacing
      const startX = centerX - totalWidth / 2
      return {
        x: startX + (col * baseSpacing),
        y: centerY - 60 + (row * verticalSpacing),
      }
    },
    
    // Company front - all performers in a horizontal line
    companyFront: (index: number, total: number) => {
      const spacing = containerWidth / (total + 1)
      return {
        x: spacing * (index + 1),
        y: centerY,
      }
    },
    
    // Double company front - two horizontal lines
    doubleCompanyFront: (index: number, total: number) => {
      const spacing = containerWidth / (total / 2 + 1)
      const frontRow = index < total / 2
      const rowIndex = index % (total / 2)
      return {
        x: spacing * (rowIndex + 1),
        y: frontRow ? centerY - 30 : centerY + 30,
      }
    },
    
    // Diagonal company - angled line formation
    diagonal: (index: number, total: number) => {
      const progress = index / (total - 1)
      const startX = containerWidth * 0.15
      const endX = containerWidth * 0.85
      const startY = containerHeight * 0.3
      const endY = containerHeight * 0.7
      return {
        x: startX + (endX - startX) * progress,
        y: startY + (endY - startY) * progress,
      }
    },
    
    // Circle formation - performers arranged in a circle
    circle: (index: number, total: number) => {
      const angle = (index / total) * 2 * Math.PI
      const radius = Math.min(containerWidth, containerHeight) * 0.2
      return {
        x: Math.cos(angle) * radius + centerX,
        y: Math.sin(angle) * radius + centerY,
      }
    },
    
    // Wedge formation - V shape pointing forward
    wedge: (index: number, total: number) => {
      const centerIndex = Math.floor(total / 2)
      const spacing = Math.min(baseSpacing, containerWidth / total)
      
      if (index <= centerIndex) {
        // Left side of wedge
        const position = centerIndex - index
        return {
          x: centerX - (position * spacing * 0.7),
          y: centerY - 100 + (position * spacing * 0.8),
        }
      } else {
        // Right side of wedge
        const position = index - centerIndex
        return {
          x: centerX + (position * spacing * 0.7),
          y: centerY - 100 + (position * spacing * 0.8),
        }
      }
    },
    
    // Column formation - vertical lines
    columns: (index: number, cols: number, total: number) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const horizontalSpacing = containerWidth / (cols + 1)
      const totalRows = Math.ceil(total / cols)
      const startY = centerY - ((totalRows - 1) * verticalSpacing) / 2
      return {
        x: horizontalSpacing * (col + 1),
        y: startY + (row * verticalSpacing),
      }
    },
    
    // Staggered lines - offset rows
    staggered: (index: number, cols: number, total: number) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const horizontalSpacing = containerWidth / (cols + 2)
      const offset = (row % 2) * (horizontalSpacing / 2)
      const totalRows = Math.ceil(total / cols)
      const startY = centerY - ((totalRows - 1) * verticalSpacing) / 2
      return {
        x: horizontalSpacing + (col * horizontalSpacing) + offset,
        y: startY + (row * verticalSpacing),
      }
    }
  }
}

export default function MarchingFormation() {
  const [dots, setDots] = useState<Dot[]>([])
  const [currentFormation, setCurrentFormation] = useState<keyof ReturnType<typeof getFormations>>("block")
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const cols = dimensions.width < 768 ? 6 : 8  // Fewer columns on mobile
    const rows = dimensions.width < 768 ? 4 : 5  // Fewer rows on mobile
    const totalDots = cols * rows

    const formations = getFormations(dimensions.width, dimensions.height)
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
        pathProgress: 0,
      }
    })

    setDots(initialDots)
  }, [dimensions])

  useEffect(() => {
    const formationSequence: (keyof ReturnType<typeof getFormations>)[] = [
      "block",
      "companyFront", 
      "doubleCompanyFront",
      "diagonal",
      "circle",
      "wedge",
      "columns",
      "staggered"
    ]
    
    const interval = setInterval(() => {
      const currentIndex = formationSequence.indexOf(currentFormation)
      const nextIndex = (currentIndex + 1) % formationSequence.length
      setCurrentFormation(formationSequence[nextIndex])
    }, 8000) // Increased from 4000ms to 8000ms

    return () => clearInterval(interval)
  }, [currentFormation])

  useEffect(() => {
    if (dots.length === 0) return

    const cols = dimensions.width < 768 ? 6 : 8
    const total = dots.length
    const formations = getFormations(dimensions.width, dimensions.height)
    
    setIsTransitioning(true)
    
    setDots((prevDots) =>
      prevDots.map((dot, index) => {
        let newPos
        
        // Handle formations that need total count vs cols
        if (currentFormation === "companyFront" || 
            currentFormation === "doubleCompanyFront" || 
            currentFormation === "diagonal" || 
            currentFormation === "circle" || 
            currentFormation === "wedge") {
          newPos = formations[currentFormation](index, total)
        } else {
          newPos = formations[currentFormation](index, cols, total)
        }
        
        return {
          ...dot,
          targetX: newPos.x,
          targetY: newPos.y,
          pathProgress: 0,
        }
      }),
    )

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 5000)
  }, [currentFormation, dots.length, dimensions])

  const dotSize = dimensions.width < 768 ? 2.5 : 3

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
      <svg width="100%" height="100%" className="absolute inset-0" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        {/* Show curved paths during transitions */}
        {isTransitioning && dots.map((dot) => (
          <path
            key={`path-${dot.id}`}
            d={generateCurvedPath(
              { x: dot.x, y: dot.y },
              { x: dot.targetX, y: dot.targetY }
            )}
            stroke="#374151"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
            className="transition-opacity duration-1000"
          />
        ))}
        
        {/* Performer dots */}
        {dots.map((dot) => {
          // Calculate current position along curved path during transition
          let currentX = dot.targetX
          let currentY = dot.targetY
          
          if (isTransitioning) {
            const curvePoint = getPointOnCurve(
              { x: dot.x, y: dot.y },
              { x: dot.targetX, y: dot.targetY },
              dot.pathProgress
            )
            currentX = curvePoint.x
            currentY = curvePoint.y
          }
          
          return (
            <circle
              key={dot.id}
              r={dotSize}
              fill="#374151"
              className="transition-all duration-[5000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{
                transform: `translate(${currentX}px, ${currentY}px)`,
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
