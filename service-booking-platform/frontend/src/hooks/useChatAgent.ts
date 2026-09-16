import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "../types/booking.types";
import type { Category, Service } from "../types/catalog.types";
import { catalogApi } from "../services/catalogApi";
import { bookingApi } from "../services/bookingApi";

const MERCHANT_ID = import.meta.env.VITE_MERCHANT_ID || "00000000-0000-0000-0000-000000000001";

type AgentPhase =
  | "greeting"
  | "browse_categories"
  | "browse_services"
  | "collect_name"
  | "collect_phone"
  | "collect_note"
  | "confirm"
  | "completed"
  | "status_inquiry"
  | "cancellation";

export function useChatAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<AgentPhase>("greeting");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeServiceCard, setActiveServiceCard] = useState<Service | null>(null);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const [isAwaitingFeedback, setIsAwaitingFeedback] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const slots = useRef<{
    service_id: string;
    customer_name: string;
    customer_phone: string;
    note: string;
  }>({ service_id: "", customer_name: "", customer_phone: "", note: "" });

  const addMessage = useCallback((sender: "user" | "agent", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, sender, text, timestamp: Date.now() },
    ]);
  }, []);

  const initChat = useCallback(async () => {
    try {
      const res = await catalogApi.getCategories(MERCHANT_ID);
      if (res.data.length === 0) {
        setCatalogUnavailable(true);
        return;
      }
      setCategories(res.data);
      addMessage("agent", "Welcome! I can help you book a service. Here are our available categories:");
      setPhase("browse_categories");
    } catch {
      setCatalogUnavailable(true);
    }
  }, [addMessage]);

  const selectCategory = useCallback(
    async (categoryId: string) => {
      try {
        const res = await catalogApi.getServicesByCategory(categoryId);
        setServices(res.data);
        addMessage("agent", "Here are the available services. Please select one:");
        setPhase("browse_services");
      } catch {
        addMessage("agent", "Sorry, I couldn't load the services. Please try again.");
      }
    },
    [addMessage]
  );

  const selectService = useCallback(
    (service: Service) => {
      slots.current.service_id = service.id;
      setActiveServiceCard(service);
      addMessage("agent", `Great choice! "${service.name}". To proceed, I'll need your full name.`);
      setPhase("collect_name");
    },
    [addMessage]
  );

  const confirmBooking = useCallback(
    async (serviceId: string) => {
      selectService(services.find((s) => s.id === serviceId) || services[0]);
    },
    [services, selectService]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      addMessage("user", text);

      switch (phase) {
        case "collect_name":
          slots.current.customer_name = text;
          addMessage("agent", `Thanks, ${text}. Now please share your phone number.`);
          setPhase("collect_phone");
          break;

        case "collect_phone":
          slots.current.customer_phone = text;
          addMessage("agent", "Would you like to add any notes or special requests? (Type 'no' to skip)");
          setPhase("collect_note");
          break;

        case "collect_note":
          slots.current.note = text.toLowerCase() === "no" ? "" : text;
          {
            const svc = activeServiceCard;
            addMessage(
              "agent",
              `Please confirm your booking:\n• Service: ${svc?.name}\n• Name: ${slots.current.customer_name}\n• Phone: ${slots.current.customer_phone}\n• Note: ${slots.current.note || "None"}\n\nType "yes" to confirm or "no" to make changes.`
            );
          }
          setPhase("confirm");
          break;

        case "confirm":
          if (text.toLowerCase() === "yes") {
            try {
              const res = await bookingApi.createBooking({
                merchant_id: MERCHANT_ID,
                service_id: slots.current.service_id,
                customer_name: slots.current.customer_name,
                customer_phone: slots.current.customer_phone,
                note: slots.current.note || undefined,
              });
              setBookingId(res.data.booking_id);
              addMessage(
                "agent",
                `Your booking has been created! 🎉\n\nBooking ID: ${res.data.booking_id}\n\nA staff member will contact you shortly to finalize the details. Please keep your Booking ID safe for future reference.`
              );
              setPhase("completed");
              setIsAwaitingFeedback(true);
            } catch {
              addMessage("agent", "Sorry, there was an error creating your booking. Please try again.");
            }
          } else {
            addMessage("agent", "No problem! Let's start over. What's your full name?");
            setPhase("collect_name");
          }
          break;

        default:
          addMessage("agent", "I'm not sure what you mean. Let me help you get started.");
          break;
      }
    },
    [phase, addMessage, activeServiceCard]
  );

  const submitFeedback = useCallback(
    async (_rating: number, _comment: string) => {
      setIsAwaitingFeedback(false);
      addMessage("agent", "Thank you for your feedback! Have a great day. 😊");
    },
    [addMessage]
  );

  return {
    messages,
    categories,
    services,
    activeServiceCard,
    catalogUnavailable,
    isAwaitingFeedback,
    bookingId,
    phase,
    initChat,
    selectCategory,
    selectService,
    confirmBooking,
    sendMessage,
    submitFeedback,
  };
}
