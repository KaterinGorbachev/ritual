export function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`flex flex-col items-center justify-center w-full py-8 lg:py-16 gap-4 lg:gap-10 ${className}`} >
    {children}
    </section>
  )
}