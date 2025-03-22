import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Heart, Share2 } from "lucide-react";

const trendingMashups = [
  {
    id: 1,
    title: "Summer Vibes Mix",
    creator: "DJMaster",
    likes: 1234,
    plays: 5678,
    tracks: ["Track 1", "Track 2"],
    thumbnail: "gradient-1"
  },
  {
    id: 2,
    title: "Electronic Fusion",
    creator: "BeatMaker",
    likes: 987,
    plays: 4321,
    tracks: ["Track 3", "Track 4"],
    thumbnail: "gradient-2"
  },
  {
    id: 3,
    title: "Pop Classics Remix",
    creator: "MixPro",
    likes: 2468,
    plays: 7890,
    tracks: ["Track 5", "Track 6"],
    thumbnail: "gradient-3"
  },
  {
    id: 4,
    title: "Hip Hop Blend",
    creator: "UrbanMixer",
    likes: 3579,
    plays: 9876,
    tracks: ["Track 7", "Track 8"],
    thumbnail: "gradient-4"
  }
];

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Trending Mashups
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the most popular mashups created by our community
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingMashups.map((mashup) => (
            <Card key={mashup.id} className="overflow-hidden">
              <div className={`h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center`}>
                <Play className="h-12 w-12 text-primary/40" />
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold truncate">{mashup.title}</h3>
                  <p className="text-sm text-muted-foreground">by {mashup.creator}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="truncate">Featuring:</p>
                  {mashup.tracks.map((track, index) => (
                    <p key={index} className="truncate text-xs">{track}</p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" /> {mashup.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" /> {mashup.plays}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
