import { redirect } from "next/navigation";

import { SigninForm } from "@/components/auth/signin-form";
import { getSessionUser } from "@/lib/session";

export default async function SigninPage() {
  const user = await getSessionUser();
  if (user) redirect("/books");

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10">
      <SigninForm />
    </div>
  );
}
