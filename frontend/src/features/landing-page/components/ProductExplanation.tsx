import { motion } from "framer-motion";

export const ProductExplanation = () => {
  return (
    <section className="bg-[#fafafa] py-24 wide-section p-12">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-4xl border-4 border-black p-8 md:p-12 brutal-shadow-lg relative"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Abstract Illustration */}
            <div className="relative h-100 rounded-[20px] overflow-hidden">
              <div className="absolute inset-0 bg-[#E8F5E9]">
                {/* Blue rectangle top left */}
                <div className="absolute top-[10%] left-[10%] w-30 h-20 bg-[#2196F3] rounded-lg border-3 border-black"></div>

                {/* Orange circles top right */}
                <div className="absolute top-[5%] right-[15%] w-20 h-20 rounded-full bg-[#FF5722]"></div>
                <div className="absolute top-[5%] right-[35%] w-20 h-20 rounded-full bg-[#FF5722]"></div>

                {/* Black container with orange "a" */}
                <div className="absolute bottom-[40%] left-[8%] w-35 h-45 bg-black rounded-[20px] p-4 flex items-center justify-center border-3 border-black">
                  <span className="text-[#FF5722] text-[100px] font-['Archivo_Black'] leading-none">
                    a
                  </span>
                </div>

                {/* Orange wavy shape left bottom */}
                <svg
                  className="absolute bottom-[5%] left-[5%] w-45 h-25"
                  viewBox="0 0 180 100"
                >
                  <path
                    d="M 10 50 Q 50 10, 90 50 T 170 50"
                    fill="#FF5722"
                    stroke="black"
                    strokeWidth="3"
                  />
                </svg>

                {/* Blue wavy shape center bottom */}
                <svg
                  className="absolute bottom-[5%] left-[35%] w-50 h-20"
                  viewBox="0 0 200 80"
                >
                  <ellipse
                    cx="100"
                    cy="40"
                    rx="90"
                    ry="30"
                    fill="#2196F3"
                    stroke="black"
                    strokeWidth="3"
                  />
                </svg>

                {/* Lime green center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-62.5 h-50 bg-[#CDDC39] rounded-[30px] -z-10"></div>
              </div>
            </div>

            {/* Right - Text Content */}
            <div className="space-y-6">
              <h2 className="text-[64px] font-bold mb-6 ">Use AUREA</h2>

              <p className="text-gray-700 text-lg leading-relaxed">
                Aurea helps designers price their work with confidence, clarity,
                and accuracy. By eliminating guesswork and ensuring fair
                compensation, Aurea empowers creatives to earn what they
                deserve, present transparent rates to clients, and build a more
                sustainable freelance career.
              </p>
            </div>
          </div>

          {/* Join Now Button - Bottom Right Corner, centered on border */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -bottom-8 -right-8 bg-[#ff8c00] text-black px-8 py-4 font-bold text-[32px] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all inline-flex items-center gap-2 z-10"
          >
            Join now
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
