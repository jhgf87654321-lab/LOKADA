import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 临时禁用：排查是否有全局覆盖层导致页面无法点击 */}
      {false && (
        <NextTopLoader easing="ease" showSpinner={false} color="var(--primary)" />
      )}
      {children}
      <Toaster position="top-center" />
    </>
  );
}
