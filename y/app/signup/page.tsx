import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { anyAdminExists, getSessionUser } from "@/lib/session";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/books");

  // 已有管理员则禁止二次注册
  if (await anyAdminExists()) redirect("/signin");

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10">
      <SignupForm />
    </div>
  );
}
