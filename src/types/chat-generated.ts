export interface ConversationUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LatestMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender: ConversationUser;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  user: ConversationUser;
}

export interface Conversation {
  id: string;
  organization_id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  messages?: LatestMessage[];
  participants: ConversationParticipant[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender: ConversationUser;
}
