import { motion } from "framer-motion";

export const PricingFeature = () => {
  return (
    <section className="px-4 py-8 sm:px-6 sm:py-10 lg:p-12 bg-[#1a1a1a] relative overflow-hidden">
      <div className="wide-section">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ x: -24, rotate: -0.4 }}
            whileInView={{ x: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 210, damping: 23, mass: 0.9 }}
            className="text-white space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl leading-tight font-semibold max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
              Your skills deserve transparent pricing
            </h2>

            <div className="space-y-6 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
              <div>
                <h3 className="text-[#ff8c00] text-xl sm:text-2xl font-semibold mb-3">
                  Price with clarity
                </h3>
                <div className="border-b-2 border-[#ff8c00] mb-3"></div>
                <p className="text-gray-300 text-base sm:text-lg">
                  Remove the guessing. Know exactly what your work is worth
                  every time.
                </p>
              </div>

              <div>
                <h3 className="text-[#ff8c00] text-xl sm:text-2xl font-semibold mb-3">
                  Your time has value
                </h3>
                <div className="border-b-2 border-[#ff8c00] mb-3"></div>
                <p className="text-gray-300 text-base sm:text-lg">
                  Set rates that reflect your experience and the real worth
                  behind every hour you invest.
                </p>
              </div>

              <div>
                <h3 className="text-[#ff8c00] text-xl sm:text-2xl font-semibold mb-3">
                  Price confidently. Attract confidently.
                </h3>
                <div className="border-b-2 border-[#ff8c00] mb-3"></div>
                <p className="text-gray-300 text-base sm:text-lg">
                  Clear, professional estimates help clients feel secure in
                  choosing you for their project.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Graphic Card */}
          <motion.div
            initial={{ x: 24, rotate: 1.2 }}
            whileInView={{ x: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 220, damping: 22, mass: 0.9 }}
            className="relative"
          >
            <div className="bg-[#ff8c00] rounded-[1.75rem] border-4 border-white p-6 sm:p-8 lg:p-12 relative overflow-hidden brutal-shadow aspect-[4/3] min-h-[260px] sm:min-h-[340px]">
              {/* Typography Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-[68px] sm:text-[110px] md:text-[140px] lg:text-[180px] font-bold text-[#cc6600] leading-none">
                  AUREA
                </h1>
              </div>

              {/* Diagonal Lines */}
              <div className="absolute top-0 right-0 w-full h-full">
                <div className="absolute top-[30%] left-0 right-0 h-1 bg-white transform rotate-25 origin-left"></div>
                <div className="absolute top-[50%] left-0 right-0 h-1 bg-white transform rotate-25 origin-left"></div>
                <div className="absolute top-[70%] left-0 right-0 h-1 bg-white transform rotate-25 origin-left"></div>
              </div>

              {/* Badge */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white rounded-full w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center border-4 border-black brutal-shadow-sm rotate-6 nb-sticker-slap">
                <span className="text-2xl sm:text-4xl font-bold text-black">82</span>
              </div>

              {/* Rotated Text */}
              <div className="absolute top-1/2 right-0 transform translate-x-[35%] sm:translate-x-1/2 -rotate-45 origin-center">
                <p className="text-white text-3xl sm:text-5xl lg:text-6xl font-['Archivo_Black'] whitespace-nowrap opacity-80">
                  .tools
                </p>
              </div>

              {/* Release Date */}
              <div className="absolute bottom-6 right-6 bg-black text-white px-3 py-1 text-xs font-mono">
                AUREA.TOOLS
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
