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
            } flex min-h-16 w-full items-center justify-start rounded-md bg-white p-4 text-left font-medium shadow-md transition hover:cursor-pointer hover:shadow-lg`}
            onClick={() => navigate(`/chat/${mod.id}`)}
          >
            <span className="module-name text-ellipsis" title={mod.name}>
              {mod.name}
            </span>
            <span className="ml-auto flex items-center">
              <ArrowRight size={20} className="text-gray-500" />
            </span>
          </button>
        ) : null,
      )}
    </div>
  );
};

export default Button;
