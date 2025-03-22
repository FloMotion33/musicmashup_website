import { Card } from "@/components/ui/card";
import { Music2, Share2, Download } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Powerful Audio Mashup Tools
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create unique mashups with our professional-grade audio tools. Mix, match, and transform your music with ease.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Stem Separation</h3>
            <p className="text-muted-foreground">
              Advanced AI-powered technology to separate vocals and instrumentals from any track with high precision.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Smart Mixing</h3>
            <p className="text-muted-foreground">
              Automatic BPM detection and key matching to ensure your mashups sound professional every time.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Easy Sharing</h3>
            <p className="text-muted-foreground">
              Share your creations directly with your audience or export them for use in other applications.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">High-Quality Export</h3>
            <p className="text-muted-foreground">
              Export your mashups in multiple formats with professional quality audio preservation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}