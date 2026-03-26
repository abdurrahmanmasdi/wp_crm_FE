export function LandingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full">
      <div className="bg-primary/5 absolute top-20 right-0 h-[600px] w-[600px] rounded-full blur-[120px]" />
      <div className="bg-accent/10 absolute bottom-40 left-0 h-[400px] w-[400px] rounded-full blur-[100px]" />
    </div>
  );
}
