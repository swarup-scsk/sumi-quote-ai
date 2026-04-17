import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import type { AppSettings, RFQInboxItem, SpecCard, Quote } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getSettings, saveSettings } from "@/lib/api";

interface State {
  rfqList: RFQInboxItem[];
  settings: AppSettings;
}

type Action =
  | { type: "ADD_RFQ"; rfq: RFQInboxItem }
  | { type: "UPDATE_RFQ"; rfq_id: string; patch: Partial<RFQInboxItem> }
  | { type: "SET_SPEC_CARD"; rfq_id: string; spec_card: SpecCard }
  | { type: "SET_QUOTE"; rfq_id: string; quote: Quote }
  | { type: "REMOVE_RFQ"; rfq_id: string }
  | { type: "SET_SETTINGS"; settings: AppSettings };

const initialState: State = {
  rfqList: [],
  settings: DEFAULT_SETTINGS,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_RFQ":
      return { ...state, rfqList: [action.rfq, ...state.rfqList] };
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
          r.rfq_id === action.rfq_id ? { ...r, quote: action.quote, status: "quoted" } : r,
        ),
      };
    case "REMOVE_RFQ":
      return { ...state, rfqList: state.rfqList.filter((r) => r.rfq_id !== action.rfq_id) };
    case "SET_SETTINGS":
      saveSettings(action.settings);
      return { ...state, settings: action.settings };
    default:
      return state;
  }
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "SET_SETTINGS", settings: getSettings() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
