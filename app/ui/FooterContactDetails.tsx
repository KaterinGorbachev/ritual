import { getInfo } from "../lib/handleData"
import { MapLeaflet } from "./MapLeaflet";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// Shape of a document in the Firestore "contactData" collection. Fields are
// optional because each document (address, workingHours, messanger, …) only
// carries the ones relevant to it.
type ContactDataItem = {
    id: string;
    location?: string;
    coordinates?: string;
    from?: string;
    to?: string;
    dayStart?: DayKey;
    dayEnd?: DayKey;
    telephone?: string;
    url?: string;
};

export async function FooterContactDetails({
    className = "", address,  hours, commentAboutAppointments, daysOfWeek, ariaLabelMapBox, ariaLabelGoogleMapButton
}:{
    className?: string, address: string, hours: string, commentAboutAppointments: string, daysOfWeek: Record<DayKey, string>, ariaLabelMapBox: string, ariaLabelGoogleMapButton: string
}) {
    let whatsappNumber = "";
    let addressText = "";
    let hoursFromText = "";
    let hoursToText = "";
    let dayStart = "";
    let dayEnd = "";
    let instagramUrl = "";
    const coordinates = { lat: 0, lng: 0 };


    // get contact data from firestore
    // used function to get all collection data from firestore
    const response = await getInfo("contactData");
    if (response.ok && response.data.length > 0) {
        const contactData = response.data as ContactDataItem[];
        const addressInfo = contactData.find(item => item.id === "address")
        addressText = addressInfo?.location ?? ""
        // Coordinates are stored as a "lat, lng" string, e.g. "39.4720, -0.3759".
        // Parse defensively so a missing/malformed value doesn't break the footer.
        if (typeof addressInfo?.coordinates === "string") {
            const coordinatesInfo = addressInfo.coordinates.split(",").map((n) => parseFloat(n.trim()))
            if (coordinatesInfo.length === 2 && !Number.isNaN(coordinatesInfo[0]) && !Number.isNaN(coordinatesInfo[1])) {
                coordinates.lat = coordinatesInfo[0]
                coordinates.lng = coordinatesInfo[1]
            } else {
                console.error("FooterContactDetails: could not parse coordinates:", addressInfo.coordinates)
            }
        } else {
            console.error("FooterContactDetails: address doc has no 'coordinates' field")
        }

        const hoursInfo = contactData.find(item => item.id === "workingHours")
        hoursFromText = hoursInfo?.from ?? ""
        hoursToText = hoursInfo?.to ?? ""
        dayStart = hoursInfo?.dayStart ? daysOfWeek[hoursInfo.dayStart] : ""
        dayEnd = hoursInfo?.dayEnd ? daysOfWeek[hoursInfo.dayEnd] : ""
        const messangerInfo = contactData.find(item => item.id === "messanger")
        whatsappNumber = messangerInfo?.telephone ?? ""
        const instagramInfo = contactData.find(item => item.id === "instagram")
        instagramUrl = instagramInfo?.url ?? ""
    }
    else {
        console.error("FooterDetailsBox: Failed to retrieve contactData from Firestore:", response);
    }


    return (
      <div className={`flex flex-col items-center justify-center gap-6 rounded-card bg-transparent ${className}`} data-testid="footer-contact-details">
        <div className="grid gap-6 rounded-card bg-transparent p-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="contact-details">
          {/** address */}
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DA1884" stroke-width="1.4" aria-hidden="true"><path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <div className="flex flex-col items-start justify-start gap-1 pr-4">
              <h3 className="font-display text-lg tracking-normal text-start">{address}</h3>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 wrap-break-word text-start">{addressText}</p>
            </div>
            
          </div>
          {/** hours */}
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A0DAD" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <div className="flex flex-col items-start justify-start gap-1">
              <h3 className="font-display text-lg tracking-normal text-start">{hours}</h3>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 text-start">{dayStart} – {dayEnd} · {hoursFromText} – {hoursToText}</p>
              <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 text-start">{commentAboutAppointments}</p>
            </div>
          </div>
          {/** whatsapp */}
          
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="#78E6D0" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.4c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.6-.1 1.2Z"/></svg>
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
        />
      </div>
    )
}

    