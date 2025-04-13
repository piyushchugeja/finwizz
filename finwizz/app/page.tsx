import { Button } from "@/components/ui/button";
import TypewriterTitle from "@/components/ui/TypewriterTitle";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gradient-to-r min-h-screen from-amber-100 to-indigo-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="font-semibold text-5xl text-center">
          Welcome to {""}
          <span className="text-violet-800 font-bold italic"> FINWIZZ</span>,
          custom Financial Health analyser.
        </h1>
        <div className="mt-4"></div>
        <h2 className="font-semibold text-zinc-400 text-2xl text-center">
          <TypewriterTitle />
        </h2>
        <div className="mt-8 flex justify-center">
          <Link href="/sign-in">
            <Button className="bg-violet-500 hover:bg-violet-800">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
