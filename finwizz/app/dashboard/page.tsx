"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import StatementViewer from "../components/StatementViewer";
import StatsCard from "../components/StatsCard";
import UploadForm from "../components/UploadForm";
import Navbar from "../components/Navbar";
import SummaryCards from "../components/SummaryCards";

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [showStatements, setShowStatements] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
    }
  }, [isLoaded, user, router]);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-amber-100 to-indigo-200">

      {/* Main Section */}
      <div className="flex flex-col items-center justify-center px-4 pt-4 pb-20">
        <h1 className="text-3xl font-bold text-violet-800 mb-6">
          <span className="text-4xl text-violet-900">
            <span id="greeting"> Hello</span>, {user?.firstName}!
          </span>
        </h1>

        <StatsCard />

        <div className="grid grid-cols-10 gap-2 w-full">
          {/* UploadForm - 40% width */}
          <div className="col-span-3 flex flex-col items-center p-4">
            <UploadForm onUploadComplete={handleUploadComplete} />
            <button
              onClick={() => setShowStatements(prev => !prev)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-semibold"
            >
              {showStatements ? "Hide My Statements" : "View All Statements"}
            </button>
          </div>

          {/* SummaryCards - 60% width */}
          <div className="col-span-7">
            <SummaryCards />
          </div>

        </div>

        {showStatements && (
          <div className="w-full mt-6 flex flex-col items-center gap-6">
            <StatementViewer refreshKey={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


// "use client";
// import { useEffect, useState } from "react";
// import { useUser, useClerk } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import StatementViewer from "../components/StatementViewer";
// import StatsCard from "../components/StatsCard";
// import UploadForm from "../components/UploadForm";
// import Navbar from "../components/Navbar";
// import { UserButton } from "@clerk/nextjs";
// import Link from "next/link";

// const Dashboard = () => {
//   const { user, isLoaded } = useUser();
//   const { signOut } = useClerk();
//   const router = useRouter();

//   const [showStatements, setShowStatements] = useState(false);
//   const [refreshKey, setRefreshKey] = useState(0);

//   useEffect(() => {
//     if (!isLoaded) return;
//     if (!user) {
//       router.push("/");
//     }
//   }, [isLoaded, user, router]);

//   const handleSignOut = () => {
//     signOut();
//     router.push("/sign-in");
//   };

//   const handleUploadComplete = () => {
//     setRefreshKey(prev => prev + 1);
//   };

//   if (!isLoaded) return <div>Loading...</div>;

//   return (
//     <div className="relative min-h-screen bg-gradient-to-r from-amber-100 to-indigo-200">
//       {/* Header Area */}
//       <div className="absolute top-4 right-4 flex gap-2 items-center">
//         <UserButton />
//         <Link href="/user-profile">
//           <button className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
//             View Profile
//           </button>
//         </Link>
//         <button
//           onClick={handleSignOut}
//           className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full"
//         >
//           Sign Out
//         </button>
//       </div>

//       {/* Main Section */}
//       <div className="flex flex-col items-center justify-center px-4 pt-28 pb-20">
//         <h1 className="text-3xl font-bold text-violet-800 mb-6">
//           Hello, welcome to your Dashboard!
//         </h1>

//         <UploadForm onUploadComplete={handleUploadComplete} />

//         <button
//           onClick={() => setShowStatements(prev => !prev)}
//           className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-semibold"
//         >
//           {showStatements ? "Hide My Statements" : "View My Statements"}
//         </button>

//         {showStatements && (
//           <div className="w-full mt-6 flex flex-col items-center gap-6">
//             <StatsCard />
//             <StatementViewer refreshKey={refreshKey} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
