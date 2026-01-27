export const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white py-16">
      <div className="wide-section">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo and tagline */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#ff8c00] rounded-full flex items-center justify-center border-3 border-white">
                <span className="text-white font-bold text-xl font-['Archivo_Black']">A</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Great design starts with clarity — even in the numbers.
            </p>
          </div>

          {/* Sitemap */}
          <div>
            <h4 className="text-[#ff8c00] font-bold text-sm mb-4 uppercase tracking-wider">
              Sitemap
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#portfolios" className="text-gray-400 hover:text-white transition-colors">
                  Portfolios
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Utilities */}
          <div>
            <h4 className="text-[#ff8c00] font-bold text-sm mb-4 uppercase tracking-wider">
              Utilities
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[#ff8c00] font-bold text-sm mb-4 uppercase tracking-wider">
              Social
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  TikTok
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Gmail
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-gray-500 text-sm text-center">
            © 2026 Designer Calculator — Built for designers • Privacy • Terms
          </p>
        </div>
      </div>
    </footer>
  );
};