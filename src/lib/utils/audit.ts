import { createClient } from "@/lib/supabase/server";

export interface AuditEntry {
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function logAudit(entry: AuditEntry) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userData = user
      ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
      : null;

    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      user_name: userData?.data?.full_name ?? user?.email ?? null,
      action: entry.action,
      module: entry.module,
      entity: entry.entity,
      entity_id: entry.entityId,
      old_data: entry.oldData,
      new_data: entry.newData,
    });
  } catch {
    // Audit logging should never break the main operation
  }
}
