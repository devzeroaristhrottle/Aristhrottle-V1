import Image from "next/image";
import { useState } from "react";
import { Tooltip } from "./ui/tooltip";

type Props = {
  onClick?: () => void;
  classNames?: string;
};

export const Logo = ({ onClick, classNames }: Props) => {
  const [isHovering, setIsHovered] = useState(false);
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => setIsHovered(false);

  return (
    <Tooltip content="Vote" positioning={{ placement: "right-end" }}>
      <div
        onClick={() => {
          if (onClick) {
            onClick();
          }
        }}
        className={`flex items-center flex-shrink-0 cursor-pointer ${classNames}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div>
          {isHovering ? (
            <Image
              src={"/assets/vote/icon3.png"}
              width={30}
              height={30}
              alt="logo"
              className="transition-all duration-300 "
            />
          ) : (
            <Image
              src={"/assets/vote/icon2.png"}
              width={30}
              height={30}
              alt="logo"
              className="transition-all duration-300"
            />
          )}
        </div>
      </div>
    </Tooltip>
  );
};
