"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  X, 
  Search, 
  Music, 
  Clock, 
  DollarSign,
  Sparkles,
  Target,
  Users
} from "lucide-react"
import Link from "next/link"

// Mock data for arrangements - in real app this would come from database
const mockArrangements = [
  {
    id: 1,
    title: "Bohemian Rhapsody",
    type: "Rock",
    duration: "5:30",
    difficulty: "Advanced",
    price: 150,
    description: "Epic Queen masterpiece with dynamic sections"
  },
  {
    id: 2,
    title: "Star Wars Main Theme",
    type: "Movie",
    duration: "4:15",
    difficulty: "Intermediate",
    price: 125,
    description: "Iconic John Williams theme"
  },
  {
    id: 3,
    title: "Thunderstruck",
    type: "Rock",
    duration: "3:45",
    difficulty: "Advanced",
    price: 140,
    description: "High-energy AC/DC hit"
  },
  {
    id: 4,
    title: "Pirates of the Caribbean",
    type: "Movie",
    duration: "6:00",
    difficulty: "Advanced",
    price: 160,
    description: "Adventure-filled Hans Zimmer score"
  },
  {
    id: 5,
    title: "Eye of the Tiger",
    type: "Rock",
    duration: "4:30",
    difficulty: "Intermediate",
    price: 120,
    description: "Motivational Survivor classic"
  },
  {
    id: 6,
    title: "The Avengers Theme",
    type: "Movie",
    duration: "5:00",
    difficulty: "Intermediate",
    price: 135,
    description: "Heroic Alan Silvestri composition"
  }
]

interface SelectedArrangement {
  id: number
  title: string
  duration: string
  price: number
  position: number
}

export default function ShowBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showTitle, setShowTitle] = useState("")
  const [showTheme, setShowTheme] = useState("")
  const [selectedArrangements, setSelectedArrangements] = useState<SelectedArrangement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterDifficulty, setFilterDifficulty] = useState("all")

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  // Filter arrangements based on search and filters
  const filteredArrangements = mockArrangements.filter(arrangement => {
    const matchesSearch = arrangement.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || arrangement.type === filterType
    const matchesDifficulty = filterDifficulty === "all" || arrangement.difficulty === filterDifficulty
    const notSelected = !selectedArrangements.some(selected => selected.id === arrangement.id)
    
    return matchesSearch && matchesType && matchesDifficulty && notSelected
  })

  const addArrangement = (arrangement: typeof mockArrangements[0]) => {
    const newArrangement: SelectedArrangement = {
      id: arrangement.id,
      title: arrangement.title,
      duration: arrangement.duration,
      price: arrangement.price,
      position: selectedArrangements.length
    }
    setSelectedArrangements([...selectedArrangements, newArrangement])
  }

  const removeArrangement = (id: number) => {
    setSelectedArrangements(selectedArrangements.filter(arr => arr.id !== id))
  }

  const moveArrangement = (fromIndex: number, toIndex: number) => {
    const newArrangements = [...selectedArrangements]
    const [moved] = newArrangements.splice(fromIndex, 1)
    newArrangements.splice(toIndex, 0, moved)
    setSelectedArrangements(newArrangements.map((arr, index) => ({ ...arr, position: index })))
  }

  const getTotalDuration = () => {
    const totalSeconds = selectedArrangements.reduce((total, arr) => {
      const [minutes, seconds] = arr.duration.split(':').map(Number)
      return total + (minutes * 60) + seconds
    }, 0)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTotalPrice = () => {
    return selectedArrangements.reduce((total, arr) => total + arr.price, 0)
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 font-primary">Build Your Show</h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto">
            Create a custom marching band show by selecting and organizing arrangements
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-bright-primary" />
                Show Details
              </CardTitle>
              <CardDescription>
                Let's start with some basic information about your show
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Show Title</label>
                <Input
                  placeholder="Enter your show title..."
                  value={showTitle}
                  onChange={(e) => setShowTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Show Theme</label>
                <Select value={showTheme} onValueChange={setShowTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie Soundtrack</SelectItem>
                    <SelectItem value="rock">Rock Anthology</SelectItem>
                    <SelectItem value="classical">Classical Journey</SelectItem>
                    <SelectItem value="pop">Pop Hits</SelectItem>
                    <SelectItem value="custom">Custom Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Arrangement Browser */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-bright-primary" />
                    Browse Arrangements
                  </CardTitle>
                  <CardDescription>
                    Search and filter through our arrangement library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search arrangements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Rock">Rock</SelectItem>
                        <SelectItem value="Movie">Movie</SelectItem>
                        <SelectItem value="Pop">Pop</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrangement Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredArrangements.map((arrangement) => (
                      <Card key={arrangement.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{arrangement.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {arrangement.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{arrangement.description}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {arrangement.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {arrangement.difficulty}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${arrangement.price}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => addArrangement(arrangement)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Show
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Arrangements */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-bright-third" />
                    Your Show ({selectedArrangements.length})
                  </CardTitle>
                  <CardDescription>
                    Drag to reorder arrangements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedArrangements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No arrangements selected yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {selectedArrangements.map((arrangement, index) => (
                          <div key={arrangement.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium w-6">{index + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{arrangement.title}</p>
                              <p className="text-xs text-gray-500">{arrangement.duration}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeArrangement(arrangement.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Duration:</span>
                          <span className="font-medium">{getTotalDuration()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Cost:</span>
                          <span className="font-medium">${getTotalPrice()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Review & Customize</CardTitle>
              <CardDescription>
                Review your show and make final adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Show Summary */}
                <div>
                  <h3 className="font-semibold mb-4">Show Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Title</label>
                      <p className="font-medium">{showTitle || "Untitled Show"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Theme</label>
                      <p className="font-medium">{showTheme || "Not selected"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Duration</label>
                      <p className="font-medium">{getTotalDuration()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                      <p className="font-medium text-bright-primary">${getTotalPrice()}</p>
                    </div>
                  </div>
                </div>

                {/* Arrangement Order */}
                <div>
                  <h3 className="font-semibold mb-4">Arrangement Order</h3>
                  <div className="space-y-2">
                    {selectedArrangements.map((arrangement, index) => (
                      <div key={arrangement.id} className="flex items-center gap-3 p-3 border rounded">
                        <span className="font-medium text-bright-primary">{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{arrangement.title}</p>
                          <p className="text-sm text-gray-500">{arrangement.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-bright-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Show Created Successfully!</CardTitle>
              <CardDescription>
                Your custom show "{showTitle}" is ready for the next steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Arrangements:</p>
                    <p className="text-gray-600">{selectedArrangements.length} selected</p>
                  </div>
                  <div>
                    <p className="font-medium">Duration:</p>
                    <p className="text-gray-600">{getTotalDuration()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Theme:</p>
                    <p className="text-gray-600">{showTheme}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Cost:</p>
                    <p className="text-bright-primary font-semibold">${getTotalPrice()}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button className="w-full btn-primary" asChild>
                  <Link href="/contact">Get Custom Quote</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/shows">View Similar Shows</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-bright-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={currentStep === 1 && (!showTitle || !showTheme)}
              className="flex items-center gap-2 btn-primary"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="btn-primary" asChild>
              <Link href="/">
                Start New Show
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 