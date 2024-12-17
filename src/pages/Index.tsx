import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
            <p className="text-sm text-muted-foreground">Find your perfect style match</p>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <section>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Upload Your Style
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload a photo of your style inspiration, and we'll find matching items for you.
              </p>
            </div>
            <ImageUpload />
          </section>
          
          <section>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Style Matches
              </h2>
              <p className="text-muted-foreground mb-8">
                Here are some items that match your style preferences.
              </p>
            </div>
            <StyleGrid />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;