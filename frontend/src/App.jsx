import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DonorRegister from "./pages/DonorRegister.jsx";
import ReceiverSearch from "./pages/ReceiverSearch.jsx";
import DonorProfile from "./pages/DonorProfile.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/donor" element={<DonorRegister />} />
      <Route path="/receiver" element={<ReceiverSearch />} />
      <Route path="/donor/:id" element={<DonorProfile />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

