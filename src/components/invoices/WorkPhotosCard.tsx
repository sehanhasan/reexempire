
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WorkPhotosCardProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function WorkPhotosCard({ images, onImagesChange }: WorkPhotosCardProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create a data URL for the image
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            
            // Update images when all files are processed
            if (newImages.length === files.length) {
              onImagesChange([...images, ...newImages]);
              toast({
                title: "Photos uploaded",
                description: `${files.length} photo(s) have been added.`,
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-orange-600 flex items-center">
          <Camera className="mr-2 h-5 w-5" />
          Work Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="work-photos" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> work photos
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
              </div>
              <Input
                id="work-photos"
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Work photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="flex justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-t-orange-500 rounded-full"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
