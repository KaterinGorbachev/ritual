export function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`flex flex-col items-center justify-center w-full py-4 lg:py-10 gap-4 lg:gap-10 ${className}`} >
    {children}
    </section>
  )
}