"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, UserCheck, UserX } from "lucide-react";
import { updateUserRole, toggleUserStatus, createUserAccount } from "@/lib/actions/admin";
import { USER_ROLES, MEMBER_STATUSES, MEMBERSHIP_TYPES } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { FormInput, FormSubmitButton } from "@/components/forms";
import { FormSelect } from "@/components/forms/form-select";
import { PageActions } from "@/components/admin/page-actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Profile } from "@/types/database";

const initialMemberFields = {
  phone: "",
  father_name: "",
  address: "",
  occupation: "",
  blood_group: "",
  emergency_contact: "",
  date_joined: "",
  membership_type: "regular",
  status: "active",
  notes: "",
};

const userStatuses = [
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "inactive", label: "Inactive", color: "text-red-600" },
];

interface UsersClientProps {
  data: Profile[];
  currentRole: string | null;
}

export function UsersClient({ data, currentRole }: UsersClientProps) {
  const router = useRouter();

  const canManage = currentRole === "super_admin" || currentRole === "admin";

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [search, setSearch] = useState("");

  const [isUpdatingRole, startRoleTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createFields, setCreateFields] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
  });
  const [alsoAddMember, setAlsoAddMember] = useState(false);
  const [memberFields, setMemberFields] = useState(initialMemberFields);

  const handleCreate = async () => {
    if (!createFields.email || !createFields.password) {
      setCreateError("Email and password are required");
      return;
    }
    if (alsoAddMember && !memberFields.phone) {
      setCreateError("Phone is required when adding as a mosque member");
      return;
    }
    setCreating(true);
    setCreateError("");
    const fd = new FormData();
    fd.set("full_name", createFields.full_name);
    fd.set("email", createFields.email);
    fd.set("password", createFields.password);
    fd.set("role", createFields.role || "member");
    if (alsoAddMember) {
      fd.set("create_member", "on");
      Object.entries(memberFields).forEach(([key, value]) => {
        if (value) fd.set(key, value);
      });
    }
    const res = await createUserAccount(fd);
    setCreating(false);
    if (res?.error) {
      setCreateError(res.error);
    } else {
      toast.success("User account created. Share the email & password with them.");
      if (res?.warning) toast.warning(res.warning);
      setCreateOpen(false);
      setCreateFields({ full_name: "", email: "", password: "", role: "" });
      setAlsoAddMember(false);
      setMemberFields(initialMemberFields);
      router.refresh();
    }
  };

  const handleToggleStatus = (user: Profile) => {
    startToggleTransition(async () => {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const fd = new FormData();
      fd.set("id", user.id);
      fd.set("status", newStatus);
      const result = await toggleUserStatus(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"}`);
        router.refresh();
      }
    });
  };

  const openRoleDialog = (user: Profile) => {
    setSelectedUser(user);
    setSelectedRole(user.role ?? "member");
    setRoleDialogOpen(true);
  };

  const handleRoleSubmit = () => {
    if (!selectedUser) return;
    startRoleTransition(async () => {
      const fd = new FormData();
      fd.set("id", selectedUser.id);
      fd.set("role", selectedRole);
      const result = await updateUserRole(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated");
        router.refresh();
        setRoleDialogOpen(false);
        setSelectedUser(null);
      }
    });
  };

  const filtered = data.filter((user) => {
    if (statusFilter !== "__all__" && user.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: Column<Profile>[] = [
    { key: "full_name", header: "Name", cell: (row) => (
      <div>
        <p className="font-medium">{row.full_name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    )},
    { key: "role", header: "Role", cell: (row) => (
      <span className="capitalize">{row.role?.replace("_", " ") ?? "—"}</span>
    )},
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={userStatuses} />
    )},
    { key: "created_at", header: "Joined", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span>
    )},
    { key: "actions", header: "", cell: (row) => (
      <div className="flex items-center gap-1">
        {canManage && (
          <>
            <Button variant="ghost" size="icon" title="Change Role" onClick={(e) => { e.stopPropagation(); openRoleDialog(row); }}>
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title={row.status === "active" ? "Deactivate" : "Activate"}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              disabled={isToggling}
            >
              {row.status === "active" ? (
                <UserX className="h-4 w-4 text-destructive" />
              ) : (
                <UserCheck className="h-4 w-4 text-green-600" />
              )}
            </Button>
          </>
        )}
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage user accounts and roles">
        {currentRole === "super_admin" && (
          <PageActions onNew={() => setCreateOpen(true)} newLabel="Add User" />
        )}
      </PageHeader>

      {!canManage && (
        <div className="rounded-xl bg-amber-50 text-amber-800 text-sm p-3 border border-amber-200">
          Your role does not allow changing users, roles, or status. This list is read-only for you.
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: userStatuses.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={filtered.length === 0} emptyTitle="No users">
        <DataTable columns={columns} data={filtered} />
      </AdminTableWrapper>

      <FormDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        title="Change User Role"
        description={selectedUser ? `Updating role for ${selectedUser.full_name}` : undefined}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleSubmit} disabled={isUpdatingRole}>
              {isUpdatingRole ? "Saving..." : "Save Role"}
            </Button>
          </div>
        }
      >
        <FormSelect
          label="Role"
          name="role"
          value={selectedRole}
          onValueChange={setSelectedRole}
          options={USER_ROLES.map((r) => ({ value: r.value, label: r.label }))}
        />
      </FormDialog>

      <FormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateError("");
        }}
        title="Create User Account"
        description="Creates an account that can sign in immediately using this email and password."
      >
        <div className="space-y-4">
          {createError && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
              {createError}
            </div>
          )}
          <FormInput
            label="Full name"
            name="new_full_name"
            value={createFields.full_name}
            onChange={(e) => setCreateFields({ ...createFields, full_name: e.target.value })}
            placeholder="John Doe"
          />
          <FormInput
            label="Email"
            name="new_email"
            type="email"
            value={createFields.email}
            onChange={(e) => setCreateFields({ ...createFields, email: e.target.value })}
            placeholder="user@example.com"
            required
          />
          <FormInput
            label="Password"
            name="new_password"
            type="password"
            value={createFields.password}
            onChange={(e) => setCreateFields({ ...createFields, password: e.target.value })}
            placeholder="Min 6 characters"
            required
          />
          <FormSelect
            label="Role"
            name="new_role"
            value={createFields.role}
            onValueChange={(v) => setCreateFields({ ...createFields, role: v })}
            options={USER_ROLES.map((r) => ({ value: r.value, label: r.label }))}
            placeholder="Member (default)"
          />
          <div className="flex items-center justify-between gap-4 rounded-xl border border-black/5 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium">আরও mosque member হিসেবে যোগ করুন</p>
              <p className="text-xs text-muted-foreground">
                Account-এর সাথে linked member record-ও তৈরি হবে
              </p>
            </div>
            <Switch checked={alsoAddMember} onCheckedChange={setAlsoAddMember} />
          </div>
          {alsoAddMember && (
            <div className="space-y-4 rounded-xl border border-black/5 bg-slate-50 p-3">
              <FormInput
                label="Phone"
                name="member_phone"
                value={memberFields.phone}
                onChange={(e) => setMemberFields({ ...memberFields, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Membership Type"
                  name="member_membership_type"
                  value={memberFields.membership_type}
                  onValueChange={(v) => setMemberFields({ ...memberFields, membership_type: v })}
                  options={MEMBERSHIP_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
                <FormSelect
                  label="Status"
                  name="member_status"
                  value={memberFields.status}
                  onValueChange={(v) => setMemberFields({ ...memberFields, status: v })}
                  options={MEMBER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Father's Name"
                  name="member_father_name"
                  value={memberFields.father_name}
                  onChange={(e) => setMemberFields({ ...memberFields, father_name: e.target.value })}
                />
                <FormInput
                  label="Address"
                  name="member_address"
                  value={memberFields.address}
                  onChange={(e) => setMemberFields({ ...memberFields, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Occupation"
                  name="member_occupation"
                  value={memberFields.occupation}
                  onChange={(e) => setMemberFields({ ...memberFields, occupation: e.target.value })}
                />
                <FormInput
                  label="Blood Group"
                  name="member_blood_group"
                  value={memberFields.blood_group}
                  onChange={(e) => setMemberFields({ ...memberFields, blood_group: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Emergency Contact"
                  name="member_emergency_contact"
                  value={memberFields.emergency_contact}
                  onChange={(e) => setMemberFields({ ...memberFields, emergency_contact: e.target.value })}
                />
                <FormInput
                  label="Date Joined"
                  name="member_date_joined"
                  type="date"
                  value={memberFields.date_joined}
                  onChange={(e) => setMemberFields({ ...memberFields, date_joined: e.target.value })}
                />
              </div>
              <FormInput
                label="Notes"
                name="member_notes"
                value={memberFields.notes}
                onChange={(e) => setMemberFields({ ...memberFields, notes: e.target.value })}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton loading={creating} onClick={handleCreate}>
              Create Account
            </FormSubmitButton>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
