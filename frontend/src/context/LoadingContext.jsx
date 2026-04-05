import { createContext, useContext, useState } from "react";
import LoadingModal from "../components/ui/LoadingModal";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoading = (msg = "Loading...") => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
    setMessage("Loading...");
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <LoadingModal isOpen={loading} message={message} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
