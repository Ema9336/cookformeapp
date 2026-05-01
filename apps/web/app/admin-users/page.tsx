"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "CHEF" | "ADMIN";
  createdAt: string;
};

type PendingConfirm =
  | {
      kind: "single";
      userId: string;
      targetRole: AdminUser["role"];
      adminDemotions: number;
    }
  | {
      kind: "bulk";
      ids: string[];
      targetRole: AdminUser["role"];
      adminDemotions: number;
    };

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleEdits, setRoleEdits] = useState<Record<string, AdminUser["role"]>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<AdminUser["role"]>("CHEF");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | AdminUser["role"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError("");

    adminApi
      .listUsers(accessToken)
      .then((data) => {
        const mapped = data as AdminUser[];
        setUsers(mapped);
        setRoleEdits(Object.fromEntries(mapped.map((u) => [u.id, u.role])));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load users"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const adminCount = useMemo(
    () => users.filter((u) => roleEdits[u.id] === "ADMIN").length,
    [users, roleEdits],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const roleValue = roleEdits[u.id] ?? u.role;
      const matchesRole = roleFilter === "ALL" || roleValue === roleFilter;
      const matchesText =
        q.length === 0 ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesRole && matchesText;
    });
  }, [users, roleEdits, roleFilter, searchQuery]);

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredUsers.some((u) => u.id === id));
      }
      const merged = new Set([...prev, ...filteredUsers.map((u) => u.id)]);
      return Array.from(merged);
    });
  };

  const applySingleRoleChange = async (userId: string, nextRole: AdminUser["role"]) => {
    if (!accessToken) return;
    const current = users.find((u) => u.id === userId);
    if (!current || current.role === nextRole) return;

    setActionError("");
    setActionSuccess("");
    setSavingUserId(userId);

    try {
      const updated = (await adminApi.updateUserRole(accessToken, userId, nextRole)) as AdminUser;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      setRoleEdits((prev) => ({ ...prev, [userId]: updated.role }));
      setActionSuccess(`Updated ${updated.email} to ${updated.role}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update role");
      setRoleEdits((prev) => ({ ...prev, [userId]: current.role }));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleSave = async (userId: string) => {
    const nextRole = roleEdits[userId];
    const current = users.find((u) => u.id === userId);
    if (!current || !nextRole || current.role === nextRole) return;

    const adminDemotions = current.role === "ADMIN" && nextRole !== "ADMIN" ? 1 : 0;
    if (adminDemotions > 0) {
      setPendingConfirm({ kind: "single", userId, targetRole: nextRole, adminDemotions });
      return;
    }

    await applySingleRoleChange(userId, nextRole);
  };

  const applyBulkRoleChange = async (ids: string[], targetRole: AdminUser["role"]) => {
    if (!accessToken || ids.length === 0) return;

    setActionError("");
    setActionSuccess("");
    setBulkSaving(true);

    try {
      const updated = (await adminApi.updateUserRolesBulk(accessToken, ids, targetRole)) as AdminUser[];
      const updatedMap = new Map(updated.map((u) => [u.id, u]));
      setUsers((prev) => prev.map((u) => updatedMap.get(u.id) ?? u));
      setRoleEdits((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = targetRole;
        return next;
      });
      setActionSuccess(`Updated ${updated.length} user${updated.length === 1 ? "" : "s"} to ${targetRole}`);
      setSelectedIds([]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update selected users");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;

    const adminDemotions =
      bulkRole === "ADMIN"
        ? 0
        : users.filter((u) => selectedIds.includes(u.id) && u.role === "ADMIN").length;

    if (adminDemotions > 0) {
      setPendingConfirm({ kind: "bulk", ids: selectedIds, targetRole: bulkRole, adminDemotions });
      return;
    }

    await applyBulkRoleChange(selectedIds, bulkRole);
  };

  const confirmPendingAction = async () => {
    if (!pendingConfirm) return;
    const payload = pendingConfirm;
    setPendingConfirm(null);

    if (payload.kind === "single") {
      await applySingleRoleChange(payload.userId, payload.targetRole);
      return;
    }

    await applyBulkRoleChange(payload.ids, payload.targetRole);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              ← Home
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-compliance" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Compliance
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-audit" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Audit Logs
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-analytics" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Analytics
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <h1 className="font-bold text-xl">User Roles</h1>
          </div>
          <span className="text-xs font-semibold bg-black text-white dark:bg-white dark:text-black px-2.5 py-1 rounded-full">
            {adminCount} admin{adminCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {loadError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {loadError}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{users.filter((u) => roleEdits[u.id] === "CHEF").length}</p>
            <p className="text-sm text-gray-500">Chefs</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminCount}</p>
            <p className="text-sm text-gray-500">Admins</p>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Role</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "ALL" | AdminUser["role"])}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              >
                <option value="ALL">ALL</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="CHEF">CHEF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Selected: {selectedIds.length}</span>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value as AdminUser["role"])}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-xs"
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="CHEF">CHEF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button
              onClick={handleBulkApply}
              disabled={selectedIds.length === 0 || bulkSaving}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white disabled:opacity-40"
            >
              {bulkSaving ? "Applying…" : "Apply to Selected"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-900">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                aria-label="Select all filtered users"
              />
            </div>
            <div className="col-span-2">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Current Role</div>
            <div className="col-span-2">New Role</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No users found.</div>
          ) : (
            filteredUsers.map((u) => {
              const edited = roleEdits[u.id] ?? u.role;
              const dirty = edited !== u.role;
              return (
                <div key={u.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-b-0 border-gray-100 dark:border-gray-900">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={() => toggleRowSelection(u.id)}
                      aria-label={`Select ${u.email}`}
                    />
                  </div>
                  <div className="col-span-2 text-sm font-medium truncate">{u.name}</div>
                  <div className="col-span-4 text-sm text-gray-500 truncate">{u.email}</div>
                  <div className="col-span-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                      {u.role}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={edited}
                      onChange={(e) =>
                        setRoleEdits((prev) => ({
                          ...prev,
                          [u.id]: e.target.value as AdminUser["role"],
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-xs"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="CHEF">CHEF</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      disabled={!dirty || savingUserId === u.id}
                      onClick={() => handleSave(u.id)}
                      className="text-xs px-3 py-1.5 rounded-full bg-green-600 text-white disabled:opacity-40"
                    >
                      {savingUserId === u.id ? "…" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingConfirm(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold">Confirm Risky Role Change</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This action will demote {pendingConfirm.adminDemotions} admin{pendingConfirm.adminDemotions === 1 ? "" : "s"} to {pendingConfirm.targetRole}.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
              If this includes the last admin account, the API will block the action.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingConfirm(null)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmPendingAction()}
                className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
