import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowRight } from "lucide-react";

const Button = ({ modules }) => {
  const navigate = useNavigate();
  const limitedModules = modules.slice(0, 4);

  return (
    <div className="w-full space-y-3">
      {limitedModules.map((mod, idx) =>
        mod ? (
          <button
            key={mod.id}
            className="group flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left font-medium shadow-sm transition-all hover:border-[#6B4F4F] hover:shadow-md hover:cursor-pointer"
            onClick={() => navigate(`/chat/${mod.id}`)}
          >
            <div className="flex flex-col">
              <span className="text-base font-semibold text-gray-900" title={mod.name}>
                {mod.name}
              </span>
              {mod.code && (
                <span className="mt-1 text-xs text-gray-500">
                  {mod.code}
                </span>
              )}
            </div>
            <span className="flex items-center rounded-full bg-gray-100 p-2 transition-colors group-hover:bg-[#6B4F4F] group-hover:text-white">
              <ArrowRight size={18} />
            </span>
          </button>
        ) : null,
      )}
    </div>
  );
};

export default Button;
