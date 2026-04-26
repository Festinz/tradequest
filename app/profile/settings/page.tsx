import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";
import AppShell from "@/components/AppShell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: settings } = user
    ? await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!settings && user) {
    const { data: created } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    settings = created;
  }

  return (
    <AppShell active="/profile">
      <Link
        href="/profile"
        className="mb-4 inline-flex items-center gap-1 text-caption text-text-2 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> 프로필로
      </Link>
      <h1 className="mb-6 text-h1">설정</h1>
      <div className="max-w-2xl">
        <SettingsClient
          initial={
            settings ?? { kis_personal_mode: false, default_market: "KRX" }
          }
          email={user?.email ?? ""}
        />
      </div>
    </AppShell>
  );
}
