import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2 bg-primary text-onAccent rounded-full shadow-md hover:bg-primary-hover transition"
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
