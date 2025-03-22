import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "How does stem separation work?",
    answer: "Our stem separation technology uses advanced AI algorithms to identify and separate different components of a song, such as vocals and instrumentals, while maintaining high audio quality."
  },
  {
    question: "What audio formats are supported?",
    answer: "We currently support MP3 and WAV formats for upload. For best results, we recommend using high-quality audio files."
  },
  {
    question: "How can I improve my mashups?",
    answer: "For the best results, use tracks with similar BPM or let our automatic BPM detection help you. Also, consider using songs in complementary musical keys."
  },
  {
    question: "What are the export options?",
    answer: "You can export your mashups in various formats including MP3 and WAV. Pro users get access to higher quality export options."
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Need Help?
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="md:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </div>

          <div>
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is ready to assist you with any questions or issues.
              </p>
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
