import { Card, CardTitle } from "@/components/ui/card";

export const EmptyProductGrid = () => {
  return (
    <Card className="p-8 text-center">
      <CardTitle className="mb-2">No matches yet</CardTitle>
      <p className="text-muted-foreground">
        Upload some images or connect your social media to get personalized style matches.
      </p>
    </Card>
  );
};