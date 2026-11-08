import { Brand } from "@/components/Brand";
import { SetupWarning } from "@/components/SetupWarning";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <SetupWarning />
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        {children}
      </div>
      <p className="mt-8 text-xs text-faint">
        Cardocia — gestion personnelle de collection Pokémon
      </p>
    </div>
  );
}
