import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppSettings, RFQInboxItem, SpecCard, Quote, ActivityLogEntry } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getSettings, saveSettings } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface State {
  rfqList: RFQInboxItem[];
  settings: AppSettings;
  session: Session | null;
  authReady: boolean;
  syncing: boolean;
}

type Action =
  | { type: "ADD_RFQ"; rfq: RFQInboxItem }
  | { type: "UPDATE_RFQ"; rfq_id: string; patch: Partial<RFQInboxItem> }
  | { type: "SET_SPEC_CARD"; rfq_id: string; spec_card: SpecCard }
  | { type: "SET_QUOTE"; rfq_id: string; quote: Quote }
  | { type: "MARK_QUOTE_SHARED"; rfq_id: string }
  | { type: "REMOVE_RFQ"; rfq_id: string }
  | { type: "SET_SETTINGS"; settings: AppSettings }
  | { type: "REPLACE_RFQS"; rfqs: RFQInboxItem[] }
  | { type: "SET_SESSION"; session: Session | null; authReady?: boolean }
  | { type: "SET_SYNCING"; syncing: boolean };

const initialState: State = {
  rfqList: [],
  settings: DEFAULT_SETTINGS,
  session: null,
  authReady: false,
  syncing: false,
};

function upsertItem(list: RFQInboxItem[], item: RFQInboxItem): RFQInboxItem[] {
  const idx = list.findIndex((r) => r.rfq_id === item.rfq_id);
  if (idx === -1) return [item, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...item };
  return next;
}

function appendLog(item: RFQInboxItem, action: string, userEmail: string, userId?: string, details?: string): RFQInboxItem {
  const entry: ActivityLogEntry = {
    action,
    timestamp: new Date().toISOString(),
    user_email: userEmail,
    user_id: userId,
    details,
  };
  return {
    ...item,
    activity_log: [...(item.activity_log ?? []), entry],
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_RFQ":
      return { ...state, rfqList: upsertItem(state.rfqList, action.rfq) };
    case "UPDATE_RFQ":
      return {
        ...state,
        rfqList: state.rfqList.map((r) =>
          r.rfq_id === action.rfq_id ? { ...r, ...action.patch } : r,
        ),
      };
    case "SET_SPEC_CARD":
      return {
        ...state,
        rfqList: state.rfqList.map((r) =>
          r.rfq_id === action.rfq_id
            ? {
                ...r,
                spec_card: action.spec_card,
                status: action.spec_card.status,
                overall_confidence: action.spec_card.overall_confidence,
                flagged_field_count: action.spec_card.flagged_field_count,
              }
            : r,
        ),
      };
    case "SET_QUOTE":
      return {
        ...state,
        rfqList: state.rfqList.map((r) =>
          r.rfq_id === action.rfq_id ? { ...r, quote: action.quote, status: "quote_generated" } : r,
        ),
      };
    case "MARK_QUOTE_SHARED":
      return {
        ...state,
        rfqList: state.rfqList.map((r) =>
          r.rfq_id === action.rfq_id ? { ...r, status: "quote_shared" } : r,
        ),
      };
    case "REMOVE_RFQ":
      return { ...state, rfqList: state.rfqList.filter((r) => r.rfq_id !== action.rfq_id) };
    case "SET_SETTINGS":
      saveSettings(action.settings);
      return { ...state, settings: action.settings };
    case "REPLACE_RFQS":
      return { ...state, rfqList: action.rfqs };
    case "SET_SESSION":
      return { ...state, session: action.session, authReady: action.authReady ?? state.authReady };
    case "SET_SYNCING":
      return { ...state, syncing: action.syncing };
    default:
      return state;
  }
}

// ─── DB <-> local mapping ───────────────────────────────────────────────────
type RFQRow = {
  rfq_id: string;
  customer_name: string;
  subject: string;
  filename: string;
  received_at: string;
  status: RFQInboxItem["status"] | "quoted";
  overall_confidence: number | null;
  flagged_field_count: number | null;
  spec_card: SpecCard | null;
  quote: Quote | null;
  error_message: string | null;
  activity_log: ActivityLogEntry[] | null;
};

function normalizeStatus(s: RFQInboxItem["status"] | "quoted"): RFQInboxItem["status"] {
  // Legacy DB rows used "quoted" — treat as quote_generated for backward compat.
  return s === "quoted" ? "quote_generated" : s;
}

function rowToItem(r: RFQRow): RFQInboxItem {
  return {
    rfq_id: r.rfq_id,
    customer_name: r.customer_name,
    subject: r.subject,
    filename: r.filename,
    received_at: r.received_at,
    status: normalizeStatus(r.status),
    overall_confidence: r.overall_confidence ?? undefined,
    flagged_field_count: r.flagged_field_count ?? undefined,
    spec_card: r.spec_card ?? undefined,
    quote: r.quote ?? undefined,
    error_message: r.error_message ?? undefined,
    activity_log: r.activity_log ?? undefined,
  };
}

function itemToRow(item: RFQInboxItem) {
  return {
    rfq_id: item.rfq_id,
    customer_name: item.customer_name,
    subject: item.subject,
    filename: item.filename,
    received_at: item.received_at,
    status: item.status,
    overall_confidence: item.overall_confidence ?? null,
    flagged_field_count: item.flagged_field_count ?? null,
    spec_card: (item.spec_card ?? null) as never,
    quote: (item.quote ?? null) as never,
    error_message: item.error_message ?? null,
    activity_log: (item.activity_log ?? []) as never,
  };
}

async function persistAction(action: Action, getItem: (id: string) => RFQInboxItem | undefined) {
  try {
    switch (action.type) {
      case "ADD_RFQ":
        await supabase.from("rfqs").upsert(itemToRow(action.rfq), { onConflict: "rfq_id" });
        break;
      case "UPDATE_RFQ":
      case "SET_SPEC_CARD":
      case "SET_QUOTE":
      case "MARK_QUOTE_SHARED": {
        const id = "rfq_id" in action ? action.rfq_id : "";
        const next = getItem(id);
        if (next) await supabase.from("rfqs").upsert(itemToRow(next), { onConflict: "rfq_id" });
        break;
      }
      case "REMOVE_RFQ":
        await supabase.from("rfqs").delete().eq("rfq_id", action.rfq_id);
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn("RFQ sync failed:", err);
  }
}

interface Ctx {
  state: State;
  dispatch: (action: Action) => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Wrap dispatch so activity log entries and DB writes happen as side effects.
  const dispatch = (action: Action) => {
    const user = stateRef.current.session?.user;
    const userEmail = user?.email ?? "Unknown";
    const userId = user?.id;

    if (user) {
      switch (action.type) {
        case "ADD_RFQ": {
          const rfq = appendLog(action.rfq, "RFQ uploaded", userEmail, userId, action.rfq.filename);
          baseDispatch({ type: "ADD_RFQ", rfq });
          break;
        }
        case "SET_SPEC_CARD": {
          const current = stateRef.current.rfqList.find((r) => r.rfq_id === action.rfq_id);
          if (current) {
            const updated = appendLog(
              current,
              "Spec confirmed",
              userEmail,
              userId,
              `Confidence ${Math.round((action.spec_card.overall_confidence ?? 0) * 100)}%`,
            );
            baseDispatch({ type: "UPDATE_RFQ", rfq_id: action.rfq_id, patch: { activity_log: updated.activity_log } });
          }
          baseDispatch(action);
          break;
        }
        case "SET_QUOTE": {
          const current = stateRef.current.rfqList.find((r) => r.rfq_id === action.rfq_id);
          if (current) {
            const updated = appendLog(
              current,
              "Quote generated",
              userEmail,
              userId,
              `${action.quote.quote_id} · €${action.quote.pricing_breakdown.quote_value_eur.toLocaleString()}`,
            );
            baseDispatch({ type: "UPDATE_RFQ", rfq_id: action.rfq_id, patch: { activity_log: updated.activity_log } });
          }
          baseDispatch(action);
          break;
        }
        default:
          baseDispatch(action);
      }
    } else {
      baseDispatch(action);
    }

    if (stateRef.current.session) {
      queueMicrotask(() => {
        const getItem = (id: string) => stateRef.current.rfqList.find((r) => r.rfq_id === id);
        void persistAction(action, getItem);
      });
    }
  };

  // Load settings once.
  useEffect(() => {
    baseDispatch({ type: "SET_SETTINGS", settings: getSettings() });
  }, []);

  // Subscribe to auth changes.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      baseDispatch({ type: "SET_SESSION", session, authReady: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      baseDispatch({ type: "SET_SESSION", session: data.session, authReady: true });
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load + subscribe to RFQs when signed in.
  useEffect(() => {
    if (!state.session) {
      baseDispatch({ type: "REPLACE_RFQS", rfqs: [] });
      return;
    }
    let active = true;
    baseDispatch({ type: "SET_SYNCING", syncing: true });
    supabase
      .from("rfqs")
      .select("*")
      .order("received_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) {
          baseDispatch({ type: "REPLACE_RFQS", rfqs: (data as RFQRow[]).map(rowToItem) });
        }
        baseDispatch({ type: "SET_SYNCING", syncing: false });
      });

    const channel = supabase
      .channel("rfqs-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rfqs" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as RFQRow;
            baseDispatch({ type: "REMOVE_RFQ", rfq_id: oldRow.rfq_id });
          } else {
            const row = payload.new as RFQRow;
            baseDispatch({ type: "ADD_RFQ", rfq: rowToItem(row) });
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [state.session?.user.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppContext.Provider value={{ state, dispatch, signOut }}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
