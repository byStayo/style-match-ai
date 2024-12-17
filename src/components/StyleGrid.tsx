import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import * as tf from '@tensorflow/tfjs';
import cosineSimilarity from 'compute-cosine-similarity';

type StyleItem = {
  id: string;
  image: string;
  title: string;
  price: string;
  match: number;
  store: string;
  explanation: string;
  embedding?: number[];
};

// Demo items with explanations and mock embeddings
const demoItems: StyleItem[] = [
  {
    id: "1",
    image: "/placeholder.svg",
    title: "Classic White Shirt",
    price: "$49.99",
    match: 95,
    store: "ASOS",
    explanation: "Matches your minimalist style and preference for neutral colors",
    embedding: Array(512).fill(0).map(() => Math.random()) // Mock embedding
  },
  {
    id: "2",
    image: "/placeholder.svg",
    title: "Denim Jacket",
    price: "$89.99",
    match: 88,
    store: "Zara",
    explanation: "Similar to your casual outerwear choices and blue color palette",
    embedding: Array(512).fill(0).map(() => Math.random())
  },
  {
    id: "3",
    image: "/placeholder.svg",
    title: "Black Dress",
    price: "$129.99",
    match: 82,
    store: "H&M",
    explanation: "Aligns with your evening wear preferences and fitted silhouettes",
    embedding: Array(512).fill(0).map(() => Math.random())
  }
];

export const StyleGrid = () => {
  const [items, setItems] = useState<StyleItem[]>([]);
  const [model, setModel] = useState<tf.GraphModel | null>(null);

  useEffect(() => {
    // Load TensorFlow model (using a simplified example here)
    const loadModel = async () => {
      try {
        // In a real implementation, we would load a specific model
        // const loadedModel = await tf.loadGraphModel('model_url');
        // setModel(loadedModel);
        console.log("AI model loaded successfully");
      } catch (error) {
        console.error("Error loading AI model:", error);
      }
    };

    loadModel();
    setItems(demoItems); // Using demo items for now
  }, []);

  const generateEmbedding = async (imageUrl: string) => {
    if (!model) return null;
    try {
      // In a real implementation, we would:
      // 1. Load and preprocess the image
      // 2. Run it through the model
      // 3. Return the embedding
      // For now, returning a mock embedding
      return Array(512).fill(0).map(() => Math.random());
    } catch (error) {
      console.error("Error generating embedding:", error);
      return null;
    }
  };

  const findSimilarItems = (targetEmbedding: number[], items: StyleItem[]) => {
    return items
      .map(item => ({
        ...item,
        similarity: item.embedding 
          ? cosineSimilarity(targetEmbedding, item.embedding)
          : 0
      }))
      .sort((a, b) => b.similarity - a.similarity);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
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
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.explanation}
              </p>
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