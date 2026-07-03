import { WhatsAppButton } from "../ui/WhatsAppButton";
import { WhatsAppButtonWave } from "../ui/WhatsAppButtonWave";
import { NavLink } from "../ui/NavLink";
import { BurgerMenuButton } from "../ui/BurgerMenuButton";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 flex-col items-start gap-4 py-4 bg-amber-50 dark:bg-cream  sm:px-6 lg:px-8">
        
        <WhatsAppButton number="1234567890" message="Hello, I'm interested in learning more about your services!">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.4c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.6-.1 1.2Z"/></svg>
          WhatsApp
        </WhatsAppButton>
        <WhatsAppButtonWave number="1234567890" message="Hello, I'm interested in learning more about your services!">
          Contact on WhatsApp with Wave
        </WhatsAppButtonWave>
        <NavLink href="">
          About Us
        </NavLink>
        <BurgerMenuButton />
      </main>
    </div>
  );
}
