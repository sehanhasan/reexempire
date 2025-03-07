
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, Building, Database, BellRing } from "lucide-react";

// Define form schemas
const companyFormSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  email: z.string().email({ message: "Invalid email address" }),
  website: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  taxId: z.string().optional(),
  companyLogo: z.string().optional(),
});

const taxFormSchema = z.object({
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid tax rate format (e.g. 6.00)" }),
  taxName: z.string().min(1, { message: "Tax name is required" }),
  taxNumber: z.string().optional(),
  applyTaxByDefault: z.boolean()
});

export default function Settings() {
  // Company profile form
  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: "My Interior Design Company",
      address: "123 Main Street",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50000",
      phone: "+60 12-345 6789",
      email: "contact@interiordesign.com",
      website: "https://myinteriordesign.com",
      taxId: "12345678",
    },
  });

  // Tax settings form
  const taxForm = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      taxRate: "6.00",
      taxName: "SST",
      taxNumber: "SST-123456",
      applyTaxByDefault: true
    },
  });

  // Handle form submissions
  const onCompanySubmit = (data: z.infer<typeof companyFormSchema>) => {
    console.log("Company data:", data);
    toast({
      title: "Company settings saved",
      description: "Your company information has been updated successfully."
    });
  };

  const onTaxSubmit = (data: z.infer<typeof taxFormSchema>) => {
    console.log("Tax data:", data);
    toast({
      title: "Tax settings saved",
      description: "Your tax configuration has been updated successfully."
    });
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Settings" 
        description="Configure your business settings and preferences." 
      />

      <Tabs defaultValue="company" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Tax Settings
          </TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                This information will appear on your invoices and quotations.
              </CardDescription>
            </CardHeader>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onCompanySubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / Business Registration No.</FormLabel>
                          <FormControl>
                            <Input placeholder="Business registration number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Street address" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State/Province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your company website URL (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="companyLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <div className="flex items-start space-x-4">
                          <div className="h-20 w-20 rounded-md border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            {/* Placeholder for logo preview */}
                            {field.value ? (
                              <img 
                                src={field.value} 
                                alt="Company logo" 
                                className="max-h-full max-w-full object-contain" 
                              />
                            ) : (
                              <Building className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Button type="button" variant="outline" size="sm">
                              Upload Logo
                            </Button>
                            <FormDescription>
                              Recommended size: 200×200px. PNG or JPEG.
                            </FormDescription>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Company Settings
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax rates and settings for your invoices and quotations.
              </CardDescription>
            </CardHeader>
            <Form {...taxForm}>
              <form onSubmit={taxForm.handleSubmit(onTaxSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={taxForm.control}
                      name="taxName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. SST, GST, VAT" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of the tax to appear on invoices
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={taxForm.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 6.00" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter percentage without the % symbol
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={taxForm.control}
                    name="taxNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax registration ID" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your business tax registration number (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taxForm.control}
                    name="applyTaxByDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Apply Tax by Default</FormLabel>
                          <FormDescription>
                            Automatically apply tax to new invoices and quotations
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Tax Settings
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
