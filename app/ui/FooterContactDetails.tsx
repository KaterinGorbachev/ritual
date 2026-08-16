import { MapLeafletClient as MapLeaflet } from "./MapLeafletClient";
import { toContactFacts, type ContactDataItem, type DayKey } from "../lib/contactFacts";

// The document shape now lives with the parser (app/lib/contactFacts.ts) so that
// module has no import back into the UI layer. Re-exported here because the
// layout and the tests already import it from this file.
export type { ContactDataItem, DayKey };

export function FooterContactDetails({
    contactDocs, className = "", address,  hours, commentAboutAppointments, daysOfWeek, ariaLabelMapBox, ariaLabelGoogleMapButton
}:{
    contactDocs: ContactDataItem[], className?: string, address: string, hours: string, commentAboutAppointments: string, daysOfWeek: Record<DayKey, string>, ariaLabelMapBox: string, ariaLabelGoogleMapButton: string
}) {
    // Contact data is fetched once in the layout (single getInfo("contactData")
    // read) and passed down here as `contactDocs` — this component no longer hits
    // Firestore. toContactFacts() parses defensively so a missing/malformed doc
    // degrades gracefully; it is shared with the JSON-LD builder and the WebMCP
    // tools so the "lat, lng" split lives in exactly one place.
    const facts = toContactFacts(contactDocs);

    const addressText = facts.address;
    const whatsappNumber = facts.telephone;
    const instagramUrl = facts.instagramUrl;
    const hoursFromText = facts.hours?.from ?? "";
    const hoursToText = facts.hours?.to ?? "";
    const dayStart = facts.hours?.dayStart ? daysOfWeek[facts.hours.dayStart] : "";
    const dayEnd = facts.hours?.dayEnd ? daysOfWeek[facts.hours.dayEnd] : "";

    // The map still needs concrete numbers; 0,0 is the historical fallback for a
    // missing/unparseable coordinate pair.
    const coordinates = facts.coordinates ?? { lat: 0, lng: 0 };
    const mapLink =
        facts.mapLink ||
        `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;


    return (
      <div className={`flex flex-col items-center justify-center gap-6 rounded-card bg-transparent ${className}`} data-testid="footer-contact-details">
        <div className="grid gap-6 rounded-card bg-transparent p-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="contact-details">
          {/** address */}
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DA1884" strokeWidth="1.4" aria-hidden="true"><path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <div className="flex flex-col items-start justify-start gap-1 pr-4">
              <h3 className="font-display text-lg tracking-normal text-start">{address}</h3>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 wrap-break-word text-start">{addressText}</p>
            </div>
            
          </div>
          {/** hours */}
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A0DAD" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <div className="flex flex-col items-start justify-start gap-1">
              <h3 className="font-display text-lg tracking-normal text-start">{hours}</h3>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 text-start">{dayStart} – {dayEnd} · {hoursFromText} – {hoursToText}</p>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 text-start">{commentAboutAppointments}</p>
            </div>
          </div>
          {/** whatsapp */}
          
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0 text-mint" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.4c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.6-.1 1.2Z"/></svg>
            <div>
              <h3 className="font-display text-lg tracking-normal text-start">WhatsApp</h3>
              <p className="mt-1 inline-block text-sm leading-relaxed tracking-normal text-iris hover:text-magenta focus-aurelle rounded-pill select-text text-start">{whatsappNumber}</p>
            </div>
          </div>
            {/** instagram */}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group transition-all duration-500 ease-in-out">
                <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DA1884" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="#DA1884" stroke="none" /></svg>
                <div>
                    <h3 className="font-display text-lg tracking-normal group-hover:text-magenta">Instagram</h3>
                    
                </div>
            </a>
        </div>
        {/* All salon data is fetched above and passed down as props. */}
        <MapLeaflet
            lat={coordinates.lat}
            lng={coordinates.lng}
            address={addressText}
            popupTitle={address}
            ariaLabel={ariaLabelMapBox}
            googleMapLabel={ariaLabelGoogleMapButton}
            mapLink={mapLink}
        />
      </div>
    )
}

    