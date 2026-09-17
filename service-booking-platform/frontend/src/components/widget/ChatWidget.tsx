import React, { useState } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatPanel } from "./ChatPanel";
import { useMerchant } from "../../context/MerchantContext";

interface ChatWidgetProps {
  initialOpen?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const { profile } = useMerchant();

  return (
    <>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <ChatBubble
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        businessName={profile?.name}
      />
    </>
  );
};
