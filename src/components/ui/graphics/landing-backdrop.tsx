export function LandingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full">
      <div className="absolute top-20 right-0 h-[600px] w-[600px] rounded-full bg-[#00f0ff]/5 blur-[120px]" />
      <div className="absolute bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-[#1a4f47]/10 blur-[100px]" />
    </div>
  );
}
