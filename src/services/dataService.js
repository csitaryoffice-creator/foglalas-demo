// Demo repository adapter. The booking and admin layers keep using the same
// repository contract, while all writes stay inside the current browser tab.
import { createCollectionRepository } from "@/demo/sessionStore";

export const providers = createCollectionRepository("providers");
export const categories = createCollectionRepository("categories");
export const services = createCollectionRepository("services");
export const availabilityRules = createCollectionRepository("availabilityRules");
export const availabilityExceptions = createCollectionRepository("availabilityExceptions");
export const bookings = createCollectionRepository("bookings");
export const operationLogs = createCollectionRepository("operationLogs");
export const settings = createCollectionRepository("settings");
