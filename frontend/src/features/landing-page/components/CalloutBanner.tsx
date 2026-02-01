import { motion } from "framer-motion";

export const CalloutBanner = () => {
  return (
    <section className="bg-[#1a1a1a] pb-24 pt-0 relative p-12">
      <div className="wide-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-4xl overflow-hidden brutal-shadow-lg"
        > 
          {/* Header */}
          <div className="bg-white py-4 text-center">
            <h2 className="text-4xl font-bold">
              Made for Designers
            </h2>
          </div>

          {/* Colorful Abstract Section */}
          <div className="relative h-150 overflow-hidden">
            {/* Background shapes */}
            <div className="absolute inset-0">
              {/* Top left - Green with purple circle */}
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#4CAF50]"></div>
              <div className="absolute top-[10%] left-[15%] w-50 h-50 rounded-full bg-[#9C27B0]"></div>
              <div className="absolute top-[5%] left-[25%] w-45 h-45 rounded-full bg-[#E1BEE7]"></div>

              {/* Top right - Blue with dark red */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#2196F3]"></div>
              <div className="absolute top-[15%] right-[10%] w-62.5 h-45 rounded-[20px] bg-[#8B0000] transform rotate-12"></div>

              {/* Bottom left - Yellow with pattern and pink circles */}
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#CDDC39]"></div>
              <div
                className="absolute bottom-[20%] left-[5%] w-full h-25"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, #333 10px, #333 12px)",
                }}
              ></div>
              <div className="absolute bottom-[15%] left-[20%] w-37.5 h-37.5 rounded-full bg-[#CE93D8]"></div>
              <div className="absolute bottom-[25%] left-[35%] w-30 h-30 rounded-full bg-[#CE93D8]"></div>

              {/* Bottom right - Black with orange A and orange */}
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-orange-900"></div>
              <div className="absolute bottom-[10%] right-[25%] text-white text-[200px] font-['Archivo_Black'] leading-none">
                A
              </div>
              <div className="absolute bottom-0 right-0 w-50 h-50 bg-[#FF5722] rounded-tl-full"></div>

              {/* Orange circle top right */}
              <div className="absolute top-[5%] right-[2%] w-25 h-25 rounded-full bg-[#FF6B35] border-4 border-black"></div>
            </div>

            {/* Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-start pl-12">
              <div className="max-w-125">
                <h3 className="text-[64px] md:text-7xl leading-tight font-semibold">
                  <span className="text-black">DON'T</span>
                  <br />
                  <span className="text-black">KNOW</span>
                  <br />
                  <span
                    className="text-[#CDDC39] [-webkit-text-stroke:2px_black]"
                    style={{ WebkitTextStroke: "2px black" }}
                  >
                    HOW
                  </span>
                  <br />
                  <span className="text-black">MUCH</span>
                  <br />
                  <span className="text-black">TO CHARGE?</span>
                </h3>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
