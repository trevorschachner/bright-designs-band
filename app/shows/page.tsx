import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, Users } from "lucide-react";

const mockShows = [
  {
    id: "1",
    title: "The Galactic Symphony",
    year: "2023",
    description: "A journey through the stars with a powerful and moving soundtrack.",
    thumbnailUrl: "/placeholder.svg",
    difficulty: "Medium",
    duration: "7:30",
    showsToTags: [
      { tag: { id: "1", name: "Space" } },
      { tag: { id: "2", name: "Orchestral" } },
      { tag: { id: "3", name: "Modern" } },
    ],
  },
  {
    id: "2",
    title: "Echoes of the Canyon",
    year: "2022",
    description: "A tribute to the majestic beauty of the American Southwest.",
    thumbnailUrl: "/placeholder.svg",
    difficulty: "Easy",
    duration: "6:45",
    showsToTags: [
      { tag: { id: "4", name: "Nature" } },
      { tag: { id: "5", name: "Band" } },
      { tag: { id: "6", name: "Lyrical" } },
    ],
  },
  {
    id: "3",
    title: "Metropolis Future",
    year: "2024",
    description: "An energetic and futuristic show inspired by the worlds of tomorrow.",
    thumbnailUrl: "/placeholder.svg",
    difficulty: "Hard",
    duration: "8:15",
    showsToTags: [
      { tag: { id: "7", name: "Electronic" } },
      { tag: { id: "8", name: "Sci-Fi" } },
      { tag: { id: "3", name: "Modern" } },
    ],
  },
];

export default async function ShowsPage() {
  /*
  const shows = await db.query.shows.findMany({
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
    },
  });
  */
  const shows = mockShows;

  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center mb-8">Show Catalog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shows.map((show) => (
          <Card
            key={show.id}
            className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={show.thumbnailUrl || "/placeholder.svg"}
                alt={show.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Button
                size="sm"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-900 hover:bg-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-xl group-hover:text-bright-third transition-colors font-primary">
                  {show.title}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {show.year}
                </Badge>
              </div>
              <CardDescription className="text-sm">{show.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {show.difficulty}
                </span>
                <span>{show.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {show.showsToTags.map((st) => (
                  <Badge key={st.tag.id} variant="secondary" className="text-xs">
                    {st.tag.name}
                  </Badge>
                ))}
              </div>
              <Button className="btn-primary w-full" asChild>
                <Link href={`/shows/${show.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
