import { db } from "@/lib/db"
import { shows } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ArrowLeft, Play, Download, Star, Clock, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default async function ShowDetailPage({ params }: { params: { id: string } }) {
  const showId = parseInt(params.id, 10);
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, showId),
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
      arrangements: true,
    },
  });

  if (!show) {
    return <div>Show not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" asChild>
          <Link href="/shows">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shows
          </Link>
        </Button>
      </div>

      {/* Show Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="relative">
          <img
            src={show.thumbnailUrl || "/placeholder.svg"}
            alt={show.title}
            className="w-full h-80 object-cover rounded-lg shadow-lg"
          />
          <Button
            size="lg"
            className="btn-secondary btn-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <Play className="w-6 h-6 mr-2" />
            Play Preview
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{show.year}</Badge>
            <Badge variant="secondary">{show.difficulty}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-bright-dark font-primary">{show.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{show.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <span>{show.duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <span>{show.arrangements.length} Arrangements</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {show.showsToTags.map((relation) => (
              <Badge key={relation.tag.id} variant="secondary">
                {relation.tag.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-bright-primary/10 rounded-lg mb-6">
            <div>
              <div className="text-2xl font-bold text-bright-dark">${show.price}</div>
              <div className="text-sm text-gray-600">Complete Show Package</div>
            </div>
            <Button size="lg" className="btn-primary btn-lg">
              Purchase Show
            </Button>
          </div>

          <Button className="btn-outline w-full mb-4">
            <Download className="w-4 h-4 mr-2" />
            Download Sample Materials
          </Button>
        </div>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="arrangements" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="arrangements">Arrangements</TabsTrigger>
        </TabsList>

        <TabsContent value="arrangements" className="mt-6">
          <div className="grid gap-6">
            <h3 className="text-2xl font-bold text-bright-dark font-primary mb-4">Show Arrangements</h3>
            {show.arrangements.map((arrangement) => (
              <Card key={arrangement.id} className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-primary">{arrangement.title}</CardTitle>
                      <CardDescription className="text-bright-third font-medium">
                        {arrangement.type}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-bright-dark">${arrangement.price}</div>
                      <div className="text-sm text-gray-500">Individual</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="btn-outline btn-sm" asChild>
                      <Link href={`/arrangements/${arrangement.id}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button size="sm" className="btn-ghost btn-sm">
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
