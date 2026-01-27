import { motion } from 'framer-motion';

export const PricingFeature = () => {
  return (
    <section className="bg-[#1a1a1a] py-24 relative overflow-hidden">
      <div className="wide-section">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-['Archivo_Black'] leading-tight">
              Your skills deserve transparent pricing
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[#ff8c00] text-2xl font-bold mb-3">
                  Price with clarity
                </h3>
                <p className="text-gray-300 text-lg">
                  Remove the guessing. Know exactly what your work is worth every time.
                </p>
              </div>
              
              <div>
                <h3 className="text-[#ff8c00] text-2xl font-bold mb-3">
                  Your time has value
                </h3>
                <p className="text-gray-300 text-lg">
                  Set rates that reflect your experience and the real worth behind every hour you invest.
                </p>
              </div>
              
              <div>
                <h3 className="text-[#ff8c00] text-2xl font-bold mb-3">
                  Price confidently. Attract confidently.
                </h3>
                <p className="text-gray-300 text-lg">
                  Clear, professional estimates help clients feel secure in choosing you for their project.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Graphic Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-[#ff8c00] rounded-3xl border-4 border-white p-12 relative overflow-hidden brutal-shadow aspect-4/3">
              {/* Typography Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-[180px] font-bold text-[#cc6600] leading-none">
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
              <div className="absolute top-6 right-6 bg-white rounded-full w-20 h-20 flex items-center justify-center border-4 border-black brutal-shadow-sm">
                <span className="text-4xl font-bold text-black">82</span>
              </div>
              
              
              
              {/* Rotated Text */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -rotate-45 origin-center">
                <p className="text-white text-6xl font-['Archivo_Black'] whitespace-nowrap opacity-80">
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