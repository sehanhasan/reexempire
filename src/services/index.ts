
// Export all services from this index file
export * from "./appointmentService";
export * from "./categoryService";
export * from "./customerService";
export * from "./invoiceService";
export * from "./quotationService";
export * from "./staffService";

// Export service objects for consistent naming
import { customerService } from "./customerService";
import { invoiceService } from "./invoiceService";
import { appointmentService } from "./appointmentService";
import { staffService } from "./staffService";

export {
  customerService,
  invoiceService,
  appointmentService,
  staffService
};
