
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center max-w-md">
        <div className="rounded-full bg-blue-100 p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
          <FileQuestion className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
        </p>
        <Button asChild size="lg" className="px-8">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
