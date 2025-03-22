import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for trying out our features",
    features: [
      "Up to 3 mashups per month",
      "Basic stem separation",
      "Standard quality export",
      "Community support"
    ]
  },
  {
    name: "Pro",
    price: "15",
    description: "For serious music creators",
    features: [
      "Unlimited mashups",
      "Advanced stem separation",
      "High quality export",
      "Priority support",
      "Save unlimited projects",
      "Custom BPM detection"
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your needs. All plans include our core features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className="p-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-muted-foreground">{tier.description}</p>
                <hr className="border-border" />
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6">
                  Get {tier.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
