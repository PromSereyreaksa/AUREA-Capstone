import { useAuth } from "../../auth/context/AuthContext";
import Sidebar from "../../../shared/components/Sidebar";
import FeeEstimatorGrid from "./FeeEstimatorGrid";

const FeeEstimatorPage = () => {
  const { user } = useAuth();

  // Get user's first name or use default
  const getUserName = () => {
    if (user?.first_name) {
      return user.first_name;
    }

    if (user?.last_name) {
      return user.last_name;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "Designer";
  };

  return (
    <div
      className="flex min-h-screen flex-col gap-3 bg-[#FB8500] p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6 lg:flex-row"
      style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif" }}
    >
      <Sidebar userName={getUserName()} />

      <main className="flex-1 bg-[#FFFEF9] rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 md:gap-6 overflow-y-auto border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
        <header>
          <h1 className="text-2xl sm:text-3xl font-black text-[#FB8500] tracking-tight mb-2">
            Fee Estimation Options
          </h1>
        </header>

        <section className="flex-1 flex justify-center">
          <FeeEstimatorGrid />
        </section>
      </main>
    </div>
  );
};

export { FeeEstimatorPage };
export default FeeEstimatorPage;
