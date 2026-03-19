import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const navigate = useNavigate();
  const marqueeText =
    ' FAIR RATES  /  FAST ESTIMATES  /  NO GUESSWORK  /  BUILT FOR DESIGNERS  / ';

  return (
    <section className="relative overflow-hidden tool-pattern wide-section px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8 lg:px-12 lg:pt-8 lg:pb-10">
      <div>
        <motion.div
          initial={{ y: 24, rotate: -0.6 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.9 }}
          className="bg-white rounded-[2rem] border-4 border-black p-6 sm:p-8 md:p-12 lg:p-16 brutal-shadow-lg"
        >
          <div className="max-w-200 mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-['Poppins'] font-semibold mb-4 sm:mb-6 leading-tight">
              Fee Estimator made for{' '}
              <span className="text-[#FB8500] font-bold">Designers</span>
            </h1>
            
            <p className="text-gray-600 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-3xl mx-auto">
              Accurate, fast, designer-friendly fee estimations
            </p>
            
            <button
              type="button"
              onClick={() => navigate('/fee-estimator')}
              className="nb-pressable w-full sm:w-auto bg-[#FB8500] text-white px-6 sm:px-10 py-3 sm:py-4 font-black text-sm sm:text-lg uppercase tracking-[0.12em] sm:tracking-[0.14em] border-2 border-black shadow-[4px_4px_0_#000] hover:bg-black hover:text-[#FB8500]"
            >
              Start Calculating
            </button>
          </div>
        </motion.div>

        <div className="mt-5 sm:mt-7 border-4 border-black bg-[#FFEB3B] shadow-[4px_4px_0_#000] nb-marquee">
          <div className="nb-marquee-track py-2.5 sm:py-3 text-sm sm:text-lg font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] text-black">
            <span className="nb-marquee-segment pr-10">{marqueeText.repeat(3)}</span>
            <span className="nb-marquee-segment pr-10" aria-hidden="true">
              {marqueeText.repeat(3)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
