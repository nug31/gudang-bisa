import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  Warehouse,
  Boxes,
  ClipboardList,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();

  // Update userName when user changes
  useEffect(() => {
    if (user) {
      setUserName(user.name);
      console.log("Header: User name updated to", user.name);
    }
  }, [user]);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // md breakpoint in Tailwind
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Close other menus when mobile menu is toggled
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    // Close other menus
    setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    // Close other menus
    setUserMenuOpen(false);

    // If opening notifications, mark them as read
    if (!notificationsOpen) {
      markAllAsRead();
    }
  };

  return (
    <>
      <header className="bg-white shadow-md border-b border-secondary-100 sticky top-0 z-30 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <div className="relative parallax-container">
                  <img
                    src="/logosmk.png"
                    alt="SMK Logo"
                    className="h-10 w-auto object-contain animate-float-slow"
                  />
                </div>
                <span
                  className="ml-2 text-xl font-bold text-gradient-animated group-hover:opacity-90 transition-all"
                  data-text="Gudang Mitra"
                >
                  Gudang Mitra
                </span>
              </Link>

              {/* Desktop navigation */}
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-900 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d"
                  style={
                    {
                      "--rotateX": "2deg",
                      "--rotateY": "5deg",
                    } as React.CSSProperties
                  }
                >
                  <BarChart3 className="h-4 w-4 mr-2 icon-3d navbar-icon" />
                  Dashboard
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d"
                  style={
                    {
                      "--rotateX": "2deg",
                      "--rotateY": "5deg",
                    } as React.CSSProperties
                  }
                >
                  <Boxes className="h-4 w-4 mr-2 icon-3d navbar-icon" />
                  Browse Items
                </Link>
                <Link
                  to="/requests"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d"
                  style={
                    {
                      "--rotateX": "2deg",
                      "--rotateY": "5deg",
                    } as React.CSSProperties
                  }
                >
                  <ClipboardList className="h-4 w-4 mr-2 icon-3d navbar-icon" />
                  My Orders
                </Link>
                <Link
                  to="/requests/new"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d"
                  style={
                    {
                      "--rotateX": "2deg",
                      "--rotateY": "5deg",
                    } as React.CSSProperties
                  }
                >
                  <Boxes className="h-4 w-4 mr-2 icon-3d navbar-icon" />
                  New Order
                </Link>
                {/* Show inventory management link for both admin and manager roles */}
                {(user?.role === "admin" || user?.role === "manager") && (
                  <Link
                    to="/inventory"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d"
                    style={
                      {
                        "--rotateX": "2deg",
                        "--rotateY": "5deg",
                      } as React.CSSProperties
                    }
                  >
                    <Warehouse className="h-4 w-4 mr-2 icon-3d navbar-icon" />
                    Stock Management
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d glow-border"
                    style={
                      {
                        "--rotateX": "2deg",
                        "--rotateY": "5deg",
                      } as React.CSSProperties
                    }
                  >
                    <Settings className="h-4 w-4 mr-2 icon-3d navbar-icon animate-rotate-slow" />
                    Admin
                  </Link>
                )}

                {user?.role === "manager" && (
                  <Link
                    to="/manager"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-500 transition-all rounded-md hover:bg-neutral-50 tilt-3d glow-border"
                    style={
                      {
                        "--rotateX": "2deg",
                        "--rotateY": "5deg",
                      } as React.CSSProperties
                    }
                  >
                    <Settings className="h-4 w-4 mr-2 icon-3d navbar-icon animate-rotate-slow" />
                    Manager
                  </Link>
                )}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center">
              {/* Notification bell */}
              {user && (
                <div className="relative ml-3">
                  <button
                    onClick={toggleNotifications}
                    className="p-2 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all relative tilt-3d btn-3d"
                    style={
                      {
                        "--rotateX": "5deg",
                        "--rotateY": "5deg",
                      } as React.CSSProperties
                    }
                  >
                    <Bell className="h-5 w-5 icon-3d navbar-icon text-primary-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-accent-500 rounded-full shadow-md animate-pulse badge-3d">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications dropdown */}
                  {notificationsOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-3d-md bg-white ring-1 ring-neutral-200 z-50 animate-pop overflow-hidden">
                      <div className="py-3 px-4 border-b border-secondary-100 bg-gradient-to-r from-white to-secondary-50">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-neutral-900 flex items-center">
                            <Bell className="h-4 w-4 mr-2 text-primary-500" />
                            Notifications
                          </h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="py-2 max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-sm text-neutral-500 px-4 py-6 text-center">
                            <Bell className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-neutral-50 transition-colors ${
                                !notification.read
                                  ? "bg-primary-50 border-l-4 border-primary-500"
                                  : ""
                              }`}
                            >
                              <p className="text-sm text-neutral-700">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1 flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-accent-400 mr-2"></span>
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User menu */}
              {user ? (
                <div className="relative ml-3">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 p-1 hover:bg-neutral-100 transition-all tilt-3d btn-3d"
                    style={
                      {
                        "--rotateX": "5deg",
                        "--rotateY": "-5deg",
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative">
                      <Avatar
                        src={user.avatarUrl}
                        name={userName}
                        size="sm"
                        className="icon-3d"
                      />
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-success-400 rounded-full border border-white"></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-neutral-700 hidden sm:block">
                      {userName}
                    </span>
                    <ChevronDown
                      className="ml-1 h-4 w-4 text-neutral-500 hidden sm:block transition-transform duration-300"
                      style={{
                        transform: userMenuOpen
                          ? "rotate(180deg)"
                          : "rotate(0)",
                      }}
                    />
                  </button>

                  {/* User dropdown */}
                  {userMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-3d-md bg-white ring-1 ring-neutral-200 z-50 animate-pop overflow-hidden">
                      <div className="p-4 border-b border-secondary-100 bg-gradient-to-r from-white to-secondary-50">
                        <div className="flex items-center">
                          <Avatar
                            src={user.avatarUrl}
                            name={userName}
                            size="md"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-neutral-900">
                              {userName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-all tilt-3d"
                          onClick={() => setUserMenuOpen(false)}
                          style={
                            {
                              "--rotateX": "2deg",
                              "--rotateY": "2deg",
                            } as React.CSSProperties
                          }
                        >
                          <User className="mr-3 h-4 w-4 text-primary-500 icon-3d navbar-icon" />
                          <span className="relative">
                            Profile
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
                          </span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-all tilt-3d"
                          style={
                            {
                              "--rotateX": "2deg",
                              "--rotateY": "2deg",
                            } as React.CSSProperties
                          }
                        >
                          <LogOut className="mr-3 h-4 w-4 text-error-400 icon-3d navbar-icon" />
                          <span className="relative">
                            Sign out
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-error-400 group-hover:w-full transition-all duration-300"></span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm">Sign in</Button>
                </Link>
              )}

              {/* Mobile menu button */}
              <div className="flex items-center md:hidden ml-3">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-primary-500 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-3d-sm active:shadow-3d-inner transition-all"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">Open main menu</span>
                  <Menu
                    className={`h-6 w-6 ${mobileMenuOpen ? "hidden" : "block"}`}
                  />
                  <X
                    className={`h-6 w-6 ${mobileMenuOpen ? "block" : "hidden"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu - outside the header for better positioning */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Mobile menu overlay */}
          <div
            className="fixed inset-0 bg-black opacity-50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          ></div>

          {/* Mobile menu panel */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-auto z-50"
            aria-modal="true"
            role="dialog"
          >
            {/* Mobile menu header */}
            <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src="/logosmk.png"
                    alt="SMK Logo"
                    className="h-8 w-auto object-contain animate-float-slow"
                  />
                </div>
                <span className="ml-2 text-lg font-bold text-gradient-animated">
                  Gudang Mitra
                </span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-full text-primary-500 hover:text-primary-600 hover:bg-primary-50 shadow-3d-sm active:shadow-3d-inner transition-all"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu content */}
            <div className="pb-20">
              <div className="pt-2 pb-3 space-y-0.5">
                {/* Dashboard link */}
                <Link
                  to="/"
                  className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                    <BarChart3 className="h-4 w-4 text-primary-500" />
                  </div>
                  Dashboard
                </Link>

                {/* My Orders link */}
                <Link
                  to="/requests"
                  className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                    <ClipboardList className="h-4 w-4 text-primary-500" />
                  </div>
                  My Orders
                </Link>

                {/* New Order link */}
                <Link
                  to="/requests/new"
                  className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                    <Boxes className="h-4 w-4 text-primary-500" />
                  </div>
                  New Order
                </Link>

                {/* Admin links */}
                {user?.role === "admin" && (
                  <>
                    <div className="mt-4 mb-2 px-4">
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Admin
                      </div>
                    </div>
                    <Link
                      to="/admin"
                      className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                        <Settings className="h-4 w-4 text-primary-500" />
                      </div>
                      Admin Panel
                    </Link>
                    <Link
                      to="/inventory"
                      className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                        <Warehouse className="h-4 w-4 text-primary-500" />
                      </div>
                      Stock Management
                    </Link>
                  </>
                )}

                {/* Manager links */}
                {user?.role === "manager" && (
                  <>
                    <div className="mt-4 mb-2 px-4">
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Manager
                      </div>
                    </div>
                    <Link
                      to="/manager"
                      className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                        <Settings className="h-4 w-4 text-primary-500" />
                      </div>
                      Manager Panel
                    </Link>
                    <Link
                      to="/inventory"
                      className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                        <Warehouse className="h-4 w-4 text-primary-500" />
                      </div>
                      Stock Management
                    </Link>
                  </>
                )}

                {/* Sign in link for non-authenticated users */}
                {!user && (
                  <Link
                    to="/login"
                    className="flex items-center pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3">
                      <LogIn className="h-4 w-4 text-primary-500" />
                    </div>
                    Sign in
                  </Link>
                )}

                {/* Notifications section for mobile */}
                {user && (
                  <div className="mt-4 mb-2 px-4">
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Notifications
                    </div>
                    <button
                      onClick={() => {
                        toggleNotifications();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full pl-4 pr-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-500 border-l-4 border-transparent hover:border-primary-500 transition-all mt-2"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 mr-3 relative">
                        <Bell className="h-4 w-4 text-primary-500" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-accent-500 rounded-full shadow-md animate-pulse badge-3d">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* User profile section */}
                {user && (
                  <div className="mt-6 border-t border-neutral-200 pt-4">
                    <div className="px-4 py-2">
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatarUrl}
                          name={userName}
                          size="md"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-neutral-900">
                            {userName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Link
                          to="/profile"
                          className="flex-1 px-3 py-2 text-sm font-medium text-center text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-primary-500 rounded-md hover:bg-primary-600"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
