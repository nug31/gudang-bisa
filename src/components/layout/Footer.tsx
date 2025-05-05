import React, { useState, useEffect } from "react";
import {
  Instagram,
  Globe,
  Mail,
  Heart,
  Github,
  Bell,
  ChevronUp,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show back to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-gradient-to-b from-white to-secondary-50 border-t border-secondary-100 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex items-center parallax-container">
            <div className="relative parallax-layer-1">
              <img
                src="/logosmk.png"
                alt="SMK Logo"
                className="h-5 w-auto sm:h-6 md:h-7 object-contain animate-float-slow"
              />
            </div>
            <span
              className="ml-2 text-base sm:text-lg md:text-xl font-bold text-gradient-animated parallax-layer-2"
              data-text="Gudang Mitra"
            >
              Gudang Mitra
            </span>
          </div>
          <div className="mt-2 md:mt-0">
            <p className="text-xs text-neutral-500">
              &copy; {currentYear} Gudang Mitra - All Rights Reserved
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 border-t border-secondary-100 pt-4 sm:pt-6 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3">
          <nav>
            <ul className="flex justify-center md:justify-start space-x-4">
              <li>
                <a
                  href="#"
                  className="text-xs text-neutral-500 hover:text-accent-500 transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-neutral-500 hover:text-accent-500 transition-colors"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-neutral-500 hover:text-accent-500 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex justify-center space-x-3 sm:space-x-4">
            <a
              href="https://www.instagram.com/j.s_nugroho/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-accent-500 transition-all tilt-3d btn-3d p-1 sm:p-1.5 rounded-full hover:bg-secondary-50 shadow-3d-sm"
              style={
                {
                  "--rotateX": "10deg",
                  "--rotateY": "10deg",
                } as React.CSSProperties
              }
            >
              <span className="sr-only">Instagram</span>
              <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 icon-3d" />
            </a>
            <a
              href="https://github.com/jsnugroho"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-900 transition-all tilt-3d btn-3d p-1 sm:p-1.5 rounded-full hover:bg-secondary-50 shadow-3d-sm"
              style={
                {
                  "--rotateX": "10deg",
                  "--rotateY": "10deg",
                } as React.CSSProperties
              }
            >
              <span className="sr-only">GitHub</span>
              <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 icon-3d" />
            </a>
            <a
              href="https://nugjourney.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-success-600 transition-all tilt-3d btn-3d p-1 sm:p-1.5 rounded-full hover:bg-secondary-50 shadow-3d-sm"
              style={
                {
                  "--rotateX": "10deg",
                  "--rotateY": "10deg",
                } as React.CSSProperties
              }
            >
              <span className="sr-only">Portfolio</span>
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 icon-3d" />
            </a>
            <a
              href="mailto:jsnugroho31@gmail.com"
              className="text-neutral-400 hover:text-primary-500 transition-all tilt-3d btn-3d p-1 sm:p-1.5 rounded-full hover:bg-secondary-50 shadow-3d-sm"
              style={
                {
                  "--rotateX": "10deg",
                  "--rotateY": "10deg",
                } as React.CSSProperties
              }
            >
              <span className="sr-only">Email</span>
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 icon-3d" />
            </a>
          </div>
        </div>

        {/* Developer attribution */}
        <div className="mt-3 sm:mt-4 text-center text-xs text-neutral-400">
          <p className="flex items-center justify-center parallax-container">
            <span className="parallax-layer-1 text-[9px] sm:text-[10px] md:text-xs">
              Developed by
            </span>{" "}
            <a
              href="https://nugjo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium text-neutral-400 hover:text-primary-500 transition-all duration-300 hover:scale-110 transform inline-block parallax-layer-3 text-[9px] sm:text-[10px] md:text-xs relative group"
            >
              js-nugroho
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </p>
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 p-3 rounded-full bg-primary-400 text-white shadow-3d-md hover:bg-primary-500 transition-all hover:shadow-3d-lg hover:-translate-y-1 animate-pop tilt-3d btn-3d z-30 group"
          aria-label="Back to top"
          style={
            {
              "--rotateX": "10deg",
              "--rotateY": "10deg",
            } as React.CSSProperties
          }
        >
          <ChevronUp className="h-5 w-5 icon-3d animate-bounce group-hover:animate-float" />
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Back to top
          </span>
        </button>
      )}
    </footer>
  );
};
