import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";

type StyleItem = {
  id: string;
  image: string;
  title: string;
  price: string;
  match: number;
  store: string;
};

const demoItems: StyleItem[] = [
  {
    id: "1",
    image: "/placeholder.svg",
    title: "Classic White Shirt",
    price: "$49.99",
    match: 95,
    store: "ASOS"
  },
  {
    id: "2",
    image: "/placeholder.svg",
    title: "Denim Jacket",
    price: "$89.99",
    match: 88,
    store: "Zara"
  },
  {
    id: "3",
    image: "/placeholder.svg",
    title: "Black Dress",
    price: "$129.99",
    match: 82,
    store: "H&M"
  }
];

export const StyleGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {demoItems.map((item) => (
        <Card key={item.id} className="group overflow-hidden animate-fade-in">
          <CardHeader className="p-0">
            <div className="relative aspect-square">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-full text-sm">
                {item.match}% Match
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 text-white hover:text-primary bg-black/50 hover:bg-white"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{item.price}</span>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {item.store}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};