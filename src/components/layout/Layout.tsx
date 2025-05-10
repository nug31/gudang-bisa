import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Header />
      <main className="flex-grow py-4 sm:py-6 md:py-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
