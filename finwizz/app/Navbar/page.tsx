import { ClerkLoaded, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";

const Navbar = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <nav className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <Link href="/dashboard">
        <a className="text-2xl font-bold">FINWIZZ</a>
      </Link>

      <div>
        <ul className="flex items-center">
          <li className="mr-6">
            <Link href="/dashboard">
              <a className="hover:text-gray-200">Home</a>
            </Link>
          </li>
          <li className="mr-6">
            <Link href="/TransactionPages">
              <a className="hover:text-gray-200">Transactions</a>
            </Link>
          </li>
          <li className="mr-6">
            <Link href="/profile">
              <a className="hover:text-gray-200">Profile</a>
            </Link>
          </li>
          <li className="mr-6">
            <Link href="/user-profile">
              <a className="hover:text-gray-200">Financialll Profile</a>
            </Link>
            </li>
          <li className="mr-6">
            <Link href="/WrappedPage">
              <a className="hover:text-gray-200">Wrapped Page</a>
            
            </Link>
            </li>
          <li className="mr-6">
            <Link href="/settings">
              <a className="hover:text-gray-200">Settings</a>
            </Link>
          </li>
          <li>
            {user ? (
              <Button
                onClick={() => {
                  router.push("/sign-out");
                }}
                className="bg-red-500 hover:bg-red-700"
              >
                Sign Out
              </Button>
            ) : (
              <Link href="/sign-in">
                <a className="hover:text-gray-200">Sign In</a>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
