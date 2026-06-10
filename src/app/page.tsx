
import { redirect } from "next/navigation";

/**
 * Root page that immediately bypasses to the dashboard.
 * This is a server component to ensure the redirect happens before any client-side rendering.
 */
export default function Home() {
  redirect("/dashboard");
}
