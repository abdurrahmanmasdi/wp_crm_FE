type OrganizationId = string | null | undefined;
type MembershipId = string | null | undefined;
type ConversationId = string | null | undefined;
type LeadId = string | null | undefined;

export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
    routeMemberships: (hasUser: boolean) =>
      ['auth', 'route-memberships', hasUser] as const,
    myMemberships: () => ['auth', 'my-memberships'] as const,
  },

  leads: {
    base: (orgId: OrganizationId) => ['leads', orgId] as const,
    all: (orgId: OrganizationId, filters?: Record<string, unknown>) =>
      ['leads', orgId, filters ?? {}] as const,
    detail: (orgId: OrganizationId, leadId: LeadId) =>
      ['leads', 'detail', orgId, leadId] as const,
    notes: (orgId: OrganizationId, leadId: LeadId) =>
      ['leads', 'notes', orgId, leadId] as const,
    attachments: (orgId: OrganizationId, leadId: LeadId) =>
      ['leads', 'attachments', orgId, leadId] as const,
    formMembers: (orgId: OrganizationId) =>
      ['leads', 'form-members', orgId] as const,
  },

  chat: {
    conversations: (orgId: OrganizationId) =>
      ['chat', 'conversations', orgId] as const,
    messages: (orgId: OrganizationId, conversationId: ConversationId) =>
      ['chat', 'messages', orgId, conversationId] as const,
  },

  organizations: {
    members: (orgId: OrganizationId) =>
      ['organizations', 'members', orgId] as const,
    invitations: (orgId: OrganizationId) =>
      ['organizations', 'invitations', orgId] as const,
    invitationDetails: (token: string) =>
      ['organizations', 'invitation-details', token] as const,
    accessRequests: (orgId: OrganizationId) =>
      ['organizations', 'access-requests', orgId] as const,
    settings: (orgId: OrganizationId) =>
      ['organizations', 'settings', orgId] as const,
  },

  permissions: {
    all: () => ['permissions'] as const,
    breakdown: (orgId: OrganizationId, membershipId: MembershipId) =>
      ['permissions', 'breakdown', orgId, membershipId] as const,
  },

  roles: {
    all: (orgId: OrganizationId) => ['roles', orgId] as const,
  },

  crmSettings: {
    pipelineStages: (orgId: OrganizationId) =>
      ['crm-settings', 'pipeline-stages', orgId] as const,
    leadSourcesBase: (orgId: OrganizationId) =>
      ['crm-settings', 'lead-sources', orgId] as const,
    leadSources: (orgId: OrganizationId, scope: 'active' | 'all' = 'all') =>
      ['crm-settings', 'lead-sources', orgId, scope] as const,
  },

  analytics: {
    dashboard: (orgId: string) => ['analytics', 'dashboard', orgId] as const,
  },
} as const;
