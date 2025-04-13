// app/user-profile/page.tsx
"use client";
import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-pink-200 p-8">
      <div className="shadow-lg rounded-2xl p-6 bg-white">
        <UserProfile routing="path" path="/user-profile" />
      </div>
    </div>
  );
};

export default UserProfilePage;
