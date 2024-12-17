import { Card, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface EmptyProductGridProps {
  message?: string;
  action?: ReactNode;
}

export const EmptyProductGrid = ({ 
  message = "No matches yet",
  action 
}: EmptyProductGridProps) => {
  return (
    <Card className="p-8 text-center space-y-4">
      <CardTitle className="mb-2">{message}</CardTitle>
      <p className="text-muted-foreground">
        Upload some images or connect your social media to get personalized style matches.
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </Card>
  );
};