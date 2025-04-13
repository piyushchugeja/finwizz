import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center align-middle">
      <div className="max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
