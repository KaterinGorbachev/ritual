export function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`flex flex-col items-center justify-center w-full lg:pt-10 ${className}`} >
    {children}
    </section>
  )
}