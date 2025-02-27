
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  FolderPlus,
  ChevronRight
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  description: string;
  subcategories: number;
  services: number;
}

export default function Categories() {
  // Mock data - would come from API in real app
  const [categories] = useState<Category[]>([
    { id: "CAT-001", name: "Bathroom Renovation", description: "Complete bathroom remodeling services", subcategories: 4, services: 12 },
    { id: "CAT-002", name: "Kitchen Remodeling", description: "Kitchen upgrade and renovation", subcategories: 5, services: 15 },
    { id: "CAT-003", name: "Flooring", description: "All types of flooring installation and repair", subcategories: 6, services: 10 },
    { id: "CAT-004", name: "Painting", description: "Interior and exterior painting services", subcategories: 2, services: 5 },
    { id: "CAT-005", name: "Electrical Work", description: "All electrical installation and repairs", subcategories: 3, services: 8 },
    { id: "CAT-006", name: "Plumbing", description: "Plumbing services and fixtures", subcategories: 3, services: 9 },
    { id: "CAT-007", name: "Roofing", description: "Roof repair and installation", subcategories: 2, services: 6 },
  ]);

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Category,
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Category,
      cell: (category: Category) => (
        <div className="flex items-center font-medium text-blue-600">
          {category.name}
          <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Category,
    },
    {
      header: "Subcategories",
      accessorKey: "subcategories" as keyof Category,
    },
    {
      header: "Services",
      accessorKey: "services" as keyof Category,
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Category,
      cell: (category: Category) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Service Categories" 
        description="Manage your service categories and subcategories."
        actions={
          <Button className="flex items-center">
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={categories} 
          searchKey="name" 
        />
      </div>

      <FloatingActionButton />
    </div>
  );
}
