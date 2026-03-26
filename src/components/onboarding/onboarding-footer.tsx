type OnboardingFooterProps = {
  onSignOut: () => void;
};

export function OnboardingFooter({ onSignOut }: OnboardingFooterProps) {
  return (
    <footer className="bg-background fixed bottom-0 left-0 flex w-full justify-center py-6">
      <button
        type="button"
        onClick={onSignOut}
        className="text-muted-foreground hover:text-foreground font-['Inter'] text-[0.6875rem] font-semibold tracking-widest uppercase opacity-80 transition-colors hover:opacity-100"
      >
        Sign out
      </button>
    </footer>
  );
}
