import { ImageUploader } from "./ImageUploader";
import { SocialMediaConnect } from "../SocialMediaConnect";

export const UploadSection = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section className="bg-background rounded-xl p-8 border shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Upload Your Style
          </h2>
          <p className="text-muted-foreground text-lg">
            Upload a photo of your style inspiration, and we'll find matching items for you.
          </p>
          <ImageUploader />
        </div>
      </section>

      <section className="bg-gradient-to-br from-background to-accent/5 rounded-xl p-8 border shadow-lg">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Or Connect Your Social Media
          </h2>
          <p className="text-muted-foreground text-lg">
            Connect your social accounts to get personalized recommendations.
          </p>
          <SocialMediaConnect />
        </div>
      </section>
    </div>
  );
};