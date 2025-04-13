"use client";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/sign-in");
  };

  const navLinkClass = (path) =>
    router.pathname === path ? "text-indigo-600 font-semibold" : "text-gray-700 hover:text-indigo-600";

  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex items-center justify-between fixed top-0 left-0 z-50">
      {/* Logo / App Name */}
      <div className="text-xl font-bold text-indigo-600">
        💼 FinWizz
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className={navLinkClass("/dashboard")}>
          Dashboard
        </Link>
       
        <Link href="/TransactionsPage" className={navLinkClass("/TransactionsPage")}>
          Transactions
        </Link>
        <Link href="/CustomProfilePage" className={navLinkClass("/CustomProfilePage")}>
          FinAdvisor        
        </Link>
        
        <Link href="/Reports" className={navLinkClass("/Reports")}>
          FinHealth
        </Link>
        <Link href="/WrappedPage" className={navLinkClass("/WrappedPage")}>
          Recap
        </Link>
        
        <Link href="/Gamify" className={navLinkClass("/Gamify")}>
          Gamify        
        </Link>
        <Link href="/user-profile" className={navLinkClass("/user-profile")}>
          Profile
        </Link>
        <UserButton />
        <button
          onClick={handleSignOut}
          className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
