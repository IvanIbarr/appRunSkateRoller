import React from 'react';
import {ChatThread} from './ChatThread';

interface ChatGeneralProps {
  currentUserId: string;
  currentUserName: string;
  onLatestTimestamp?: (tsMs: number) => void;
}

export const ChatGeneral: React.FC<ChatGeneralProps> = props => (
  <ChatThread {...props} chatType="general" />
);
