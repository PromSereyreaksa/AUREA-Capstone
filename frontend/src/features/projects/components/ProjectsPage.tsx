import Sidebar from "../../../shared/components/Sidebar";
import { useAuth } from "../../auth/context/AuthContext";

const ProjectsPage = () => {
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FB8500] p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6 font-sans">
      <Sidebar userName={getUserName()} />
      <main className="flex-1 bg-[#FFFEF9] rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 md:gap-6 overflow-y-auto border-[3px] border-black shadow-[2px_2px_0_#1a1a1a]">
        {/* Recent Projects Section */}
        <section className="flex-1">
          <h2 className="text-2xl font-extrabold text-black mb-6">
            My Projects
          </h2>
        </section>
      </main>
    </div>
  );
};

export default ProjectsPage;
