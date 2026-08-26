import { redirect } from "next/navigation";

import { anyAdminExists, getSessionUser } from "@/lib/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/books");
  if (await anyAdminExists()) redirect("/signin");
  redirect("/signup");
}
