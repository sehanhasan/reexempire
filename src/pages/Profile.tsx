
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Save,
  UserCircle,
  Lock,
  LogOut
} from "lucide-react";

export default function Profile() {
  // Mock user data - would come from API/store in real app
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john@renovateprox.com",
    phone: "(555) 123-4567",
    role: "Administrator",
    address: "123 Business St, Suite 101, Anytown, ST 12345",
    joinDate: "Jan 15, 2022",
  });

  const [formData, setFormData] = useState({
    personal: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const [loading, setLoading] = useState({
    personal: false,
    security: false,
  });

  const handleInputChange = (section: 'personal' | 'security', field: string, value: string) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation (basic example)
    if (!formData.personal.name || !formData.personal.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required fields",
        variant: "destructive",
      });
      return;
    }

    // Show loading state
    setLoading({ ...loading, personal: true });
    
    // Simulate API call
    setTimeout(() => {
      // Update user state with new data
      setUser({
        ...user,
        name: formData.personal.name,
        email: formData.personal.email,
        phone: formData.personal.phone,
        address: formData.personal.address,
      });
      
      // Show success message
      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully.",
      });
      
      // Hide loading state
      setLoading({ ...loading, personal: false });
    }, 1000);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.security.currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.security.newPassword !== formData.security.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.security.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    // Show loading state
    setLoading({ ...loading, security: true });
    
    // Simulate API call
    setTimeout(() => {
      // Reset password fields
      setFormData({
        ...formData,
        security: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }
      });
      
      // Show success message
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      
      // Hide loading state
      setLoading({ ...loading, security: false });
    }, 1000);
  };

  const handleLogout = () => {
    // Simulate logout
    toast({
      title: "Logging Out",
      description: "You have been logged out of your account",
    });
    
    // In a real app, you would redirect to login page or home
    // navigate('/login');
  };

  return (
    <div className="page-container max-w-5xl mx-auto">
      <PageHeader 
        title="Profile" 
        description="View and update your profile information."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-4 pt-6">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-16 w-16 text-blue-500" />
                </div>
              </div>
              <CardTitle className="text-center mt-4">{user.name}</CardTitle>
              <CardDescription className="text-center">{user.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="line-clamp-2">{user.address}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Member since {user.joinDate}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 pb-6">
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="mt-4">
              <Card>
                <form onSubmit={handlePersonalSubmit}>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information and contact details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={formData.personal.name} 
                          onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={formData.personal.email} 
                          onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={formData.personal.phone} 
                          onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={user.role} disabled />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        value={formData.personal.address} 
                        onChange={(e) => handleInputChange('personal', 'address', e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button className="flex items-center" type="submit" disabled={loading.personal}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading.personal ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-4">
              <Card>
                <form onSubmit={handleSecuritySubmit}>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your password and security preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={formData.security.currentPassword}
                        onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={formData.security.newPassword}
                          onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={formData.security.confirmPassword}
                          onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Password must be at least 8 characters and include a mix of letters, numbers, and special characters.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button className="flex items-center" type="submit" disabled={loading.security}>
                      <Lock className="mr-2 h-4 w-4" />
                      {loading.security ? "Updating..." : "Update Password"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
