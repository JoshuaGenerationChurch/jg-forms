# Roles and Invitation Access

## Why this exists
- Admin access now uses Spatie roles/permissions (not hardcoded env email lists).
- Registration can be invite-only to prevent open signup.

## Current permissions
- `forms.admin.access`: can access admin Forms and Forms Entries pages.
- `invitations.manage`: can create/revoke invitation links.

## Current roles
- `super-admin`: full forms admin + invitation management.
- `forms-admin`: forms admin + invitation management.
- `requester`: basic user role for non-admin signups (when open registration is enabled).

## Invite-only registration
- Controlled by `WORK_FORMS_INVITE_ONLY_REGISTRATION` in `.env`.
- `true`: `/register` requires a valid invitation token (`?invite=...`).
- `false`: anyone can register, and new users get `requester` role.

## Bootstrap an admin
If an existing user can log in but cannot see admin sidebar items, grant a role:

```bash
php artisan workforms:grant-role user@example.com forms-admin
```

You can also grant `super-admin`:

```bash
php artisan workforms:grant-role user@example.com super-admin
```

## Invitation flow
1. Admin opens `/admin/invitations`.
2. Admin chooses email + role + expiry days.
3. System emails invite link and stores invitation record.
4. Invitee opens link and completes `/register`.
5. System validates token + invited email and assigns invited role.
