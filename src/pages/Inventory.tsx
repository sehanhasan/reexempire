import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, TrendingUp, Plus, FileText, Activity, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PaginationControls } from "@/components/common/PaginationControls";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePagination } from "@/hooks/usePagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Inventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("items");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allItems, lowStock] = await Promise.all([
        inventoryService.getAllItems(),
        inventoryService.getLowStockItems()
      ]);
      setItems(allItems);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      fetchData();
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
        quantity: quantityNumber,
        reference_type: 'manual_issue',
        notes: `Manual issue of ${quantityNumber} units`,
        created_by: 'System User'
      });

      toast({
        title: "Success",
        description: `Successfully issued ${quantityNumber} units of ${item.name}`
      });
      
      fetchData();
    } catch (error) {
      console.error("Error issuing item:", error);
      toast({
        title: "Error",
        description: "Failed to issue item",
        variant: "destructive"
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination(filteredItems.length, 10);

  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.min_stock_level && item.quantity <= item.min_stock_level) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }: any) => (
        <div className="text-start">
          <div 
            className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            onClick={() => navigate(`/inventory/edit/${row.original.id}`)}
          >
            {row.original.name}
          </div>
          {row.original.category && <div className="text-sm text-gray-500">{row.original.category}</div>}
          {row.original.sku && <div className="text-xs text-gray-400">{row.original.sku}</div>}
        </div>
      )
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }: any) => (
        <div className="text-center">
          <div className="font-medium">{row.original.quantity}</div>
          {getStockStatusBadge(row.original)}
        </div>
      )
    },
    {
      accessorKey: "unit_price",
      header: "Unit Price",
      cell: ({ row }: any) => row.original.unit_price ? formatCurrency(row.original.unit_price) : "-"
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }: any) => row.original.supplier || "-"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge 
          variant={row.original.status === 'Active' ? 'default' : 'secondary'}
          className={row.original.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/inventory/edit/${row.original.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIssueItem(row.original)}>
                    <Activity className="mr-2 h-4 w-4" />
                    Issue Item
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(row.original.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);
  const activeItems = items.filter(item => item.status === 'Active').length;

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">{activeItems} active items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items below minimum level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map(item => item.category).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex border-b bg-white border-gray-200 rounded-t-lg">
          <button 
            onClick={() => setActiveTab("items")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === "items" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Package className="h-4 w-4" />
            Inventory Items
          </button>
          <button 
            onClick={() => setActiveTab("low-stock")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === "low-stock" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </button>
          <button 
            onClick={() => setActiveTab("demand-lists")} 
            className={`flex-1 py-3 px-6 text-medium font-small transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === "demand-lists" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <FileText className="h-4 w-4" />
            Demand Lists
          </button>
        </div>

        <div className={`mt-4 ${activeTab === "items" ? "block" : "hidden"}`}>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            
            <DataTable
              data={pagination.paginatedData(filteredItems)}
              columns={columns}
              isLoading={loading}
              emptyMessage="No inventory items found"
            />
            
            <PaginationControls
              pagination={pagination.pagination}
              controls={pagination.controls}
            />
          </div>
        </div>

        <div className={`mt-4 ${activeTab === "low-stock" ? "block" : "hidden"}`}>
          {lowStockItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Low Stock Items</h3>
                <p className="text-gray-500">All items are above minimum stock levels.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {lowStockItems.map((item) => (
                <Card key={item.id} className="border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          Current: {item.quantity} | Minimum: {item.min_stock_level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/inventory/edit/${item.id}`)}
                        >
                          Restock
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-4 ${activeTab === "demand-lists" ? "block" : "hidden"}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Demand Lists</h3>
              <p className="text-sm text-gray-500">Manage procurement requests</p>
            </div>
            <Button onClick={() => navigate("/inventory/demand-lists/add")}>
              <Plus className="h-4 w-4 mr-2" />
              New Demand List
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Demand Lists</h3>
              <p className="text-gray-500 mb-4">Create demand lists to manage procurement requests.</p>
              <Button onClick={() => navigate("/inventory/demand-lists/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Demand List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <FloatingActionButton
        onClick={() => navigate("/inventory/add")}
        icon={<Plus className="h-5 w-5" />}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}