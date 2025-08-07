
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/types/database";
import { formatPhone } from "@/utils/formatters";

interface CustomerInfoProps {
  customer: Customer | any;
}

export function CustomerInfo({ customer }: CustomerInfoProps) {
  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No customer information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p>{customer.name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p>{customer.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <p>{customer.phone ? formatPhone(customer.phone) : "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Address</p>
          <p>{customer.address || "N/A"}</p>
        </div>
        {customer.city && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">City</p>
            <p>{customer.city}</p>
          </div>
        )}
        {customer.state && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">State</p>
            <p>{customer.state}</p>
          </div>
        )}
        {customer.postal_code && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
            <p>{customer.postal_code}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
