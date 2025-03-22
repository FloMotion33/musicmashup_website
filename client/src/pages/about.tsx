import { Card } from "@/components/ui/card";
import { Music, Users, Zap, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            About MusicMashup
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transforming the way creators make music mashups with cutting-edge technology and intuitive tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              We believe in making music creation accessible to everyone. Our platform empowers creators to experiment, innovate, and share their musical vision with the world.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              To become the leading platform for music mashup creation, fostering a community of creative artists and pushing the boundaries of what's possible in music mixing.
            </p>
          </Card>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center">Why Choose Us</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Advanced Technology</h3>
                <p className="text-muted-foreground">
                  State-of-the-art AI-powered stem separation and audio processing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Growing Community</h3>
                <p className="text-muted-foreground">
                  Join thousands of creators sharing their mashups and techniques.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Easy to Use</h3>
                <p className="text-muted-foreground">
                  Intuitive interface designed for both beginners and professionals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Quality Results</h3>
                <p className="text-muted-foreground">
                  Professional-grade audio quality in your final mashups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
