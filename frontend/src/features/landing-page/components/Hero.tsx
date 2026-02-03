import { motion } from 'framer-motion';

export const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden tool-pattern wide-section p-12">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-4xl border-4 border-black md:p-16 brutal-shadow-lg"
        >
          <div className="max-w-200 mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-['Poppins'] font-semibold mb-6 leading-tight">
              Fee Estimator made for{' '}
              <span className="text-[#FB8500] font-bold">Designers</span>
            </h1>
            
            <p className="text-gray-600 text-lg md:text-xl mb-10">
              Accurate, fast, designer-friendly fee estimations
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#FB8500] text-white px-10 py-4 font-medium text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-2 border-black"
            >
              Start Calculating
            </motion.button>
            
          </div>
        </motion.div>
            <div className="mt-16 flex flex-col items-center gap-2 text-black opacity-60">
              <span className="text-sm font-medium">Explore Features</span>
              <motion.svg
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M12 19l-7-7M12 19l7-7" />
              </motion.svg>
            </div>
      </div>
    </section>
  );
};