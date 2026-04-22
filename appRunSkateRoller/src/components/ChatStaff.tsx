import React from 'react';
import {ChatThread} from './ChatThread';

interface ChatStaffProps {
  currentUserId: string;
  currentUserName: string;
  onLatestTimestamp?: (tsMs: number) => void;
}

export const ChatStaff: React.FC<ChatStaffProps> = props => (
  <ChatThread {...props} chatType="staff" />
);
