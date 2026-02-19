export default function Providers({ children }: { children: React.ReactNode }) {
  // Keep global providers minimal.
  // The CloudBase module is self-contained under `src/app/cloudbase/*`.
  return children;
}
