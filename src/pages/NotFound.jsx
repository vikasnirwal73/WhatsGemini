import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#eae6df] dark:bg-[#0d1418] text-center">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2 bg-[#008069] text-white rounded-full shadow-md hover:bg-[#026e58] transition"
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
