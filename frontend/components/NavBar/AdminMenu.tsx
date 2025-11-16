import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const AdminMenu: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose && onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Helper to close dropdown on menu item click
  const handleMenuClick = () => {
    onClose && onClose();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Shield icon header */}
      <div className="flex items-center justify-center py-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* Admin email info */}
      {session?.user?.email && (
        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
          <div className="font-semibold text-[#651321] text-sm mb-1">Logged in as</div>
          <div className="break-all text-[#4b2e83]">{session.user.email}</div>
        </div>
      )}
      <Link
        href="/manage-questions"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
        onClick={handleMenuClick}
      >
        Manage Questions
      </Link>
      {/* Violations Log removed */}
      <button
        onClick={async () => {
          handleMenuClick();
          await signOut({ callbackUrl: '/' });
          router.push('/');
        }}
        className="flex items-center gap-2 w-full px-4 py-2 text-[#651321] hover:bg-gray-100 border-t border-gray-100 text-left text-sm font-semibold"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
};

export default AdminMenu;
