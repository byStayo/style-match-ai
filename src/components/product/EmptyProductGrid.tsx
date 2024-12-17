import { Card, CardTitle } from "@/components/ui/card";

interface EmptyProductGridProps {
  message?: string;
}

export const EmptyProductGrid = ({ message = "No matches yet" }: EmptyProductGridProps) => {
  return (
    <Card className="p-8 text-center">
      <CardTitle className="mb-2">{message}</CardTitle>
      <p className="text-muted-foreground">
        Upload some images or connect your social media to get personalized style matches.
      </p>
    </Card>
  );
};