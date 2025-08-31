import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import { inventoryCategoryService, InventoryCategory } from "@/services/inventoryCategoryService";
import { Package, AlertTriangle, TrendingUp, Plus, FileText, Activity, MoreHorizontal, Edit, Trash2, Search, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InventoryCategoryDialog } from "@/components/inventory/InventoryCategoryDialog";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePagination } from "@/hooks/usePagination";

export default function Inventory() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");

  // Fetch inventory items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryService.getAllItems
  });

  // Fetch low stock items
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-items'],
    queryFn: inventoryService.getLowStockItems
  });

  // Fetch inventory categories
  const { data: categories = [] } = useQuery<InventoryCategory[]>({
    queryKey: ['inventory-categories'],
    queryFn: inventoryCategoryService.getAll
  });

  // Filter items based on search and status
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const { pagination, controls, paginatedData } = usePagination(filteredItems.length, 10);

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      await inventoryService.deleteItem(itemToDelete);
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleIssueItem = async (item: InventoryItem) => {
    const quantity = prompt(`How many ${item.name} would you like to issue?`);
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return;
    }

    const quantityNumber = Number(quantity);
    if (quantityNumber > item.quantity) {
      toast({
        title: "Error",
        description: "Cannot issue more items than available in stock",
        variant: "destructive"
      });
      return;
    }

    try {
      await inventoryService.createMovement({
        inventory_item_id: item.id,
        movement_type: 'OUT',
        quantity: -quantityNumber,
        reference_type: 'manual_issue',
        notes: 'Manual issue from inventory',
        created_by: 'System'
      });

      toast({
        title: "Success",
        description: `${quantityNumber} units of ${item.name} issued successfully`
      });
      refetch();
    } catch (error) {
      console.error("Error issuing item:", error);
      toast({
        title: "Error",
        description: "Failed to issue item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await inventoryCategoryService.delete(categoryId);
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return <Badge variant="destructive" className="pointer-events-none">Out of Stock</Badge>;
    } else if (item.quantity <= (item.min_stock_level || 0)) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 pointer-events-none">Low Stock</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-700 pointer-events-none">In Stock</Badge>;
    }
  };

  const columns = [
    {
      header: "Item",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <button 
            onClick={() => navigate(`/inventory/edit/${row.original.id}`)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            {row.original.name}
          </button>
          {row.original.sku && (
            <div className="text-sm text-muted-foreground font-mono">SKU: {row.original.sku}</div>
          )}
        </div>
      )
    },
    {
      header: "Stock",
      accessorKey: "quantity",
      cell: ({ row }: any) => (
        <div className="text-left flex items-center gap-2">
          <div className="font-medium">{row.original.quantity}</div>
          {getStockStatusBadge(row.original)}
        </div>
      )
    },
    {
      header: "Price",
      accessorKey: "unit_price",
      cell: ({ getValue }: any) => formatCurrency(getValue() || 0)
    },
    {
      header: "Supplier",
      accessorKey: "supplier",
      cell: ({ getValue }: any) => getValue() || '-'
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }: any) => getValue() || '-'
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/inventory/edit/${row.original.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleIssueItem(row.original)}>
              <Package className="mr-2 h-4 w-4" />
              Issue Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => handleDeleteClick(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Calculate stats
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);
  const uniqueCategories = new Set(items.map(item => item.category).filter(Boolean)).size;

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search inventory..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    // Clear search when leaving the page
    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <div className="mt-0">
        <div className="flex border-b bg-white border-gray-200 rounded-t-lg">
          <button 
            onClick={() => setActiveTab("inventory")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "inventory" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Inventory Items ({items.length})
          </button>
          <button 
            onClick={() => setActiveTab("low-stock")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "low-stock" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Low Stock ({lowStockItems.length})
          </button>
          <button 
            onClick={() => setActiveTab("categories")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 ${
              activeTab === "categories" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Categories ({uniqueCategories})
          </button>
        </div>

        <div className={!isMobile ? "bg-white rounded-b-lg border border-t-0" : ""}>
          {activeTab === "inventory" && (

            <div className="p-0">
              <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                {!isMobile && (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                )}

                <div className="w-full sm:w-60">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="py-8 text-center bg-slate-100">
                  <p className="text-muted-foreground">Loading inventory items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No inventory items found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={paginatedData(filteredItems)}
                    isLoading={isLoading}
                    emptyMessage="No inventory items found."
                  />
                  {filteredItems.length > 0 && (
                    <div className="p-4 border-t">
                      <PaginationControls pagination={pagination} controls={controls} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "low-stock" && (

            <div className="space-y-4 p-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-green-700">All items are well stocked!</p>
                  <p className="text-muted-foreground">No items are currently below minimum stock levels.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Low Stock Items</h3>
                      <p className="text-sm text-muted-foreground">
                        {lowStockItems.length} items need attention
                      </p>
                    </div>
                    <Button onClick={() => navigate('/demand-list/add')} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Create Demand List
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {lowStockItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              {item.sku && (
                                <p className="text-sm text-muted-foreground font-mono">SKU: {item.sku}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                  {item.quantity} remaining
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Min: {item.min_stock_level}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/inventory/edit/${item.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Categories</h3>
                <InventoryCategoryDialog onCategoryChanged={refetch} />
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No categories found.</p>
                </div>
              ) : (
                categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <InventoryCategoryDialog 
                        onCategoryChanged={refetch} 
                        category={category} 
                        mode="edit" 
                      />
                    </div>
                    
                    {/* Items in this category */}
                    <div className="space-y-2">
                      {items.filter(item => item.category === category.name).map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <button 
                              onClick={() => navigate(`/inventory/edit/${item.id}`)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {item.name}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Stock: {item.quantity}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{formatCurrency(item.unit_price || 0)}</span>
                          </div>
                        </div>
                      ))}
                      {items.filter(item => item.category === category.name).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No items in this category</p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <FloatingActionButton onClick={() => navigate('/inventory/add')} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}