import { FileText, Music, BarChart, Folder, BookOpen, Users, Speaker, Video, Flag, Palette } from 'lucide-react'
import React from 'react'

const includedItems = [
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: 'Full Score & Individual Parts',
    description: 'Professionally engraved scores and parts tailored for your group, delivered as PDFs.',
  },
  {
    icon: <Music className="h-6 w-6 text-primary" />,
    title: 'Notation and Audio Files',
    description: 'Receive MusicXML/XML files for easy edits and MP3 recordings for practice.',
  },
  {
    icon: <Speaker className="h-6 w-6 text-primary" />,
    title: 'Sound Design',
    description: 'Mainstage file included for all sound design and sound effects.',
  },
  {
    icon: <Folder className="h-6 w-6 text-primary" />,
    title: 'Show Artwork and Graphics',
    description: 'High-resolution logos, branding, and graphics for your show.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: "Director's Guide",
    description: 'A comprehensive guide with notes, setup instructions, and performance tips.',
  },
]

const optionalItems = [
  {
    icon: <BarChart className="h-6 w-6 text-primary" />,
    title: 'Drill Design',
    description: 'Drill design is available by request. We will connect you with a professional drill designer to create custom drill for your ensemble.',
  },
  {
    icon: <Video className="h-6 w-6 text-primary" />,
    title: 'Wind Choreography',
    description: 'Detailed videos for all wind choreography available by request to help your students learn quickly.',
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Color Guard Choreography',
    description: 'Complete packages including flags, weapons, and dance choreography available by request.',
  },
  {
    icon: <Palette className="h-6 w-6 text-primary" />,
    title: 'Prop and Flag Design',
    description: 'Custom design services for props and flags to perfectly match your show theme.',
  },
]

export function WhatIsIncluded() {
  return (
    <div className="bg-card rounded-lg shadow-lg p-8 border h-full flex flex-col">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">What&apos;s Included</h2>
      <div className="space-y-4 flex-1">
        {includedItems.map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <div className="flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
          </div>
        ))}
        
        {/* Visual separator for optional items */}
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Optional Add-Ons</p>
          {optionalItems.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
