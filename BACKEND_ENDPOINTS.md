# Backend Endpoint Contract

Last updated: 2026-03-29
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
      "email": "user@example.com",
      "createdAt": "2026-03-28T10:00:00.000Z"
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

## Leads API

Base route: `/api/v1/organizations/:organizationId/leads`

Authentication:

- Requires `Authorization: Bearer <jwt>`.
- Requires active membership in `organizationId`.

Serialization / key casing:

- Lead payload keys are **snake_case** (not camelCase).
- This applies to request and response bodies for Leads endpoints.

### Lead Enum Values (CRITICAL)

- `gender`:
  - `MALE`
  - `FEMALE`
  - `OTHER`
  - `UNKNOWN`

- `status`:
  - `OPEN`
  - `WON`
  - `LOST`
  - `UNQUALIFIED`

- `priority`:
  - `HOT`
  - `WARM`
  - `COLD`

- `currency`:
  - `USD`
  - `TRY`
  - `EUR`
  - `GBP`

### Lead Object Shape (response)

```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "pipeline_stage_id": "uuid | null",
  "assigned_agent_id": "uuid | null",
  "source_id": "uuid | null",
  "first_name": "John",
  "last_name": "Doe",
  "native_name": "جون دو | null",
  "gender": "UNKNOWN",
  "email": "john@company.com | null",
  "phone_number": "+905551112233",
  "country": "Turkey",
  "timezone": "Europe/Istanbul",
  "primary_language": "en",
  "preferred_language": "tr | null",
  "social_links": {
    "linkedin": "https://linkedin.com/in/john"
  },
  "status": "OPEN",
  "priority": "WARM",
  "estimated_value": "15000.50",
  "currency": "USD",
  "expected_service_date": "2026-04-10T09:00:00.000Z | null",
  "next_follow_up_at": "2026-04-01T12:00:00.000Z | null",
  "created_at": "2026-03-28T10:00:00.000Z",
  "updated_at": "2026-03-28T10:05:00.000Z"
}
```

Notes:

- `estimated_value` is the correct field name (not `budget`).
- `estimated_value` is sent as a string in request DTO and returned as Prisma Decimal JSON value.

### GET /api/v1/organizations/:organizationId/leads

- Query params:
  - `page` (optional, int, default `1`)
  - `limit` (optional, int, default `20`, max `100`)
  - `filters` (optional, JSON string encoded array of filter rules)
  - `status` (optional enum)
  - `priority` (optional enum)

- Advanced `filters` format:
  - JSON array of rules in this shape: `{ "field": string, "operator": "equals" | "in", "value": any }`
  - Allowed fields: `status`, `priority`, `source_id`, `assigned_agent_id`, `country`, `pipeline_stage_id`
  - `source_id`, `assigned_agent_id`, and `pipeline_stage_id` values must be valid UUID strings.
  - `status` and `priority` values must be valid enum values.
  - Disallowed fields are ignored server-side.
  - Invalid JSON payload or invalid filter value types returns `400`.

- Example (`filters` URL-encoded):

```text
?page=1&limit=20&filters=%5B%7B%22field%22%3A%22status%22%2C%22operator%22%3A%22in%22%2C%22value%22%3A%5B%22OPEN%22%2C%22WON%22%5D%7D%2C%7B%22field%22%3A%22country%22%2C%22operator%22%3A%22equals%22%2C%22value%22%3A%22Turkey%22%7D%5D
```

- PBAC behavior:
  - If user has `leads:read_all` (or elevated equivalent such as `leads:manage`, `team_members:manage`, `organization:manage`), returns all org leads.
  - Otherwise returns only leads assigned to current user (`assigned_agent_id = currentUserId`).

- Response 200:

```json
{
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "pipeline_stage_id": null,
      "assigned_agent_id": "uuid",
      "source_id": null,
      "first_name": "John",
      "last_name": "Doe",
      "native_name": null,
      "gender": "UNKNOWN",
      "email": "john@company.com",
      "phone_number": "+905551112233",
      "country": "Turkey",
      "timezone": "Europe/Istanbul",
      "primary_language": "en",
      "preferred_language": null,
      "social_links": null,
      "status": "OPEN",
      "priority": "WARM",
      "estimated_value": "15000.50",
      "currency": "USD",
      "expected_service_date": null,
      "next_follow_up_at": null,
      "created_at": "2026-03-28T10:00:00.000Z",
      "updated_at": "2026-03-28T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /api/v1/organizations/:organizationId/leads

- Body DTO: `CreateLeadDto`

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+905551112233",
  "country": "Turkey",
  "timezone": "Europe/Istanbul",
  "primary_language": "en",
  "native_name": null,
  "gender": "UNKNOWN",
  "email": "john@company.com",
  "preferred_language": null,
  "social_links": {
    "linkedin": "https://linkedin.com/in/john"
  },
  "status": "OPEN",
  "priority": "WARM",
  "estimated_value": "15000.50",
  "currency": "USD",
  "expected_service_date": null,
  "next_follow_up_at": null,
  "pipeline_stage_id": null,
  "assigned_agent_id": "uuid",
  "source_id": null
}
```

- Response 201:
  - Returns created Lead object in snake_case (same shape as Lead Object Shape above).

- Validation rules:
  - If `source_id` is provided, it must belong to the same organization.
  - If `source_id` is provided, it must reference an **active** lead source (`is_active = true`).

### GET /api/v1/organizations/:organizationId/leads/:leadId

- PBAC behavior:
  - Same scope logic as list endpoint.
  - If user cannot read-all and lead belongs to same org but assigned to another user, returns 403 (forbidden).

- Response 200:
  - Returns single Lead object in snake_case.

- Possible errors:
  - `403` when lead exists in org but user is not allowed to access it.
  - `404` when lead does not exist in organization.

### PATCH /api/v1/organizations/:organizationId/leads/:leadId

- Body DTO: `UpdateLeadDto` (all fields optional, same keys as Create DTO)

```json
{
  "status": "WON",
  "priority": "HOT",
  "assigned_agent_id": "uuid",
  "next_follow_up_at": "2026-04-15T09:00:00.000Z"
}
```

- Validation rules:
  - If `assigned_agent_id` is provided, target user must be an ACTIVE member in the same organization.
  - `pipeline_stage_id` and `source_id` must belong to same organization.
  - If `source_id` is provided, it must reference an **active** lead source (`is_active = true`).

- Response 200:
  - Returns updated Lead object in snake_case.

### DELETE /api/v1/organizations/:organizationId/leads/:leadId

- Access control:
  - Requires permission: `leads:delete`.

- Behavior:
  - Delete is scoped by `organization_id` + `leadId`.
  - Cross-organization IDs do not delete records.

- Response 204:
  - No response body.

- Possible errors:
  - `404` when lead does not exist in the specified organization.

## Pipeline Stages API

Base route: `/api/v1/organizations/:organizationId/pipeline-stages`

Authentication:

- Requires `Authorization: Bearer <jwt>`.
- Requires active membership in `organizationId`.

PBAC:

- `GET` is available for all authenticated active members of the organization.
- `POST`, `PATCH`, and `DELETE` require `organization:manage` (admin/manager equivalent).

### GET /api/v1/organizations/:organizationId/pipeline-stages

- Response 200:

```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Qualified",
    "order_index": 1,
    "created_at": "2026-03-29T10:00:00.000Z",
    "updated_at": "2026-03-29T10:00:00.000Z"
  }
]
```

- Sorting:
  - Ordered by `order_index` ascending.

### POST /api/v1/organizations/:organizationId/pipeline-stages

- Body DTO: `CreatePipelineStageDto`

```json
{
  "name": "Negotiation",
  "order_index": 3
}
```

- Response 201:
  - Returns created pipeline stage object.

### PATCH /api/v1/organizations/:organizationId/pipeline-stages/:stageId

- Body DTO: `UpdatePipelineStageDto` (all fields optional)

```json
{
  "name": "Proposal Sent",
  "order_index": 4
}
```

- Response 200:
  - Returns updated pipeline stage object.

### DELETE /api/v1/organizations/:organizationId/pipeline-stages/:stageId

- Response 204:
  - No response body.

## Lead Sources API

Base route: `/api/v1/organizations/:organizationId/lead-sources`

Authentication:

- Requires `Authorization: Bearer <jwt>`.
- Requires active membership in `organizationId`.

PBAC:

- `GET` is available for all authenticated active members of the organization.
- `POST`, `PATCH`, and `DELETE` require `organization:manage` (admin/manager equivalent).

### GET /api/v1/organizations/:organizationId/lead-sources

- Query params:
  - `activeOnly` (optional boolean)
    - `true`: returns only active sources (`is_active = true`) for frontend dropdowns.
    - omitted/`false`: returns all sources (active + inactive), useful for settings management pages.

- Response 200:

```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Facebook Ads",
    "is_active": true,
    "created_at": "2026-03-29T10:00:00.000Z",
    "updated_at": "2026-03-29T10:00:00.000Z"
  }
]
```

### POST /api/v1/organizations/:organizationId/lead-sources

- Body DTO: `CreateLeadSourceDto`

```json
{
  "name": "Referral",
  "is_active": true
}
```

- Response 201:
  - Returns created lead source object.

### PATCH /api/v1/organizations/:organizationId/lead-sources/:sourceId

- Body DTO: `UpdateLeadSourceDto` (all fields optional)

```json
{
  "name": "Organic Search",
  "is_active": false
}
```

- Response 200:
  - Returns updated lead source object.

### DELETE /api/v1/organizations/:organizationId/lead-sources/:sourceId

- Response 204:
  - No response body.
