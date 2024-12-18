import { useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { SocialMediaConnect } from "../SocialMediaConnect";

export const UploadSection = () => {
  return (
    <div className="space-y-8">
      <section className="bg-background rounded-lg p-8 border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Upload Your Style
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload a photo of your style inspiration, and we'll find matching items for you.
          </p>
          <ImageUploader />
        </div>
      </section>

      <section className="bg-background rounded-lg p-8 border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Or Connect Your Social Media
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your social accounts to get personalized recommendations.
          </p>
          <SocialMediaConnect />
        </div>
      </section>
    </div>
  );
};