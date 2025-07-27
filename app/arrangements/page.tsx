import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ArrangementsPage() {
  const arrangements = await db.query.arrangements.findMany();

  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center mb-8">Arrangements</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {arrangements.map((arrangement) => (
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
  );
}
