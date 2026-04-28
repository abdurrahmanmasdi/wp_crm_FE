import { create } from 'zustand';

import type { Lead } from '@/types/leads-generated';

export type ActiveProposal = {
  id?: string;
  [key: string]: unknown;
};

type ProposalStore = {
  activeLead: Lead | null;
  activeProposal: ActiveProposal | null;
  setActiveLead: (lead: Lead | null) => void;
  setActiveProposal: (proposal: ActiveProposal | null) => void;
  resetProposalContext: () => void;
};

export const useProposalStore = create<ProposalStore>()((set) => ({
  activeLead: null,
  activeProposal: null,
  setActiveLead: (lead) => set({ activeLead: lead }),
  setActiveProposal: (proposal) => set({ activeProposal: proposal }),
  resetProposalContext: () => set({ activeLead: null, activeProposal: null }),
}));
