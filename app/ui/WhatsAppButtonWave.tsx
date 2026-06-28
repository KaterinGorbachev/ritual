import { WhatsAppButton } from "./WhatsAppButton";

export function WhatsAppButtonWave({
    number, message, children
}: { number: string, message: string, children: React.ReactNode }) {
    return (
        <div className="relative group">
            <span className="animate-[wave_2.4s_ease-out_infinite] group-focus-within:[animation-play-state:paused] group-has-[a[aria-disabled='true']]:[animation-play-state:paused] pointer-events-none absolute inset-0 rounded-pill bg-mint group-active:bg-magenta group-active:[animation-play-state:paused] " aria-hidden="true"></span>
            <span className="animate-[wave_2.4s_ease-out_infinite] [animation-delay:1.2s] group-focus-within:[animation-play-state:paused] group-active:[animation-play-state:paused] pointer-events-none absolute inset-0 rounded-pill bg-mint group-active:bg-magenta" aria-hidden="true"></span>
            <WhatsAppButton number={number} message={message} className="relative z-10 shadow-[0_0_0_1px_rgba(106,13,173,.12),0_18px_50px_-24px_rgba(106,13,173,.45)]">
                {children}
            </WhatsAppButton>
        </div>
    )
}
