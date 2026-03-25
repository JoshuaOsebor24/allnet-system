"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type LogoutButtonProps = {
  className: string;
  onComplete?: () => void;
};

export default function LogoutButton({
  className,
  onComplete,
}: LogoutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    await supabase.auth.signOut();
    onComplete?.();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={submitting}
    >
      {submitting ? "Signing out..." : "Log out"}
    </button>
  );
}
