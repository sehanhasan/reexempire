
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/types/database";

interface CustomerInfoProps {
  customer: Customer;
}

export function CustomerInfo({ customer }: CustomerInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill To</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="font-semibold">{customer.name}</div>
          {customer.unit_number && (
            <div className="text-sm text-muted-foreground">
              Unit: {customer.unit_number}
            </div>
          )}
          {customer.address && (
            <div className="text-sm text-muted-foreground">
              {customer.address}
            </div>
          )}
          {(customer.city || customer.state || customer.postal_code) && (
            <div className="text-sm text-muted-foreground">
              {[customer.city, customer.state, customer.postal_code]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
          {customer.email && (
            <div className="text-sm text-muted-foreground">
              Email: {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="text-sm text-muted-foreground">
              Phone: {customer.phone}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
