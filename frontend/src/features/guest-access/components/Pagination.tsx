export const Pagination = () => {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="font-md bg-[#FB8500] text-white w-8 h-8 rounded flex items-center justify-center">
        1
      </span>
      {[2, 3].map((num) => (
        <button
          key={num}
          className="font-md w-8 h-8 hover:bg-black hover:text-white transition text-black"
        >
          {num}
        </button>
      ))}
      <span className="font-md text-gray-600">...</span>
      <button className="font-md hover:bg-black hover:text-white transition text-black">
        10
      </button>
      <button className="font-md ml-2 hover:bg-black hover:text-white transition text-black">
        &gt;
      </button>
    </div>
  );
};
