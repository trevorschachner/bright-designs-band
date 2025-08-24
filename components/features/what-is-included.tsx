import { FileText, Music, BarChart, Download, Bot, Folder, BookOpen } from 'lucide-react'
import React from 'react'

const includedItems = [
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: 'Full Score & Individual Parts',
    description: 'Professionally engraved scores and parts for every instrument, delivered as PDFs.',
  },
  {
    icon: <Music className="h-6 w-6 text-primary" />,
    title: 'Notation and Audio Files',
    description: 'Receive MusicXML/XML files for easy edits and MP3 recordings for practice.',
  },
  {
    icon: <BarChart className="h-6 w-6 text-primary" />,
    title: 'Drill & Animation',
    description: 'Complete drill charts and 3D animation files to visualize the show.',
  },
  {
    icon: <Bot className="h-6 w-6 text-primary" />,
    title: 'MainStage/Ableton Patches',
    description: 'Ready-to-use synth patches for your electronic sound design needs.',
  },
  {
    icon: <Folder className="h-6 w-6 text-primary" />,
    title: 'Show Artwork and Graphics',
    description: 'High-resolution logos, branding, and graphics for your show.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: 'Director’s Guide',
    description: 'A comprehensive guide with notes, setup instructions, and performance tips.',
  },
]

export function WhatIsIncluded() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">What&apos;s Included</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {includedItems.map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <div className="flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
