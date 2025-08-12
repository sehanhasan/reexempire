
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { categoryService } from "@/services";
import { DataTable } from "@/components/common/DataTable";
import { SubcategoriesDialog } from "@/components/categories/SubcategoriesDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Categories() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'Active' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(row.original);
            }}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/categories/edit/${row.original.id}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Categories"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button onClick={() => navigate("/categories/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredCategories}
        columns={columns}
        searchKey="name"
        externalSearchTerm={searchTerm}
        onExternalSearchChange={setSearchTerm}
        isLoading={isLoading}
      />

      {selectedCategory && (
        <SubcategoriesDialog
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
          category={selectedCategory}
        />
      )}
    </div>
  );
}
