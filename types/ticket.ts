export enum TicketStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED"
}

export type TicketUpdate = {
  status: TicketStatus
   message: string
   createdBy?: string
   createdAt?: string
 }