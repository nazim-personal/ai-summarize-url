import type { JSX } from "react";

const Loader = (): JSX.Element => {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="loader-text">Summarizing, please wait...</p>
    </div>
  );
};

export default Loader;
