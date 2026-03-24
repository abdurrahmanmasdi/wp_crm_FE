type OnboardingFooterProps = {
  onSignOut: () => void;
};

export function OnboardingFooter({ onSignOut }: OnboardingFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 flex w-full justify-center bg-[#0a0e14] py-6">
      <button
        type="button"
        onClick={onSignOut}
        className="font-['Inter'] text-[0.6875rem] font-semibold tracking-widest text-[#bacac5] uppercase opacity-80 transition-colors hover:text-white hover:opacity-100"
      >
        Sign out
      </button>
    </footer>
  );
}
