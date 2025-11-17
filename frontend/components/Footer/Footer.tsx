import React from "react";
import Image from "next/image";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-200 bg-white py-4 md:py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Logos */}
          <div className="flex items-center gap-3 md:gap-4">
            <Image
              src="/ruhuna.gif"
              alt="RU Logo"
              width={60}
              height={60}
              className="md:w-[80px]  object-contain"
            />
            <Image
              src="/ruhuna_eng_logo.png"
              alt="RU FE Logo"
              width={60}
              height={60}
              className="md:w-[80px]  object-contain"
            />
          </div>

          {/* Address & Contacts */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 flex-1 justify-center w-full md:w-auto">
            <div className="flex items-start gap-2 text-center md:text-left">
              <FaMapMarkerAlt className="text-[#4b2e83] mt-1 hidden md:block" />
              <div className="text-xs md:text-sm text-gray-800">
                <FaMapMarkerAlt className="text-[#4b2e83] inline md:hidden mr-2" />
                Faculty of Engineering,
                <br />
                University of Ruhuna,
                <br />
                Hapugala, Galle,
                <br />
                Sri Lanka. 80000
              </div>
            </div>
            <div className="flex items-start gap-2 text-center md:text-left">
              <FaPhoneAlt className="text-[#4b2e83] mt-1 hidden md:block" />
              <div className="text-xs md:text-sm text-gray-800">
                <FaPhoneAlt className="text-[#4b2e83] inline md:hidden mr-2" />
                +94 912245765
                <br />
                +94 912245766
                <br />
                +94 912245767
              </div>
            </div>
            <div className="flex items-start gap-2 text-center md:text-left">
              <FaEnvelope className="text-[#4b2e83] mt-1 hidden md:block" />
              <div className="text-xs md:text-sm text-gray-800">
                <FaEnvelope className="text-[#4b2e83] inline md:hidden mr-2" />
                Fax: +94 912245762
                <br />
                Email: ar@eng.ruh.ac.lk
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-sm md:text-base">Follow us:</span>
            <div className="flex gap-3 md:gap-4 text-xl md:text-2xl text-[#4b2e83]">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#a67c52] transition-colors"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#a67c52] transition-colors"
              >
                <FaLinkedinIn />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#a67c52] transition-colors"
              >
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs md:text-sm text-gray-700 mt-2 md:mt-4">
          © 2025 Faculty of Engineering, University of Ruhuna. All Rights
          Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
