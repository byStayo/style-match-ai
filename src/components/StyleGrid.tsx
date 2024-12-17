import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StyleItem = {
  id: string;
  image: string;
  title: string;
  match: number;
};

const demoItems: StyleItem[] = [
  {
    id: "1",
    image: "/placeholder.svg",
    title: "Classic White Shirt",
    match: 95,
  },
  {
    id: "2",
    image: "/placeholder.svg",
    title: "Denim Jacket",
    match: 88,
  },
  {
    id: "3",
    image: "/placeholder.svg",
    title: "Black Dress",
    match: 82,
  },
];

export const StyleGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {demoItems.map((item) => (
        <Card key={item.id} className="overflow-hidden animate-slide-up">
          <CardHeader className="p-0">
            <div className="relative aspect-square">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-full text-sm">
                {item.match}% Match
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="text-lg">{item.title}</CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};