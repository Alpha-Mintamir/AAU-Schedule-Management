"use client";

import { useActionState } from "react";
import { setUserRoleAction, setUserStatusAction } from "@/actions/admin";
import { initialActionState } from "@/lib/action-result";

const ROLES = [
  { value: "contributor", label: "Contributor" },
  { value: "trusted_contributor", label: "Trusted Contributor" },
  { value: "reviewer", label: "Reviewer" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Administrator" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

/** Role/status selectors that submit immediately on change. */
export function UserAdminRow({
  user,
  isSelf,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    reputation: number;
  };
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    setUserRoleAction,
    initialActionState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    setUserStatusAction,
    initialActionState,
  );

  return (
    <tr>
      <td className="py-2.5 pr-4">
        <p className="font-medium text-stone-800">
          {user.name}
          {isSelf ? <span className="ml-1.5 text-xs text-stone-400">(you)</span> : null}
        </p>
        <p className="text-xs text-stone-500">{user.email}</p>
      </td>
      <td className="py-2.5 pr-4 text-stone-600">{user.reputation}</td>
      <td className="py-2.5 pr-4">
        <form action={roleAction}>
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={isSelf || rolePending}
            aria-label={`Role for ${user.name}`}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs disabled:opacity-50"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {!roleState.ok && roleState.error ? (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {roleState.error}
            </p>
          ) : null}
        </form>
      </td>
      <td className="py-2.5">
        <form action={statusAction}>
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="status"
            defaultValue={user.status}
            disabled={isSelf || statusPending}
            aria-label={`Status for ${user.name}`}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs disabled:opacity-50"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {!statusState.ok && statusState.error ? (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {statusState.error}
            </p>
          ) : null}
        </form>
      </td>
    </tr>
  );
}
