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
    <footer className="w-full border-t-2 py-4 md:py-6 px-4" style={{ 
      background: 'linear-gradient(180deg, #F4E8D0 0%, #E8D5B5 100%)',
      borderColor: '#704214',
      boxShadow: '0 -4px 6px rgba(44, 24, 16, 0.15)'
    }}>
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
              style={{ filter: 'sepia(0.2) contrast(1.1)' }}
            />
            <Image
              src="/ruhuna_eng_logo.png"
              alt="RU FE Logo"
              width={60}
              height={60}
              className="md:w-[80px]  object-contain"
              style={{ filter: 'sepia(0.2) contrast(1.1)' }}
            />
          </div>

          {/* Address & Contacts */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 flex-1 justify-center w-full md:w-auto">
            <div className="flex items-start gap-2 text-center md:text-left">
              <FaMapMarkerAlt className="mt-1 hidden md:block" style={{ color: '#651321' }} />
              <div className="text-xs md:text-sm" style={{ color: '#2C1810', fontFamily: 'Crimson Text, serif' }}>
                <FaMapMarkerAlt className="inline md:hidden mr-2" style={{ color: '#651321' }} />
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
              <FaPhoneAlt className="mt-1 hidden md:block" style={{ color: '#651321' }} />
              <div className="text-xs md:text-sm" style={{ color: '#2C1810', fontFamily: 'Crimson Text, serif' }}>
                <FaPhoneAlt className="inline md:hidden mr-2" style={{ color: '#651321' }} />
                +94 912245765
                <br />
                +94 912245766
                <br />
                +94 912245767
              </div>
            </div>
            <div className="flex items-start gap-2 text-center md:text-left">
              <FaEnvelope className="mt-1 hidden md:block" style={{ color: '#651321' }} />
              <div className="text-xs md:text-sm" style={{ color: '#2C1810', fontFamily: 'Crimson Text, serif' }}>
                <FaEnvelope className="inline md:hidden mr-2" style={{ color: '#651321' }} />
                Fax: +94 912245762
                <br />
                Email: ar@eng.ruh.ac.lk
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-sm md:text-base" style={{ fontFamily: 'Cinzel, serif', color: '#651321', letterSpacing: '0.03em' }}>Follow us:</span>
            <div className="flex gap-3 md:gap-4 text-xl md:text-2xl" style={{ color: '#651321' }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#651321' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
              >
                <FaFacebookF />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#651321' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
              >
                <FaLinkedinIn />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#651321' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
              >
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs md:text-sm mt-2 md:mt-4 handwritten" style={{ color: '#4A3426' }}>
          © 2025 Faculty of Engineering, University of Ruhuna. All Rights
          Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
