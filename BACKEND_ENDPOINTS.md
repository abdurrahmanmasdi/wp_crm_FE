# Backend Endpoint Contract

Last updated: 2026-03-28
Base URL prefix: `/api/v1`

All endpoints require `Authorization: Bearer <jwt>` unless noted as Public.

## Auth Routes

### POST /api/v1/auth/login

- Body DTO: `LoginDto`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- Response 201:

```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2026-03-28T10:00:00.000Z",
    "permissions": ["leads:read", "leads:create"]
  }
}
```

### POST /api/v1/auth/register (Public)

- Body DTO: `RegisterDto`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "inviteToken": "optional_invitation_token"
}
```

- Response 201:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2026-03-28T10:00:00.000Z"
}
```

### GET /api/v1/auth/me

- Headers:
  - Optional: `x-organization-id: <organization-uuid>`
- Body: none
- Response 200:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2026-03-28T10:00:00.000Z",
  "permissions": ["leads:read"]
}
```

## Organization Routes

### POST /api/v1/organizations

- Body DTO: `CreateOrganizationDto`

```json
{
  "name": "Acme Corporation",
  "slug": "acme-corporation",
  "is_public": false
}
```

- Response 201:

```json
{
  "id": "uuid",
  "name": "Acme Corporation",
  "slug": "acme-corporation",
  "is_public": false,
  "created_at": "2026-03-28T10:00:00.000Z"
}
```

### POST /api/v1/organizations/join

- Body DTO: `JoinOrganizationDto`

```json
{
  "slug": "acme-corporation"
}
```

- Response 201:

```json
{
  "message": "Join request created successfully. Awaiting approval.",
  "organizationId": "uuid"
}
```

### GET /api/v1/organizations/:id/members

- Body: none
- Response 200:

```json
[
  {
    "membershipId": "uuid",
    "organizationId": "uuid",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "role": {
      "id": "uuid",
      "name": "Agent"
    },
    "status": "ACTIVE"
  }
]
```

## Membership Routes

### GET /api/v1/organizations/:id/requests

- Body: none
- Response 200:

```json
[
  {
    "membershipId": "uuid",
    "organizationId": "uuid",
    "status": "PENDING",
    "requestedAt": "2026-03-28T10:00:00.000Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "createdAt": "2026-03-28T10:00:00.000Z"
    }
  }
]
```

### POST /api/v1/organizations/:id/requests/:membershipId/approve

- Body DTO: `ApproveMembershipRequestDto`

```json
{
  "roleId": "uuid"
}
```

- Response 200:

```json
{
  "message": "Join request approved successfully.",
  "membershipId": "uuid",
  "status": "ACTIVE"
}
```

### POST /api/v1/organizations/:id/requests/:membershipId/reject

- Body: none
- Response 200:

```json
{
  "message": "Join request rejected successfully.",
  "membershipId": "uuid",
  "status": "REJECTED"
}
```

### DELETE /api/v1/users/me/requests/:id/cancel

- Body: none
- Response 200:

```json
{
  "message": "Request cancelled successfully."
}
```

## Invitation Routes

### POST /api/v1/organizations/:organizationId/invite

- Body DTO: `InviteToOrganizationDto`

```json
{
  "email": "invitee@example.com",
  "roleId": "uuid"
}
```

- Response 201:

```json
{
  "inviteUrl": "https://frontend.example.com/invite/<token>",
  "token": "hex_token"
}
```

### GET /api/v1/organizations/:id/invitations

- Access: Owner/Admin/Manager membership in the target organization
- Body: none
- Response 200:

```json
[
  {
    "id": "uuid",
    "email": "invitee@example.com",
    "status": "pending",
    "created_at": "2026-03-28T10:00:00.000Z",
    "role": {
      "id": "uuid",
      "name": "Agent"
    }
  }
]
```

### GET /api/v1/organizations/invitations/:token (Public)

- Body: none
- Response 200:

```json
{
  "organizationName": "Acme Inc",
  "roleName": "Agent",
  "email": "invitee@example.com",
  "status": "pending"
}
```

### POST /api/v1/organizations/invitations/:token/accept

- Body: none
- Response 200:

```json
{
  "message": "Successfully joined organization \"Acme Inc\".",
  "organizationId": "uuid",
  "membershipId": "uuid"
}
```

### POST /api/v1/users/invites/:inviteId/accept

- Body: none
- Response 200:

```json
{
  "message": "Successfully joined organization \"Acme Inc\".",
  "membership_id": "uuid",
  "organization_name": "Acme Inc",
  "role": "Agent"
}
```

## User Utility Routes Related To Permissions/Workspace

### GET /api/v1/users/me

- Headers:
  - Optional: `x-organization-id: <organization-uuid>`
- Body: none
- Response 200:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2026-03-28T10:00:00.000Z",
  "permissions": ["leads:read"]
}
```

### GET /api/v1/users/me/permissions

- Headers:
  - Required: `x-organization-id: <organization-uuid>`
- Body: none
- Response 200:

```json
{
  "permissions": ["leads:create", "team_members:manage"]
}
```

### GET /api/v1/users/me/organizations

- Body: none
- Response 200:

```json
[
  {
    "membership_id": "uuid",
    "organization_id": "uuid",
    "role_id": "uuid",
    "status": "ACTIVE",
    "created_at": "2026-03-28T10:00:00.000Z",
    "organization": {
      "id": "uuid",
      "name": "Acme Inc",
      "slug": "acme-inc",
      "is_public": false,
      "created_at": "2026-03-28T10:00:00.000Z"
    },
    "role": {
      "id": "uuid",
      "name": "Agent"
    }
  }
]
```
