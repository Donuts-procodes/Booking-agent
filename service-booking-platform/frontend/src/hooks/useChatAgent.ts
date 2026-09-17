import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "../types/booking.types";
import type { Category, Service } from "../types/catalog.types";
import { catalogApi } from "../services/catalogApi";
import { bookingApi } from "../services/bookingApi";
import { useMerchant } from "../context/MerchantContext";

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
  const { merchantId, profile } = useMerchant();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<AgentPhase>("greeting");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [suggestionChips, setSuggestionChips] = useState<string[]>([]);
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

  const categoriesRef = useRef<Category[]>([]);

  const addMessage = useCallback((sender: "user" | "agent", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, sender, text, timestamp: Date.now() },
    ]);
  }, []);

  const initialized = useRef(false);

  const initChat = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const [catRes, infoRes] = await Promise.allSettled([
        catalogApi.getCategories(merchantId),
        catalogApi.getMerchantInfo(merchantId),
      ]);

      const categoriesData = catRes.status === "fulfilled" ? catRes.value.data : [];
      const infoData = infoRes.status === "fulfilled" ? infoRes.value.data : null;

      if (categoriesData.length === 0) {
        setCatalogUnavailable(true);
        return;
      }
      categoriesRef.current = categoriesData;
      setCategories(categoriesData);
      setSuggestionChips(categoriesData.slice(0, 5).map((c) => c.name));

      let welcomeText = "";
      if (infoData?.agent_greeting) {
        welcomeText = infoData.agent_greeting;
      } else {
        const merchantTitle = infoData?.name && infoData.name !== "Default Service Business" ? infoData.name : "";
        const categoryHighlights = categoriesData.slice(0, 3).map((c) => c.name).join(", ");
        const moreCount = categoriesData.length > 3 ? ` and ${categoriesData.length - 3} more` : "";

        welcomeText = merchantTitle
          ? `Welcome to ${merchantTitle}! We offer services across ${categoryHighlights}${moreCount}. What can I help you book today?`
          : `Welcome! We offer services across ${categoryHighlights}${moreCount}. Which service can I help you with today?`;
      }

      setMessages([{ id: `init-${Date.now()}`, sender: "agent", text: welcomeText, timestamp: Date.now() }]);
      setPhase("greeting");
    } catch {
      setCatalogUnavailable(true);
    }
  }, [merchantId]);

  const selectCategory = useCallback(
    async (categoryId: string) => {
      try {
        const res = await catalogApi.getServicesByCategory(categoryId);
        setServices(res.data);
        setSuggestionChips(res.data.slice(0, 4).map((s) => s.name));
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
      setSuggestionChips([]);
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
          if (text.trim().length < 7) {
            addMessage("agent", "Please enter a valid phone number (at least 7 digits, e.g., +1234567890 or 9876543210).");
            return;
          }
          slots.current.customer_phone = text.trim();
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
                merchant_id: merchantId,
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

        case "greeting":
        case "browse_categories": {
          const lower = text.toLowerCase().trim();
          const currentCategories = categoriesRef.current.length > 0 ? categoriesRef.current : categories;

          const matchedCat = currentCategories.find(
            (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
          );
          if (matchedCat) {
            selectCategory(matchedCat.id);
            return;
          }

          try {
            const chatRes = await catalogApi.sendChatMessage({
              merchant_id: merchantId,
              message: text,
              history: messages.slice(-4).map((m) => ({
                role: m.sender === "agent" ? "assistant" : "user",
                content: m.text,
              })),
            });

            if (chatRes.data.matching_services && chatRes.data.matching_services.length > 0) {
              setServices(chatRes.data.matching_services);
              setPhase("browse_services");
            }

            if (chatRes.data.suggestion_chips?.length) {
              setSuggestionChips(chatRes.data.suggestion_chips);
            }

            addMessage("agent", chatRes.data.response);
            return;
          } catch {
            const brandNames = currentCategories.slice(0, 6).map((c) => c.name).join(", ");
            addMessage(
              "agent",
              `I can help you explore our services. Available categories: ${brandNames || "various options"}. Which area are you interested in?`
            );
            setPhase("browse_categories");
          }
          break;
        }

        case "browse_services": {
          const lower = text.toLowerCase().trim();
          if (["hello", "hi", "hey"].includes(lower)) {
            addMessage("agent", "Hello! Please select one of the cards above to proceed with booking.");
            return;
          }
          const matchedSvc = services.find((s) => s.name.toLowerCase().includes(lower));
          if (matchedSvc) {
            selectService(matchedSvc);
            return;
          }
          try {
            const chatRes = await catalogApi.sendChatMessage({
              merchant_id: merchantId,
              message: text,
              history: messages.slice(-4).map((m) => ({
                role: m.sender === "agent" ? "assistant" : "user",
                content: m.text,
              })),
            });
            if (chatRes.data.matching_services && chatRes.data.matching_services.length > 0) {
              setServices(chatRes.data.matching_services);
            }
            if (chatRes.data.suggestion_chips?.length) {
              setSuggestionChips(chatRes.data.suggestion_chips);
            }
            addMessage("agent", chatRes.data.response);
            return;
          } catch {
            // ignore
          }
          addMessage("agent", "Please click 'Book' on one of the cards above, or describe what you're looking for.");
          break;
        }

        default:
          addMessage("agent", "Please click one of the options above to get started.");
          break;
      }
    },
    [phase, addMessage, activeServiceCard, merchantId, messages, categories, selectCategory, selectService, services]
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
    suggestionChips,
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
