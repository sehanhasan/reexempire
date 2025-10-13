import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  appointmentTitle: string;
  onRatingSubmitted?: (ratingData: { rating: number; comment: string | null }) => void;
}

export function RatingDialog({ open, onOpenChange, appointmentId, appointmentTitle, onRatingSubmitted }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('appointment_ratings')
        .insert({
          appointment_id: appointmentId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Thank You!",
        description: "Your rating has been submitted successfully",
      });

      // Notify parent component immediately with the rating data
      if (onRatingSubmitted) {
        onRatingSubmitted({
          rating,
          comment: comment.trim() || null,
        });
      }

      // Reset form and close dialog
      setRating(0);
      setComment("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      
      // Check if rating already exists
      if (error.code === '23505') {
        toast({
          title: "Already Rated",
          description: "You have already rated this appointment",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit rating. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate the Work</DialogTitle>
          <DialogDescription>
            How would you rate the service for "{appointmentTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Comment Box */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
