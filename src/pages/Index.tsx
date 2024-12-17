import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Upload Your Style
            </h2>
            <ImageUpload />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Style Matches
            </h2>
            <StyleGrid />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;