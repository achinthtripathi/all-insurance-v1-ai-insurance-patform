import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AuditAction = Database["public"]["Tables"]["audit_logs"]["Insert"]["action_type"];
type AuditEntity = Database["public"]["Tables"]["audit_logs"]["Insert"]["entity_type"];
type AuditDetails = Database["public"]["Tables"]["audit_logs"]["Insert"]["details"];

/**
 * Audit logging utility for tracking user actions across the application.
 * 
 * @example
 * ```ts
 * logAuditEvent('create', 'document', documentId, { 
 *   file_name: 'certificate.pdf',
 *   named_insured: 'ABC Corp' 
 * });
 * ```
 */
interface AuditEventParams {
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string | null;
  details?: AuditDetails;
}

/**
 * Logs an audit event to the database.
 * 
 * This function is non-blocking and will not throw errors to prevent
 * audit logging failures from disrupting the main application flow.
 * 
 * @param action - The type of action performed (e.g., 'create', 'update', 'delete')
 * @param entityType - The type of entity being acted upon (e.g., 'document', 'requirement_set')
 * @param entityId - Optional ID of the entity being acted upon
 * @param details - Optional additional context about the action
 * 
 * @returns Promise that resolves when logging is complete (never rejects)
 */
export async function logAuditEvent(
  action: AuditAction,
  entityType: AuditEntity,
  entityId?: string | null,
  details?: AuditDetails
): Promise<void> {
  try {
    // Get current authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('[Audit] Failed to get user session:', sessionError.message);
      return;
    }

    if (!session?.user?.id) {
      console.warn('[Audit] No authenticated user, skipping audit log');
      return;
    }

    // Insert audit log record
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action_type: action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
      });

    if (insertError) {
      console.error('[Audit] Failed to insert audit log:', insertError.message);
      return;
    }

    console.info(`[Audit] Logged ${action} on ${entityType}${entityId ? ` (${entityId})` : ''}`);
  } catch (error) {
    // Catch-all to ensure audit logging never throws
    console.error('[Audit] Unexpected error during audit logging:', error);
  }
}

/**
 * Batch logs multiple audit events.
 * Useful when multiple related actions occur in a single transaction.
 * 
 * @param events - Array of audit events to log
 * @returns Promise that resolves when all logging is complete
 */
export async function logAuditEvents(events: AuditEventParams[]): Promise<void> {
  await Promise.all(
    events.map(event => 
      logAuditEvent(event.action, event.entityType, event.entityId, event.details)
    )
  );
}
