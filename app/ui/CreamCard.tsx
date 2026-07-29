type CreamCardProps = {
    name: string;
    description?: string,
    image?: string;
    className?: string;
    "aria-hidden"?: boolean;

}

export function CreamCard({
    name, description="", image = "", className = "", "aria-hidden": ariaHidden
}: CreamCardProps) {
    return (
        <li aria-hidden={ariaHidden} className="shrink-0 rounded-full  border border-blush/40 min-w-[200px] min-h-[200px] flex flex-col px-3 py-2">
            <div className="card flex h-full flex-col items-center justify-center text-center w-full">
                {image.length > 0 ? <div className="max-w-[100px] rounded-[5px] overflow-hidden bg-cream">
                    <img src={image} alt={name} className="object-cover object-center w-full " />
                </div> :
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-iris/20">
                        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#6A0DAD" stroke-width="1.3" aria-hidden="true"><path d="M14 5h4v3l3 3v15a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V11l3-3z"/><path d="M13 16h6"/></svg>

                    </span>
                }
                <h3 className="mt-4 font-handwriting text-2xl tracking-normal text-center w-full text-ink/70">{name}</h3>
                <p className="mt-1 text-sm leading-relaxed tracking-normal text-ink/70 text-start"></p>
            </div>
        </li>
    )
}