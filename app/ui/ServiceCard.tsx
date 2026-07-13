type ServiceCardProps = {
    title: string;
    description: string;
    className?: string;
    /** Path under /public, e.g. "/services/microcurrent.jpg". */
    image: string;
};

export function ServiceCard({ title, description, className = "", image }: ServiceCardProps) {

    return (
        <li data-testid="service-card" className={`flex flex-col p-2 relative h-full min-h-72 w-full max-w-[350px] overflow-hidden rounded-card border border-blush/10 bg-cream/80 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)]  ${className}`}>

            <div className="flex flex-col items-start justify-center">
                <div className="w-full shrink-0 overflow-hidden rounded-card h-50 max-w-[350px] shadow-xs">
                    <img src={image} alt={title} className="w-full h-full object-cover object-center" />
                </div>
                <div className="flex h-full w-full flex-col items-start justify-start py-6 gap-2 pr-2">
                    <h3 className="font-display text-2xl tracking-normal text-ink">{title}</h3>
                    <p className="mt-2 font-body text-base leading-relaxed tracking-normal text-ink/75 ">
                    {description}
                </p>
                </div>
            </div>

            

            


        </li>
    );
}
