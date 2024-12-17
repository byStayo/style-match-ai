import { AuthButtons } from "@/components/AuthButtons";

export const LandingHero = () => {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Find Your Perfect Style Match
        </h2>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Upload your style inspiration or connect your social media to discover perfectly matched items from your favorite stores.
        </p>
      </section>

      <section className="bg-muted/50 rounded-lg p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Get Started
          </h3>
          <p className="text-muted-foreground mb-8">
            Sign in to save your preferences and get personalized recommendations.
          </p>
          <AuthButtons />
        </div>
      </section>
    </div>
  );
};