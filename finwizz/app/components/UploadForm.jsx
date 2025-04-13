"use client";
import { useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

const UploadForm = ({ onUploadComplete }) => {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !user) {
      setStatus("No file selected or user not logged in.");
      return;
    }

    try {
      setStatus("Uploading...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      const response = await axios.post("http://localhost:5000/api/parse", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus(`Upload successful: ${response.data?.message || "Done"}`);
      setFile(null);

      // 🟢 Notify dashboard to refresh statements
      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      console.error("Upload failed", error);
      setStatus("Upload failed. Check console.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">Upload Bank Statement</h2>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".csv,.pdf"
          onChange={handleFileChange}
          className="mb-4 block w-full border border-gray-300 rounded p-2"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
};

export default UploadForm;
