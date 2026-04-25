import { auth, signIn, signOut } from "@/auth";
import Image from "next/image";

export async function AuthButton() {
  const session = await auth();

  if (session?.user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {session.user.image && (
          <Image 
            src={session.user.image} 
            alt="User avatar" 
            width={32}
            height={32}
            style={{ borderRadius: "50%", border: "2px solid var(--border)" }} 
          />
        )}
        <form action={async () => {
          "use server";
          await signOut();
        }}>
          <button type="submit" className="btn btn-ghost btn-sm">Sign Out</button>
        </form>
      </div>
    );
  }

  return (
    <form action={async () => {
      "use server";
      await signIn("google");
    }}>
      <button type="submit" className="btn btn-primary btn-sm">Sign In</button>
    </form>
  );
}
