import { db } from "@/lib/db";
import { shows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";
import Link from "next/link";

export default async function ShowPage({ params }: { params: { id: string } }) {
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, parseInt(params.id, 10)),
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
    <div className="container mx-auto py-20">
      <Card>
        <CardHeader>
          <img src={show.thumbnailUrl || "/placeholder.svg"} alt={show.title} className="w-full h-96 object-cover rounded-t-lg" />
          <CardTitle className="text-4xl font-bold mt-4">{show.title}</CardTitle>
          <CardDescription className="text-xl">{show.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Details</h3>
              <p>Year: {show.year}</p>
              <p>Difficulty: {show.difficulty}</p>
              <p>Duration: {show.duration}</p>
              <p>Price: ${show.price}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {show.showsToTags.map((st) => (
                  <Badge key={st.tag.id} variant="secondary">
                    {st.tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold">Arrangements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {show.arrangements.map((arrangement) => (
                <Card key={arrangement.id}>
                  <CardHeader>
                    <CardTitle>{arrangement.title}</CardTitle>
                    <CardDescription>{arrangement.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Price: ${arrangement.price}</p>
                    <Button className="mt-4 w-full">Add to Cart</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
