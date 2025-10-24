import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowRight } from "lucide-react";

const Button = ({ modules }) => {
  const navigate = useNavigate();
  const limitedModules = modules.slice(0, 4);

  return (
    <div className="main space-y-4">
      {limitedModules.map((mod, idx) =>
        mod ? (
          <button
            key={mod.id}
            className={`card${
              idx + 1
            } bg-white flex h-[4rem] w-full rounded-md p-4 font-medium justify-start items-center shadow-md hover:shadow-lg transition`}
            onClick={() => navigate(`/chat/${mod.id}`)}
          >
            <span className="module-name" title={mod.name}>
              {mod.name}
            </span>
            <span className="ml-auto flex items-center">
              <ArrowRight size={20} className="text-gray-500" />
            </span>
          </button>
        ) : null
      )}
    </div>
  );
};

export default Button;
