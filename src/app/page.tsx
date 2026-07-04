import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/roles";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect(getRoleHomePath(session.user.role));
  redirect("/sign-in");
}
