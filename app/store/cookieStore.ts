// Whether the visitor has dismissed the cookie notice.
//
// Unlike `localeStore` — which deliberately avoids `persist` because the cookie
// is the copy the edge reads — localStorage is the *only* source of truth here,
// so there is nothing for a second copy to disagree with. `persist` is the
// right tool: it writes on every change and rehydrates on mount by itself.
//
// It is stored in localStorage rather than a cookie on purpose: a notice about
// data minimisation should not itself set a new cookie to remember it was read.
//
// `skipHydration` keeps the server render and the first client paint identical
// (always "not yet acknowledged"), then <CookieNoticeHydrator> rehydrates in an
// effect. Without it, the stored value would be read during the very first
// render and mismatch the SSR HTML.
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** localStorage key holding the acknowledgement. */
export const COOKIE_NOTICE_KEY = "ritual:cookie-notice";

type CookieNoticeState = {
  /** True once the visitor has dismissed the notice. */
  acknowledged: boolean;
  /**
   * False until the stored value has been read back. The banner stays hidden
   * while this is false, so a returning visitor never sees it flash before
   * rehydration tells us they already dismissed it.
   */
  hydrated: boolean;
  /** Dismiss the notice, and remember it for future visits. */
  acknowledge: () => void;
};

export const useCookieNoticeStore = create<CookieNoticeState>()(
  persist(
    (set) => ({
      acknowledged: false,
      hydrated: false,
      acknowledge: () => set({ acknowledged: true }),
    }),
    {
      name: COOKIE_NOTICE_KEY,
      skipHydration: true,
      // `hydrated` describes this runtime, not the visitor's choice — persisting
      // it would write `true` to storage and defeat the guard on the next load.
      partialize: (state) => ({ acknowledged: state.acknowledged }),
      onRehydrateStorage: () => () => {
        // Runs after the stored value is merged in — and also when there is
        // nothing stored, which is exactly when a first-time visitor should
        // start seeing the notice.
        useCookieNoticeStore.setState({ hydrated: true });
      },
    },
  ),
);
