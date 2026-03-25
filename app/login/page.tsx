import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/src/utils/supabase/server";

export default async function LoginPage() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }

    return <LoginForm />;
  } catch (err) {
    console.error("LOGIN PAGE CRASH:", err);

    return (
      <div style={{ padding: 20 }}>
        <h1>Something broke</h1>
        <pre>{JSON.stringify(err, null, 2)}</pre>
      </div>
    );
  }
}